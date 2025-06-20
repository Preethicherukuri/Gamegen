const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Load images
const runnerImg = new Image();
runnerImg.src = "assets/runner.png";

const obsImg = new Image();
obsImg.src = "assets/obstacle.png";

const coinImg = new Image();
coinImg.src = "assets/coin.png";

const bgImg = new Image();
bgImg.src = "assets/background.png";

// Game state
const gravity = 0.5;
let speed = 6;
let score = 0;
let obstacles = [];
let coins = [];
let bgX = 0;
let gameRunning = true;
let jumpCount = 0;
let obstacleTimer;
let coinTimer;
let animationId = null;
const maxJumps = 2;

const player = {
  x: 50,
  y: 0,
  width: 40,
  height: 40,
  dy: 0,
  jumpForce: -12,
  grounded: false
};

function getGroundLevel() {
  return canvas.height - 40;
}

function spawnObstacle() {
  obstacles.push({
    x: canvas.width,
    y: getGroundLevel() - 40,
    width: 30,
    height: 40
  });
}

function spawnCoin() {
  const baseY = getGroundLevel() - 80;
  const randomOffset = Math.random() * 100;
  coins.push({
    x: canvas.width,
    y: baseY - randomOffset,
    radius: 10
  });
}

function gameOver() {
  gameRunning = false;
  document.getElementById("finalScore").textContent = score;
  document.getElementById("gameOverScreen").classList.remove("hidden");

  // Stop game loop
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function update() {
  if (!gameRunning) return;

  const groundLevel = getGroundLevel();
  bgX -= speed / 2;
  if (bgX <= -canvas.width) bgX = 0;

  ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);

  // Difficulty scaling
  if (score >= 50) speed = 8;
  if (score >= 100) speed = 10;
  if (score >= 150) speed = 12;

  // Player physics
  player.dy += gravity;
  player.y += player.dy;

  if (player.y + player.height >= groundLevel) {
    player.y = groundLevel - player.height;
    player.dy = 0;
    player.grounded = true;
    jumpCount = 0;
  }

  ctx.drawImage(runnerImg, player.x, player.y, player.width, player.height);

  // Obstacles
  obstacles = obstacles.filter(obs => obs.x + obs.width > 0);
  for (let obs of obstacles) {
    obs.x -= speed;
    ctx.drawImage(obsImg, obs.x, obs.y, obs.width, obs.height);
    if (
      player.x < obs.x + obs.width &&
      player.x + player.width > obs.x &&
      player.y < obs.y + obs.height &&
      player.y + player.height > obs.y
    ) {
      gameOver();
    }
  }

  // Coins
  coins = coins.filter(c => c.x + c.radius > 0);
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i];
    c.x -= speed;
    ctx.drawImage(coinImg, c.x - 10, c.y - 10, 20, 20);
    if (
      player.x < c.x + c.radius &&
      player.x + player.width > c.x - c.radius &&
      player.y < c.y + c.radius &&
      player.y + player.height > c.y - c.radius
    ) {
      coins.splice(i, 1);
      score += 10;
    }
  }

  // Ground
  ctx.fillStyle = "green";
  ctx.fillRect(0, groundLevel, canvas.width, canvas.height - groundLevel);

  // Score
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 20, 30);

  animationId = requestAnimationFrame(update);
}

// Start or Restart the game
function startGame() {
  // Reset all values
  player.y = 0;
  player.dy = 0;
  jumpCount = 0;
  score = 0;
  speed = 6;
  obstacles = [];
  coins = [];
  gameRunning = true;
  document.getElementById("gameOverScreen").classList.add("hidden");

  // Clear previous intervals
  clearInterval(obstacleTimer);
  clearInterval(coinTimer);

  // Cancel previous loop
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // Start new intervals
  obstacleTimer = setInterval(spawnObstacle, 1500);
  coinTimer = setInterval(spawnCoin, 2000);

  // Start new loop
  animationId = requestAnimationFrame(update);
}

// Initial game start
startGame();

// Controls
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (jumpCount < maxJumps) {
      player.dy = player.jumpForce;
      player.grounded = false;
      jumpCount++;
    }
  }
});

// Fullscreen toggle
document.getElementById("fullscreenBtn").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Retry button
document.getElementById("retryBtn").addEventListener("click", () => {
  startGame();
});
