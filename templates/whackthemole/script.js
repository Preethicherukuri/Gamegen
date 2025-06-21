const planets = [
  { name: 'Mercury', holes: 2 },
  { name: 'Venus', holes: 3 },
  { name: 'Earth', holes: 4 },
  { name: 'Mars', holes: 5 },
  { name: 'Jupiter', holes: 6 },
  { name: 'Saturn', holes: 7 },
  { name: 'Uranus', holes: 8 },
  { name: 'Neptune', holes: 9 },
];

let gameState = {
  currentPlanetIndex: 0,
  currentLevel: 1,
  score: 0,
  unlockedPlanets: [0],
  maxLevelPerPlanet: [1],
};

// 🔊 Sound Effects
const sounds = {
  start: new Audio('audio/start.mp3'),
  hit: new Audio('audio/hit.mp3'),
  hurt: new Audio('audio/hurt.mp3'),
  end: new Audio('audio/end.mp3'),
};

// DOM Elements
const levelSelector = document.getElementById('levelSelector');
const levelButtons = document.getElementById('levelButtons');
const overlay = document.getElementById('overlay');
const goalScreen = document.getElementById('goalScreen');
const goalText = document.getElementById('goalText');
const holesContainer = document.getElementById('gameArea');
const planetName = document.getElementById('planetName');
const levelNumber = document.getElementById('levelNumber');
const scoreBoard = document.getElementById('score');
const timeBoard = document.getElementById('time');
const planetSelector = document.getElementById('planetSelector');

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmRestart = document.getElementById('confirmRestart');
const cancelRestart = document.getElementById('cancelRestart');

const endScreen = document.getElementById('endScreen');
const endMessage = document.getElementById('endMessage');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const restartBtnFinal = document.getElementById('restartBtnFinal');
const homeBtn = document.getElementById('homeBtn');

let timer, moleTimer;
let timeUp = false;
let requiredHits = 5;

// Save and Load
function saveProgress() {
  localStorage.setItem('planetMoleProgress', JSON.stringify(gameState));
}

function loadProgress() {
  const saved = localStorage.getItem('planetMoleProgress');
  if (saved) {
    gameState = JSON.parse(saved);
  }
}

// UI Functions
function setBackground(screen) {
  switch (screen) {
    case 'select':
      document.body.style.backgroundImage = "url('images/bg_select.png')";
      break;
    case 'levels':
      document.body.style.backgroundImage = "url('images/bg_levels.png')";
      break;
    case 'goal':
      document.body.style.backgroundImage = "url('images/bg_goal.png')";
      break;
    case 'planet':
      const planet = planets[gameState.currentPlanetIndex].name.toLowerCase();
      document.body.style.backgroundImage = `url('images/${planet}.jpg')`;
      break;
    default:
      document.body.style.backgroundImage = '';
  }
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundAttachment = 'fixed';
}

function setupPlanetButtons() {
  planetSelector.innerHTML = '';
  planets.forEach((planet, idx) => {
    const btn = document.createElement('button');
    btn.textContent = planet.name;
    btn.classList.add('planet-button');
    if (!gameState.unlockedPlanets.includes(idx)) {
      btn.disabled = true;
      btn.classList.add('locked');
    }
    btn.addEventListener('click', () => {
      gameState.currentPlanetIndex = idx;
      setBackground('levels');
      showLevelSelector();
    });
    planetSelector.appendChild(btn);
  });
  setBackground('select');
}

function showLevelSelector() {
  levelButtons.innerHTML = '';
  const maxLevel = gameState.maxLevelPerPlanet[gameState.currentPlanetIndex] || 1;
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.textContent = `Level ${i}`;
    if (i <= maxLevel) {
      btn.classList.add('unlocked-level');
      btn.addEventListener('click', () => {
        gameState.currentLevel = i;
        showGoalMessage();
      });
    } else {
      btn.disabled = true;
      btn.classList.add('locked-level');
    }
    levelButtons.appendChild(btn);
  }
  planetSelector.classList.add('hidden');
  levelSelector.classList.remove('hidden');
}

function showGoalMessage() {
    document.querySelector('.planet-heading')?.classList.add('hidden');
  requiredHits = 4 + gameState.currentLevel;
  goalText.textContent = `🎯 Hit ${requiredHits} moles in 30 seconds to unlock the next level!`;
  levelSelector.classList.add('hidden');
  goalScreen.classList.remove('hidden');
  setBackground('goal');
}

function updateUI() {
  planetName.textContent = planets[gameState.currentPlanetIndex].name;
  levelNumber.textContent = gameState.currentLevel;
  scoreBoard.textContent = 0;
  timeBoard.textContent = 30;
  setupHoles(planets[gameState.currentPlanetIndex].holes);
}

