import * as Raylib from 'raylib'
import { Rectangle, Vector2 } from 'raylib'

interface QTree {
    ne?: QTree,
    nw?: QTree,
    se?: QTree,
    sw?: QTree,
    bounds: Rectangle,
    cap: Number,
    points: Vector2[],
    split: boolean,
}

const QTree = (bounds: Rectangle, cap: Number): QTree => {
    return {
        bounds,
        cap,
        points: [],
        split: false,
    }
}

const checkBounds = (bounds: Rectangle, point: Vector2) => {
    return point.x >= bounds.x && point.x <= bounds.x + bounds.width
        && point.y >= bounds.y && point.y <= bounds.y + bounds.height
}

const splitQTree = (qtree: QTree) => {
    if (qtree.split) return

    const bounds = qtree.bounds
    const halfW = bounds.width / 2
    const halfH = bounds.height / 2

    qtree.nw = QTree({
        x: bounds.x,
        y: bounds.y,
        width: halfW,
        height: halfH,
    }, qtree.cap)
    qtree.ne = QTree({
        x: bounds.x + halfW,
        y: bounds.y,
        width: halfW,
        height: halfH,
    }, qtree.cap)
    qtree.sw = QTree({
        x: bounds.x,
        y: bounds.y + halfH,
        width: halfW,
        height: halfH,
    }, qtree.cap)
    qtree.se = QTree({
        x: bounds.x + halfW,
        y: bounds.y + halfH,
        width: halfW,
        height: halfH,
    }, qtree.cap)

    qtree.split = true
}

const checkAABB = (rect1: Rectangle, rect2: Rectangle): boolean => {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.height + rect1.y > rect2.y
}

const queryQTree = (qtree: QTree, bounds: Rectangle): Vector2[] => {
    if (!checkAABB(qtree.bounds, bounds)) return []

    let ret = qtree.points.filter(p => checkBounds(bounds, p))
    if (qtree.split) {
        ret = ret.concat(queryQTree(qtree.ne!, bounds))
        ret = ret.concat(queryQTree(qtree.nw!, bounds))
        ret = ret.concat(queryQTree(qtree.se!, bounds))
        ret = ret.concat(queryQTree(qtree.sw!, bounds))
    }

    return ret;
}

const addToQTree = (qtree: QTree, point: Vector2) => {
    if (!checkBounds(qtree.bounds, point)) return

    if (qtree.cap > qtree.points.length) {
        qtree.points.push(point)
        return
    }

    splitQTree(qtree)

    addToQTree(qtree.nw!, point)
    addToQTree(qtree.ne!, point)
    addToQTree(qtree.sw!, point)
    addToQTree(qtree.se!, point)
}

const drawQTree = (qtree: QTree) => {
    Raylib.DrawRectangleLines(
        qtree.bounds.x,
        qtree.bounds.y,
        qtree.bounds.width,
        qtree.bounds.height,
        Raylib.DARKGRAY
    );

    qtree.points.forEach(p => {
        Raylib.DrawCircle(p.x, p.y, 4, Raylib.DARKGRAY)
    });

    if (qtree.ne) drawQTree(qtree.ne)
    if (qtree.nw) drawQTree(qtree.nw)
    if (qtree.se) drawQTree(qtree.se)
    if (qtree.sw) drawQTree(qtree.sw)
}

const signum = (n: number): number => {
    if (n < 0) return -1
    if (n > 0) return 1
    return 0
}

const screenWidth = 800
const screenHeight = 450
Raylib.InitWindow(screenWidth, screenHeight, "raylib [core] example - basic window")
Raylib.SetTargetFPS(60)

const qtree = QTree({ x: 0, y: 0, width: screenWidth, height: screenHeight }, 4)
const queryRect: Rectangle = {
    x: 20,
    y: 20,
    width: 100,
    height: 70,
}

while (!Raylib.WindowShouldClose()) {
    if (Raylib.IsKeyPressed(Raylib.KEY_J)) addToQTree(qtree, {
        x: Raylib.GetRandomValue(0, screenWidth),
        y: Raylib.GetRandomValue(0, screenHeight),
    })
    const mouse = Raylib.GetMousePosition()
    queryRect.x = mouse.x - queryRect.width / 2
    queryRect.y = mouse.y - queryRect.height / 2

    if (Raylib.IsMouseButtonPressed(Raylib.MOUSE_BUTTON_LEFT))
        addToQTree(qtree, mouse)

    const { y: wheelY } = Raylib.GetMouseWheelMoveV()
    const mul = signum(wheelY)
    queryRect.width += mul * 10
    queryRect.height += mul * 7

    const points = queryQTree(qtree, queryRect)

    Raylib.BeginDrawing();
    Raylib.ClearBackground(Raylib.RAYWHITE)

    drawQTree(qtree)
    Raylib.DrawRectangleLines(queryRect.x,
        queryRect.y,
        queryRect.width,
        queryRect.height, Raylib.GREEN)

    points.forEach(p => {
        Raylib.DrawCircle(p.x, p.y, 6, Raylib.GREEN)
    })

    Raylib.EndDrawing()
}
Raylib.CloseWindow()
