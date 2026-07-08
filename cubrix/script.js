// --- RELÓGIO ---
function showTime() {
    const el = document.getElementById('currentTime');
    if (el) el.innerHTML = new Date().toUTCString();
}
showTime();
setInterval(showTime, 1000);

// --- SETUP ---
const boardCanvas = document.getElementById('game');
const ctx = boardCanvas.getContext('2d');
const COLS = 10, ROWS = 20, CELL_SIZE = boardCanvas.width / COLS;
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let score = 0, linesCleared = 0;

const PIECES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS = {
    I: '#21c064', O: '#f2c94c', T: '#f2994a',
    S: '#eb5757', Z: '#2d9cdb', J: '#9b51e0', L: '#56ccf2'
};

const nextCanvas = document.getElementById('nextBox');
const ctxNext = nextCanvas.getContext('2d');
nextCanvas.width = nextCanvas.height = 60;
const NEXT_CELL = nextCanvas.width / 4;

function drawNextPiece(type) {
    ctxNext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const piece = PIECES[type];
    piece.forEach((row, y) => row.forEach((v, x) => {
        if (v) {
            ctxNext.fillStyle = COLORS[type];
            ctxNext.fillRect(x * NEXT_CELL, y * NEXT_CELL, NEXT_CELL, NEXT_CELL);
            ctxNext.strokeStyle = '#0c1530';
            ctxNext.strokeRect(x * NEXT_CELL, y * NEXT_CELL, NEXT_CELL, NEXT_CELL);
        }
    }));
}

function drawBoard() {
    ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    board.forEach((row, y) => row.forEach((v, x) => {
        if (v) {
            ctx.fillStyle = COLORS[v];
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = '#0f1629';
            ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }));
}

function collide(board, piece, offset) {
    for (let y = 0; y < piece.length; y++)
        for (let x = 0; x < piece[y].length; x++)
            if (piece[y][x] && (board[y + offset.y] && board[y + offset.y][x + offset.x]) !== 0) return true;
    return false;
}

function merge(board, piece, offset, type) {
    piece.forEach((row, y) => row.forEach((v, x) => { if (v) board[y + offset.y][x + offset.x] = type; }));
}

function sweep() {
    let linesCount = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) if (board[y][x] === 0) continue outer;
        board.splice(y, 1); 
        board.unshift(Array(COLS).fill(0)); 
        y++; 
        linesCount++;
    }
    if (linesCount > 0) {
        linesCleared += linesCount; 
        score += linesCount * 100;
        document.getElementById('score').textContent = score;
        document.getElementById('lines').textContent = linesCleared;
    }
}

function rotate(piece) { return piece[0].map((_, i) => piece.map(row => row[i])).reverse(); }
function randomPiece() { return Object.keys(PIECES)[Math.floor(Math.random() * 7)]; }

let current = { type: null, piece: null, pos: { x: 0, y: 0 } };
let nextType = randomPiece();

function spawnPiece() {
    current.type = nextType;
    current.piece = PIECES[current.type];
    current.pos.x = Math.floor(COLS / 2 - current.piece[0].length / 2);
    current.pos.y = 0;
    nextType = randomPiece();
    drawNextPiece(nextType);
    if (collide(board, current.piece, current.pos)) {
        alert('Game Over! Pontos: ' + score);
        resetGame();
    }
}

function move(dir) { current.pos.x += dir; if (collide(board, current.piece, current.pos)) current.pos.x -= dir; }
function drop() {
    current.pos.y++;
    if (collide(board, current.piece, current.pos)) {
        current.pos.y--;
        merge(board, current.piece, current.pos, current.type);
        sweep();
        spawnPiece();
    }
    draw();
}

function rotatePiece() {
    const rotated = rotate(current.piece);
    const posX = current.pos.x;
    let offset = 0;
    current.piece = rotated;
    while (collide(board, current.piece, current.pos)) {
        current.pos.x += (offset = (offset > 0 ? -offset : 1));
        if (offset > rotated[0].length) {
            current.piece = rotate(rotate(rotate(rotated)));
            current.pos.x = posX;
            return;
        }
    }
}

function hardDrop() {
    while (!collide(board, current.piece, { x: current.pos.x, y: current.pos.y + 1 })) {
        current.pos.y++;
    }
    drop();
}

function draw() {
    drawBoard();
    current.piece.forEach((row, y) => row.forEach((v, x) => {
        if (v) {
            ctx.fillStyle = COLORS[current.type];
            ctx.fillRect((x + current.pos.x) * CELL_SIZE, (y + current.pos.y) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = '#0f1629';
            ctx.strokeRect((x + current.pos.x) * CELL_SIZE, (y + current.pos.y) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }));
}

let dropCounter = 0, dropInterval = 500, lastTime = 0;
function update(time = 0) {
    const delta = time - lastTime; lastTime = time;
    dropCounter += delta;
    if (dropCounter > dropInterval) { drop(); dropCounter = 0; }
    draw();
    requestAnimationFrame(update);
}

function resetGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0; 
    linesCleared = 0;
    document.getElementById('score').textContent = '0';
    document.getElementById('lines').textContent = '0';
    nextType = randomPiece();
    spawnPiece();
}
document.getElementById('restart').addEventListener('click', resetGame);

const keysToBlock = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
window.addEventListener('keydown', function (e) {
    if (keysToBlock.includes(e.key) || e.code === 'Space') e.preventDefault();
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') move(-1);
    else if (key === 'arrowright' || key === 'd') move(1);
    else if (key === 'arrowdown' || key === 's') drop();
    else if (key === 'arrowup' || key === 'w') rotatePiece();
    else if (e.code === 'Space') hardDrop();
    draw();
}, { passive: false });

window.addEventListener('wheel', e => e.preventDefault(), { passive: false });
window.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

spawnPiece();
update();
