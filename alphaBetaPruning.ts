import * as Raylib from 'raylib'

interface Move {
    position: [number, number]
    figure: string
}

interface Position {
    score: number
    field: string[][]
}

function alphabeta(field: string[][], depth: number, alpha: number, beta: number, maximizingPlayer: boolean): Position {
    let thisA = alpha
    let thisB = beta
    const moves = availableMoves(field, maximizingPlayer ? 'cross' : 'circle')
    if (depth === 0 || moves.length === 0) {
        return { field, score: score(field) }
    }
    if (maximizingPlayer) {
        let position = { field, score: -Infinity }
        for (let move of moves) {
            const child = doMove(field, move)

            const pos = alphabeta(child, depth - 1, thisA, thisB, false)
            if (position.score <= pos.score) {
                position.field = child
                position.score = pos.score

                thisA = Math.max(thisA, position.score)
                //if (thisA >= thisB) break // β cutoff
            }
        }
        return position
    } else {
        let position = { field, score: Infinity }
        for (let move of moves) {
            const child = doMove(field, move)

            const pos = alphabeta(child, depth - 1, thisA, thisB, true)
            if (position.score >= pos.score) {
                position.field = child
                position.score = pos.score

                thisB = Math.min(thisB, position.score)
                //if (thisA >= thisB) break // α cutoff
            }
        }
        return position
    }
}

const figures = new Map([
    ['none', 0],
    ['cross', 1],
    ['circle', -1],
])

function score(field: string[][]): number {
    const cross = 'cross'
    const circle = 'circle'
    for (const row of field) {
        if (row.every(fig => fig === cross)) return 1
        if (row.every(fig => fig === circle)) return -1
    }
    for (let i = 0; i < field[0].length; i++) {
        if (field[0][i] === cross
            && field[1][i] === cross
            && field[2][i] === cross) return 1
        if (field[0][i] === circle
            && field[1][i] === circle
            && field[2][i] === circle) return -1
    }
    if (field[0][0] === cross
       && field[1][1] === cross
       && field[2][2] === cross) return 1
    if (field[0][2] === cross
       && field[1][1] === cross
       && field[2][0] === cross) return 1

    if (field[0][0] === circle
       && field[1][1] === circle
       && field[2][2] === circle) return -1
    if (field[0][2] === circle
       && field[1][1] === circle
       && field[2][0] === circle) return -1

    return 0
}

function checkWinner(field: string[][]): string | undefined {
    const s = score(field)
    if (s === 1) return 'cross'
    if (s === -1) return 'circle'
    if (field.flat().every(v => v !== 'none')) return 'none'
    return undefined
}

function availableMoves(field: string[][], player: string): Move[] {
    let ret: Move[] = []
    for (let i = 0; i < field.length; i++) {
        for (let j = 0; j < field[i].length; j++) {
            if (field[i][j] === 'none') ret.push({
                position: [i, j],
                figure: player,
            })
        }
    }
    return ret
}

function doMove(field: string[][], move: Move): string[][] {
    const { position, figure } = move

    const ret = field.map(r => r.map(v => v))
    ret[position[0]][position[1]] = figure
    return ret
}

function findOptimal(field: string[][], player: string) {
    return alphabeta(field, 10, -Infinity, Infinity, player === 'cross')
}


let field = [
    ['none', 'none', 'none'],
    ['none', 'none', 'none'],
    ['none', 'none', 'none'],
]
let currentPlayer = 'cross'
let winner = undefined

const screenWidth = 800
const screenHeight = 450
const gridS = 150
const figPad = 10
const centerPad = (800 - 450) * 0.5

Raylib.InitWindow(screenWidth, screenHeight, "raylib [core] example - basic window")
Raylib.SetTargetFPS(60)

function isValidMove(field: string[][], move: Move): boolean {
    if (move.position[0] < 0 || move.position[0] > 3
        || move.position[1] < 0 || move.position[1] > 3) return false;

    if (field[move.position[0]][move.position[1]] === 'none') return true;

    return false;
}

while (!Raylib.WindowShouldClose()) {
    winner = checkWinner(field)
    if (!winner) {
        if (currentPlayer === 'circle') {
            field = findOptimal(field, currentPlayer).field
            currentPlayer = 'cross'
        } else if (Raylib.IsMouseButtonPressed(Raylib.MOUSE_BUTTON_LEFT)) {
            const mousePos = Raylib.GetMousePosition()
            const m: Move = {
                position: [Math.floor(mousePos.y / gridS), Math.floor((mousePos.x - centerPad) / gridS)],
                figure: 'cross',
            }
            if (isValidMove(field, m)) {
                field = doMove(field, m)
                currentPlayer = 'circle'
            }
        }
        winner = checkWinner(field)
    }
    if (winner) {
        Raylib.DrawText(winner, 10, 10, 14, Raylib.DARKGREEN)
    }

    if (Raylib.IsKeyPressed(Raylib.KEY_R)) {
        field = [
            ['cross', 'circle', 'circle'],
            ['none', 'none', 'circle'],
            ['none', 'none', 'none'],
        ]
    }

    Raylib.BeginDrawing();
    Raylib.ClearBackground(Raylib.RAYWHITE)

    Raylib.DrawLine(gridS + centerPad, 0, gridS + centerPad, screenHeight, Raylib.DARKGRAY)
    Raylib.DrawLine(gridS * 2 + centerPad, 0, gridS * 2 + centerPad, screenHeight, Raylib.DARKGRAY)
    Raylib.DrawLine(0 + centerPad, gridS, gridS * 3 + centerPad, gridS, Raylib.DARKGRAY)
    Raylib.DrawLine(0 + centerPad, gridS * 2, gridS * 3 + centerPad, gridS * 2, Raylib.DARKGRAY)

    for (let i = 0; i < field.length; i++) {
        for (let j = 0; j < field[i].length; j++) {
            const col = field[i][j]
            switch (col) {
                case 'cross':
                    Raylib.DrawLine(j * gridS + figPad + centerPad,
                                    i * gridS + figPad,
                                    (j + 1) * gridS - figPad + centerPad,
                                    (i + 1) * gridS - figPad,
                                    Raylib.DARKGRAY)
                    Raylib.DrawLine((j + 1) * gridS - figPad + centerPad,
                                    i * gridS + figPad,
                                    j * gridS + figPad + centerPad,
                                    (i + 1) * gridS - figPad,
                                    Raylib.DARKGRAY)
                    break;
                case 'circle':
                    Raylib.DrawCircleLines((j + 0.5) * gridS + centerPad,
                                           (i + 0.5) * gridS,
                                           gridS * 0.5 - figPad,
                                           Raylib.DARKGRAY)
                    break;
                default: break;
            }
        }
    }

    Raylib.EndDrawing()
}
Raylib.CloseWindow()
