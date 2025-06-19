const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const birdImg = new Image();
birdImg.src = "assets/bird.png";

// Sound Effects
const sounds = {
  start: new Audio("assets/sounds/start.mp3"),
  flap: new Audio("assets/sounds/flap.mp3"),
  fall: new Audio("assets/sounds/fall.mp3"),
  hit: new Audio("assets/sounds/hit.mp3"),
  score: new Audio("assets/sounds/score.mp3")
};

function playSound(name) {
  const sound = sounds[name];
  if (sound) {
    const clone = sound.cloneNode();
    clone.play().catch(err => console.error(`Error playing ${name}:`, err));
  }
}

let birdX = canvas.width / 2 - 50;
let birdY = canvas.height / 2;
let velocity = 0, gravity = 0, jump = 0, birdSize = 60;
let pipes = [], frameCount = 0, gameOver = false, gameStarted = false;
let difficultySelected = false, score = 0, paused = false;
let season = null;
let rainDrops = [], snowflakes = [], flowers = [], clouds = [];

function selectSeason(selectedSeason) {
  season = selectedSeason;
  document.getElementById("seasonButtons").style.display = "none";
  document.getElementById("difficultyButtons").style.display = "flex";
  playSound("start");

  if (season === 'spring') {
    flowers = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height - 100,
      flowerPositions: Array.from({ length: 4 }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 20 + Math.random() * 10
      }))
    }));
  } else if (season === 'monsoon') {
    rainDrops = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height
    }));
  } else if (season === 'winter') {
    snowflakes = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 1 + Math.random() * 2
    }));
  } else if (season === 'summer') {
    clouds = Array.from({ length: 5 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height / 3)
    }));
  }
}

function drawSeasonBackground() {
  if (!season) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#1e3c72");
    gradient.addColorStop(1, "#2a5298");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  switch (season) {
    case 'summer':
      ctx.fillStyle = '#87ceeb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.fillStyle = 'yellow';
      ctx.arc(canvas.width - 100, 100, 50, 0, Math.PI * 2);
      ctx.fill();
      clouds.forEach(cloud => {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, 30, 20, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x + 30, cloud.y + 10, 35, 25, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x + 60, cloud.y, 30, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        cloud.x -= 0.5;
        if (cloud.x + 90 < 0) {
          cloud.x = canvas.width + Math.random() * 100;
          cloud.y = Math.random() * (canvas.height / 3);
        }
      });
      break;

    case 'spring':
      ctx.fillStyle = '#b3f0ff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      flowers.forEach(tree => {
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(tree.x, tree.y, 14, 60);
        ctx.fillStyle = "#4CAF50";
        ctx.beginPath(); ctx.arc(tree.x + 7, tree.y - 20, 25, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tree.x - 3, tree.y - 15, 20, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tree.x + 23, tree.y - 15, 20, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tree.x + 7, tree.y - 40, 18, 0, Math.PI * 2); ctx.fill();

        tree.flowerPositions.forEach(pos => {
          const fx = tree.x + 7 + Math.cos(pos.angle) * pos.radius;
          const fy = tree.y - 20 + Math.sin(pos.angle) * (pos.radius * 0.75);
          ctx.beginPath();
          ctx.fillStyle = "pink";
          ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });

        tree.x -= 1;
        if (tree.x < -60) tree.x = canvas.width + Math.random() * 100;
      });
      break;

    case 'monsoon':
      ctx.fillStyle = '#455a64';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#90caf9';
      rainDrops.forEach(drop => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + 5, drop.y + 15);
        ctx.stroke();
        drop.y += 10;
        drop.x += 2;
        if (drop.y > canvas.height || drop.x > canvas.width) {
          drop.y = -10;
          drop.x = Math.random() * canvas.width;
        }
      });
      break;

    case 'winter':
      ctx.fillStyle = '#e0f7fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      snowflakes.forEach(snow => {
        ctx.beginPath();
        ctx.arc(snow.x, snow.y, 3, 0, Math.PI * 2);
        ctx.fill();
        snow.y += snow.speed;
        if (snow.y > canvas.height) {
          snow.y = 0;
          snow.x = Math.random() * canvas.width;
        }
      });
      break;
  }
}

function drawBird() {
  ctx.drawImage(birdImg, birdX - birdSize / 2, birdY - birdSize / 2, birdSize, birdSize);
}

function drawPipes() {
  ctx.fillStyle = "green";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, 50, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottom, 50, canvas.height - pipe.bottom);
  });
}

function update() {
  if (!gameStarted || gameOver || paused) return;
  velocity += gravity;
  birdY += velocity;
  frameCount++;

  if (frameCount % 90 === 0) {
    let topHeight = Math.random() * (canvas.height / 2) + 50;
    pipes.push({
      x: canvas.width,
      top: topHeight,
      bottom: topHeight + 120,
      passed: false
    });
  }

  pipes.forEach(pipe => {
    pipe.x -= 2;
    const buffer = 14;
    const birdLeft = birdX - birdSize / 2 + buffer;
    const birdRight = birdX + birdSize / 2 - buffer;
    const birdTop = birdY - birdSize / 2 + buffer;
    const birdBottom = birdY + birdSize / 2 - buffer;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + 50;

    if (
      birdRight > pipeLeft &&
      birdLeft < pipeRight &&
      (birdTop < pipe.top || birdBottom > pipe.bottom)
    ) {
      playSound("hit");
      endGame("hit");
    }

    if (!pipe.passed && pipe.x + 50 < birdX) {
      pipe.passed = true;
      score++;
      document.getElementById("scoreDisplay").textContent = `Score: ${score}`;
      playSound("score");
    }
  });

  if (birdY > canvas.height || birdY < 0) {
    playSound("fall");
    endGame("fall");
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSeasonBackground();
  drawBird();
  drawPipes();

  if (!gameStarted && !gameOver && difficultySelected) {
    ctx.fillStyle = "white";
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Press any key to start", canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver && !paused) requestAnimationFrame(loop);
}

function endGame(reason) {
  gameOver = true;
  document.getElementById("finalScore").textContent = `Score: ${score}`;
  document.getElementById("gameOverScreen").style.display = "flex";
}

function restartGame() {
  location.reload();
}

function goHome() {
  window.location.href = "../../index.html";
}

function setDifficulty(level) {
  switch (level) {
    case "easy": gravity = 0.25; jump = -4.5; break;
    case "medium": gravity = 0.35; jump = -6; break;
    case "hard": gravity = 0.45; jump = -7; break;
  }
  difficultySelected = true;
  document.getElementById("difficultyButtons").style.display = "none";
  document.getElementById("startMessage").style.display = "block";
}

function togglePause() {
  paused = !paused;
  if (!paused && gameStarted) loop();
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Escape") return togglePause();
  if (!gameStarted && difficultySelected) {
    gameStarted = true;
    document.getElementById("startMessage").style.display = "none";
    loop();
  }
  if (difficultySelected && !paused) {
    velocity = jump;
    playSound("flap");
  }
});

draw();
