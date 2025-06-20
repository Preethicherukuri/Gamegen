const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const uiBgImg = new Image();
uiBgImg.src = "assets/backgrounds/select.jpg"; // make sure path is correct
uiBgImg.onload = () => {
  draw(); // only call draw after image is fully loaded
};

const birdImg1 = new Image();
birdImg1.src = "assets/bird1.png"; // default idle

const birdImg2 = new Image();
birdImg2.src = "assets/bird2.png"; // flapping frame

let currentBirdImg = birdImg1;
let birdWidth = 35;   // slimmed width
let birdHeight = 55;  // keep original height if okay

let flapTimeout = null;


// Sound Effects
const sounds = {
  start: new Audio("assets/sounds/start.mp3"),
  flap: new Audio("assets/sounds/flap.mp3"),
  fall: new Audio("assets/sounds/fall.mp3"),
  hit: new Audio("assets/sounds/hit.mp3"),
  score: new Audio("assets/sounds/score.mp3")
};

const summerBgImg = new Image();
summerBgImg.src = "assets/backgrounds/summer.jpg";
let summerBgX = 0;

const springBgImg = new Image();
springBgImg.src = "assets/backgrounds/spring.png";
let springBgX = 0;

const monsoonBgImg = new Image();
monsoonBgImg.src = "assets/backgrounds/rainy.png";
let monsoonBgX = 0;

const winterBgImg = new Image();
winterBgImg.src = "assets/backgrounds/winter.png";
let winterBgX = 0;



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
    gradient.addColorStop(0, "#ff416c");
    gradient.addColorStop(1, "#ff4b2b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  switch (season) {
    case 'summer':
      summerBgX -= 1;
      if (summerBgX <= -canvas.width) {
        summerBgX = 0;
      }
      ctx.drawImage(summerBgImg, summerBgX, 0, canvas.width, canvas.height);
      ctx.drawImage(summerBgImg, summerBgX + canvas.width, 0, canvas.width, canvas.height);
      drawSun(ctx);
      break;

    case 'spring':
      springBgX -= 1;
      if (springBgX <= -canvas.width) {
        springBgX = 0;
      }
      ctx.drawImage(springBgImg, springBgX, 0, canvas.width, canvas.height);
      ctx.drawImage(springBgImg, springBgX + canvas.width, 0, canvas.width, canvas.height);
      break;

    case 'monsoon':
      monsoonBgX -= 1;
      if (monsoonBgX <= -canvas.width) {
        monsoonBgX = 0;
      }
      ctx.drawImage(monsoonBgImg, monsoonBgX, 0, canvas.width, canvas.height);
      ctx.drawImage(monsoonBgImg, monsoonBgX + canvas.width, 0, canvas.width, canvas.height);
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
      winterBgX -= 1;
      if (winterBgX <= -canvas.width) {
        winterBgX = 0;
      }
      ctx.drawImage(winterBgImg, winterBgX, 0, canvas.width, canvas.height);
      ctx.drawImage(winterBgImg, winterBgX + canvas.width, 0, canvas.width, canvas.height);
      break;
  }
}

function drawSun(ctx) {
  ctx.beginPath();
  ctx.fillStyle = 'yellow';
  ctx.arc(canvas.width - 100, 100, 50, 0, Math.PI * 2);
  ctx.fill();
}

function drawBird() {
  ctx.drawImage(currentBirdImg, birdX - birdWidth / 2, birdY - birdHeight / 2, birdWidth, birdHeight);
}



function drawPipes() {
  pipes.forEach(pipe => {
    switch (season) {
      case 'summer':
        ctx.fillStyle = "#a0522d"; // brownish red
        break;
      case 'spring':
        ctx.fillStyle = "#4caf50"; // fresh green
        break;
      case 'winter':
        ctx.fillStyle = "#81d4fa"; // icy blue
        break;
      case 'monsoon':
        ctx.fillStyle = "#263238"; // deep black
        break;
      default:
        ctx.fillStyle = "green";
    }

    // Draw top and bottom pipe rectangles
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

  // Draw background depending on state
  if (!gameStarted) {
    // If UI background exists, draw it during menu states
    ctx.drawImage(uiBgImg, 0, 0, canvas.width, canvas.height);
  } else {
    drawSeasonBackground();
  }

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

    // Show flapping bird briefly
    currentBirdImg = birdImg2;
    clearTimeout(flapTimeout);
    flapTimeout = setTimeout(() => {
      currentBirdImg = birdImg1;
    }, 100); // 100ms flap
  }
});



draw();