function setupHoles(count) {
  holesContainer.innerHTML = '';
  holesContainer.style.display = 'flex';
  holesContainer.style.flexDirection = 'column';
  holesContainer.style.alignItems = 'center';
  holesContainer.style.gap = '15px';

  // Function to split holes into balanced rows
  const splitIntoRows = (count) => {
    if (count <= 4) return [count]; // Single row
    if (count === 5) return [3, 2];
    if (count === 6) return [3, 3];
    if (count === 7) return [4, 3];
    if (count === 8) return [4, 4];
    if (count === 9) return [5, 4];
    // default fallback
    const rows = [];
    while (count > 0) {
      const rowSize = Math.min(4, count);
      rows.push(rowSize);
      count -= rowSize;
    }
    return rows;
  };

  const rows = splitIntoRows(count);

  for (let r = 0, i = 0; r < rows.length; r++) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'center';
    row.style.gap = '15px';

    for (let j = 0; j < rows[r]; j++, i++) {
      const hole = document.createElement('div');
      hole.classList.add('hole');

      const mole = document.createElement('div');
      mole.classList.add('mole');

      hole.appendChild(mole);
      row.appendChild(hole);
    }

    holesContainer.appendChild(row);
  }
}


function randomHole() {
  const holes = document.querySelectorAll('.hole');
  const idx = Math.floor(Math.random() * holes.length);
  return holes[idx];
}

function peep(speed) {
  const hole = randomHole();
  hole.classList.add('up');
  moleTimer = setTimeout(() => {
    hole.classList.remove('up');
    if (!timeUp) peep(speed);
  }, speed);
}

function startGame() {
    sounds.start.play();  // 🔊 Play start sound
  document.body.classList.add('hammer-active'); // 🔨 add here

  gameState.score = 0;
  requiredHits = 4 + gameState.currentLevel;
  scoreBoard.textContent = gameState.score;

  let timeLeft = 30;
  const levelSpeed = Math.max(300, 1000 - gameState.currentLevel * 60);

  startBtn.style.display = 'none';
  restartBtn.style.display = 'none';

  peep(levelSpeed);
  timeBoard.textContent = timeLeft;
  timeUp = false;
  clearInterval(timer);

  timer = setInterval(() => {
    timeLeft--;
    timeBoard.textContent = timeLeft;
    if (timeLeft <= 0) {
      timeUp = true;
      clearInterval(timer);
      clearTimeout(moleTimer);
      checkLevelComplete();
    }
  }, 1000);
}


function checkLevelComplete() {
  const success = gameState.score >= requiredHits;
  const currPlanet = gameState.currentPlanetIndex;
  const currLevel = gameState.currentLevel;

  tryAgainBtn.classList.remove('hidden');
  restartBtnFinal.classList.remove('hidden');
  homeBtn.classList.remove('hidden');
  // Show "Next Level" if there's more to play — either next level or next planet
  const isNextLevelAvailable = (currLevel < 10) || (currLevel === 10 && currPlanet + 1 < planets.length);
  nextLevelBtn.classList.toggle('hidden', !success || !isNextLevelAvailable);


  endMessage.textContent = success ? "✅ Level Complete!" : "❌ Time's up! Try Again!";

if (success) {
  if (!gameState.maxLevelPerPlanet[currPlanet]) gameState.maxLevelPerPlanet[currPlanet] = 1;
  if (currLevel < 10 && gameState.maxLevelPerPlanet[currPlanet] < currLevel + 1) {
    gameState.maxLevelPerPlanet[currPlanet] = currLevel + 1;
  }
  if (currLevel === 10 && currPlanet + 1 < planets.length && !gameState.unlockedPlanets.includes(currPlanet + 1)) {
    gameState.unlockedPlanets.push(currPlanet + 1);
    gameState.maxLevelPerPlanet[currPlanet + 1] = 1;

    setTimeout(() => {
    endMessage.innerHTML = `🎉 Hurray! You unlocked <strong>${planets[currPlanet + 1].name}</strong>!`;
    nextLevelBtn.classList.remove('hidden');
    // Set up for next level of next planet
    gameState.currentPlanetIndex = currPlanet + 1;
    gameState.currentLevel = 1;
    }, 500);

  }
}

// ✅ Always play end sound — success or fail
sounds.end.currentTime = 0;
sounds.end.play();

// ✅ Always show end screen
document.getElementById('scoreboard').style.display = 'none';
document.getElementById('gameArea').style.display = 'none';
startBtn.style.display = 'none';
restartBtn.style.display = 'none';
endScreen.classList.remove('hidden');

// ✅ Always remove hammer
document.body.classList.remove('hammer-active');

// ✅ Save progress
saveProgress();



  document.getElementById('scoreboard').style.display = 'none';
  document.getElementById('gameArea').style.display = 'none';
  startBtn.style.display = 'none';
  restartBtn.style.display = 'none';
  endScreen.classList.remove('hidden');
  saveProgress();
}

