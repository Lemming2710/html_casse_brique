const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');
const startButton = document.getElementById('startButton');

// Offscreen canvas for bricks layer
const bricksCanvas = document.createElement('canvas');
bricksCanvas.width = canvas.width;
bricksCanvas.height = canvas.height;
const bricksCtx = bricksCanvas.getContext('2d');

const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

const ballRadius = 8;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 3;
let dy = -3;

const brickRowCount = 5;
const brickColumnCount = 8;
const brickWidth = 50;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 15;

let score = 0;
let gameStarted = false;
let gameOver = false;

// Couleurs pour les briques
const brickColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];

// Precompute brick data and positions
const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
    const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
    bricks[c][r] = {
      x: brickX,
      y: brickY,
      status: 1,
      color: brickColors[Math.floor(Math.random() * brickColors.length)]
    };
  }
}

let rightPressed = false;
let leftPressed = false;

// Passive listeners to avoid blocking scrolling (good practice)
document.addEventListener('keydown', keyDownHandler, { passive: true });
document.addEventListener('keyup', keyUpHandler, { passive: true });

function keyDownHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    rightPressed = true;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    rightPressed = false;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    leftPressed = false;
  }
}

// Fast collision by mapping ball position to grid indices
function hitTestBricks(ballX, ballY) {
  const relativeX = ballX - brickOffsetLeft;
  const relativeY = ballY - brickOffsetTop;
  if (relativeX < 0 || relativeY < 0) return null;

  const stepX = brickWidth + brickPadding;
  const stepY = brickHeight + brickPadding;

  const c = Math.floor(relativeX / stepX);
  const r = Math.floor(relativeY / stepY);

  if (c < 0 || c >= brickColumnCount || r < 0 || r >= brickRowCount) return null;

  const cellOriginX = c * stepX;
  const cellOriginY = r * stepY;
  const offsetInCellX = relativeX - cellOriginX;
  const offsetInCellY = relativeY - cellOriginY;

  if (offsetInCellX <= brickWidth && offsetInCellY <= brickHeight) {
    return { c, r };
  }
  return null;
}

function handleBrickHit(c, r) {
  const b = bricks[c][r];
  if (b.status !== 1) return;
  b.status = 0;
  score += 10;
  scoreElement.textContent = score;
  eraseBrick(b);

  if (score === brickRowCount * brickColumnCount * 10) {
    gameOver = true;
    messageElement.textContent = "Félicitations ! Vous avez gagné !";
    startButton.style.display = 'block';
    startButton.textContent = 'Rejouer';
  }
}

function collisionDetection() {
  const hit = hitTestBricks(x, y);
  if (hit) {
    dy = -dy;
    handleBrickHit(hit.c, hit.r);
  }
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#0095DD';
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.fillStyle = '#0095DD';
  ctx.fillRect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
}

function renderBricksLayer() {
  bricksCtx.clearRect(0, 0, bricksCanvas.width, bricksCanvas.height);
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        bricksCtx.fillStyle = b.color;
        bricksCtx.fillRect(b.x, b.y, brickWidth, brickHeight);
        bricksCtx.strokeStyle = '#000';
        bricksCtx.strokeRect(b.x, b.y, brickWidth, brickHeight);
      }
    }
  }
}

function eraseBrick(brick) {
  bricksCtx.clearRect(brick.x - 1, brick.y - 1, brickWidth + 2, brickHeight + 2);
}

function draw() {
  if (!gameStarted || gameOver) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bricksCanvas, 0, 0);
  drawBall();
  drawPaddle();
  collisionDetection();

  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }
  if (y + dy < ballRadius) {
    dy = -dy;
  } else if (y + dy > canvas.height - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      dy = -dy;
    } else {
      gameOver = true;
      messageElement.textContent = "Game Over !";
      startButton.style.display = 'block';
      startButton.textContent = 'Rejouer';
      return;
    }
  }

  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += 7;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= 7;
  }

  x += dx;
  y += dy;
  requestAnimationFrame(draw);
}

startButton.addEventListener('click', () => {
  resetGame();
  gameStarted = true;
  startButton.style.display = 'none';
  messageElement.textContent = 'Bonne chance !';
  setTimeout(() => {
    if (gameStarted) messageElement.textContent = '';
  }, 2000);
  draw();
});

function resetGame() {
  score = 0;
  scoreElement.textContent = score;
  x = canvas.width / 2;
  y = canvas.height - 30;
  dx = 3;
  dy = -3;
  paddleX = (canvas.width - paddleWidth) / 2;
  
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r].status = 1;
      bricks[c][r].color = brickColors[Math.floor(Math.random() * brickColors.length)];
    }
  }
  renderBricksLayer();
  
  gameOver = false;
  messageElement.textContent = '';
}

// Afficher le message initial
messageElement.textContent = 'Cliquez sur "Commencer le jeu" pour démarrer !';
