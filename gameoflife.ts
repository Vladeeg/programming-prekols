import * as Raylib from 'raylib'
import { Vector2 } from 'raylib'

interface Perlin {
    gradients: Vector2[][];
    memory: number[][];
    rand_vect(): Vector2;
    dot_prod_grid(x: number, y: number, vx: number, vy: number): number;
    smootherstep(x: number): number;
    interp(x: number, a: number, b: number): number;
    get(x: number, y: number): number;
}

let perlin: Perlin = {
    gradients: [],
    memory: [],
    rand_vect: function(){
        let theta = Math.random() * 2 * Math.PI;
        return {x: Math.cos(theta), y: Math.sin(theta)};
    },
    dot_prod_grid: function(x: number, y: number, vx: number, vy: number){
        let g_vect;
        let d_vect = {x: x - vx, y: y - vy};
        if (this.gradients[vx]?.[vy]){
            g_vect = this.gradients[vx][vy];
        } else {
            g_vect = this.rand_vect();
            this.gradients[vx] = this.gradients[vx] || [];
            this.gradients[vx][vy] = g_vect;
        }
        return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    },
    smootherstep: function(x: number){
        return 6*x**5 - 15*x**4 + 10*x**3;
    },
    interp: function(x: number, a: number, b: number){
        return a + this.smootherstep(x) * (b-a);
    },
    get: function(x: number, y: number) {
        if (this.memory[x]?.[y] !== undefined)
            return this.memory[x][y];
        let xf = Math.floor(x);
        let yf = Math.floor(y);
        //interpolate
        let tl = this.dot_prod_grid(x, y, xf,   yf);
        let tr = this.dot_prod_grid(x, y, xf+1, yf);
        let bl = this.dot_prod_grid(x, y, xf,   yf+1);
        let br = this.dot_prod_grid(x, y, xf+1, yf+1);
        let xt = this.interp(x-xf, tl, tr);
        let xb = this.interp(x-xf, bl, br);
        let v = this.interp(y-yf, xt, xb);
        this.memory[x] = this.memory[x] || [];
        this.memory[x][y] = v;
        return v;
    }
}

const screenWidth = 800
const screenHeight = 450

const scale = 10
let grid: number[][] = []

const initPerlin = (): number[][] => {
    let grid: number[][] = []
    for (let i = 0; i < screenWidth / scale; i++) {
        grid[i] = []
        for (let j = 0; j < screenHeight / scale; j++)
            grid[i][j] = Math.round(perlin.get(i + Math.random(), j + Math.random()) * 0.5 + 0.5)
    }
    return grid
}

const initGrid = (): number[][] => {
    let grid: number[][] = []
    for (let i = 0; i < screenWidth / scale; i++) {
        grid[i] = []
        for (let j = 0; j < screenHeight / scale; j++)
            grid[i][j] = 0
    }
    return grid
}

let saveState = initGrid()
grid = initGrid()

const countNeighbors = (grid: number[][], x: number, y: number) => {
    let sum = 0
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            sum += grid[(x + grid.length + i) % grid.length][(y + grid[0].length + j) % grid[0].length]
        }
    }
    return sum - grid[x][y]
}

let state = false

Raylib.InitWindow(screenWidth, screenHeight, "raylib [core] example - basic window")
Raylib.SetTargetFPS(60)
let fps = 20
let frame = 0

while (!Raylib.WindowShouldClose()) {
    const mouse = Raylib.GetMousePosition()
    if (Raylib.IsKeyPressed(Raylib.KEY_K)) {
        state = !state
    }

    const x = Math.floor(mouse.x / scale)
    const y = Math.floor(mouse.y / scale)
    if (Raylib.IsMouseButtonDown(Raylib.MOUSE_BUTTON_LEFT)) {
        grid[x][y] = 1
    }
    if (Raylib.IsMouseButtonDown(Raylib.MOUSE_BUTTON_RIGHT)) {
        grid[x][y] = 0
    }

    if (Raylib.IsKeyReleased(Raylib.KEY_J)) grid = initGrid()
    if (Raylib.IsKeyReleased(Raylib.KEY_P)) grid = initPerlin()
    if (Raylib.IsKeyReleased(Raylib.KEY_H)) {
        fps -= 5
    }
    if (Raylib.IsKeyReleased(Raylib.KEY_L)) {
        fps += 5
    }

    if (Raylib.IsKeyReleased(Raylib.KEY_U)) {
        saveState = grid
    }
    if (Raylib.IsKeyReleased(Raylib.KEY_I)) {
        grid = saveState
    }

    if (frame % Math.floor(60 / fps) == 0) {
        if (state) {
            let next: number[][] = []
            for (let i = 0; i < grid.length; i++) {
                next[i] = grid[i].slice()
                for (let j = 0; j < grid[0].length; j++) {
                    const v = grid[i][j]

                    const n = countNeighbors(grid, i, j)

                    if (v == 0 && (n == 3)) next[i][j] = 1
                    if (v == 1 && (n < 2 || n > 3)) next[i][j] = 0
                }
            }
            grid = next
        }
    }

    Raylib.BeginDrawing();
    Raylib.ClearBackground(Raylib.RAYWHITE)

    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
            Raylib.DrawRectangle(i * scale, j * scale, scale, scale, grid[i][j] ? Raylib.BLACK : Raylib.RAYWHITE)
            Raylib.DrawRectangleLines(i * scale - 1, j * scale - 1, scale + 1, scale + 1, !grid[i][j] ? Raylib.LIGHTGRAY : Raylib.LIGHTGRAY)
        }
    }

    Raylib.DrawRectangleLines(x * scale, y * scale, scale, scale, Raylib.GREEN)
    Raylib.EndDrawing()

    frame++
}
Raylib.CloseWindow()