function whack(e) {
  if (!e.isTrusted) return;
  const mole = e.target;
  if (mole.classList.contains('mole')) {
    gameState.score++;
    scoreBoard.textContent = gameState.score;

    // 🎵 Play hurt sound
    sounds.hurt.currentTime = 0;
    sounds.hurt.play();

    // 🐹 Show mole2 for a brief moment
    mole.classList.add('hit');
    setTimeout(() => {
      mole.classList.remove('hit');
    }, 150);

    mole.parentNode.classList.remove('up');
  }
}



function resetProgress() {
  localStorage.removeItem('planetMoleProgress');
  gameState = {
    currentPlanetIndex: 0,
    currentLevel: 1,
    score: 0,
    unlockedPlanets: [0],
    maxLevelPerPlanet: [1],
  };
  setBackground('select');
  overlay.classList.remove('hidden');
  goalScreen.classList.add('hidden');
  levelSelector.classList.add('hidden');
  planetSelector.classList.remove('hidden');
  setupPlanetButtons();
}

function showGameUI() {
  setBackground('planet');
  document.body.classList.add('game-active'); // 👉 enable hammer

  document.getElementById('scoreboard').style.display = 'flex';
  document.getElementById('gameArea').style.display = 'grid';
  startBtn.style.display = 'inline-block';
  restartBtn.style.display = 'inline-block';
  updateUI();
}


function resetToSelector() {
  document.body.classList.remove('game-active'); // 👈 remove hammer
  setBackground('select');
  overlay.classList.remove('hidden');
  goalScreen.classList.add('hidden');
  levelSelector.classList.add('hidden');
  planetSelector.classList.remove('hidden');
  setupPlanetButtons();
}


// ✅ Add all event listeners outside onload
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => confirmModal.classList.remove('hidden'));
confirmRestart.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
  resetProgress();
});
cancelRestart.addEventListener('click', () => confirmModal.classList.add('hidden'));
tryAgainBtn.addEventListener('click', () => {
  endScreen.classList.add('hidden');
  showGoalMessage();
});
nextLevelBtn.addEventListener('click', () => {
  endScreen.classList.add('hidden');
  showGoalMessage();
});
restartBtnFinal.addEventListener('click', () => {
  endScreen.classList.add('hidden');
  resetProgress();
});
homeBtn.addEventListener('click', () => {
  endScreen.classList.add('hidden');
  resetToSelector();
});


document.addEventListener('click', (e) => {
  sounds.hit.currentTime = 0;
  sounds.hit.play();
  whack(e); // your existing whack function
});

document.addEventListener('keydown', () => {
  if (!goalScreen.classList.contains('hidden')) {
    goalScreen.classList.add('hidden');
    overlay.classList.add('hidden');
    document.getElementById('gameTitle').style.display = 'none'; // ✅ Hide title
    showGameUI();
  }
});


// ✅ Init
window.onload = () => {
  startBtn.addEventListener('click', startGame);

  // Show confirmation modal instead of direct reset
  restartBtn.addEventListener('click', () => {
    confirmModal.classList.remove('hidden');
  });

  // Confirm reset
  confirmRestart.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    resetProgress();
  });

  cancelRestart.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
  });

 

  // Start game after pressing any key from goal screen
  document.addEventListener('keydown', () => {
    if (!goalScreen.classList.contains('hidden')) {
      goalScreen.classList.add('hidden');
      overlay.classList.add('hidden');
      showGameUI(); // <-- show game directly
    }
  });

  tryAgainBtn.addEventListener('click', () => {
  endScreen.classList.add('hidden');
  overlay.classList.remove('hidden');
  goalScreen.classList.remove('hidden');
  setBackground('goal');

  // ✅ Same level – don't change gameState.currentLevel
  requiredHits = 4 + gameState.currentLevel;
  goalText.textContent = `🎯 Hit ${requiredHits} moles in 30 seconds to unlock the next level!`;
});

nextLevelBtn.addEventListener('click', () => {
  endScreen.classList.add('hidden');
  overlay.classList.remove('hidden');
  goalScreen.classList.remove('hidden');
  setBackground('goal');

  if (gameState.currentLevel < 10) {
  gameState.currentLevel += 1;
} else if (gameState.currentLevel === 10 && gameState.currentPlanetIndex + 1 < planets.length) {
  gameState.currentPlanetIndex += 1;
  gameState.currentLevel = 1;
}


  requiredHits = 4 + gameState.currentLevel;
  goalText.textContent = `🎯 Hit ${requiredHits} moles in 30 seconds to unlock the next level!`;
});



  restartBtnFinal.addEventListener('click', () => {
    confirmModal.classList.remove('hidden');
  });

  homeBtn.addEventListener('click', () => {
    endScreen.classList.add('hidden');
    document.getElementById('gameTitle').style.display = 'block';
    resetToSelector();
  });

  loadProgress();
  setupPlanetButtons();
};
