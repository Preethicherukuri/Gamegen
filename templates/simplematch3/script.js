const emojiThemes = {
  harry: ['🧙‍♂️', '🪩', '🦉', '🪄', '⚡', '🧪'],
  twilight: ['🧛', '🌕', '🐺', '🌲', '💔', '🚗'],
  hunger: ['🏹', '🔥', '🍞', '🐦', '🎯', '👧']
};

// 🎵 Sound effects
const soundHarry = new Audio('sounds/harry.mp3');
const soundTwilight = new Audio('sounds/twilight.mp3');
const soundHunger = new Audio('sounds/hunger.mp3');
const soundSwap = new Audio('sounds/swap.mp3');
const soundScore = new Audio('sounds/score.mp3');
const soundGoal = new Audio('sounds/goal.mp3');

let board = [];
let selectedTheme = '';
let currentLevel = 1;
let score = 0;
let goal = 100;
let bonusGoal = 0;
let bonusEarned = false;
let moves = 20;
let coins = 0;
let boosters = 0;
let hasWonLevel = false;
let allowBonusPlay = false;
let firstClick = null;
let isGameOver = false;


const boardSize = 6;
const totalLevels = 50;

const gameBoard = document.getElementById('gameBoard');
const endButtons = document.getElementById('endButtons');
const boosterBtn = document.getElementById('boosterBtn');
const bonusPrompt = document.getElementById('bonusPrompt');
const bonusContinueBtn = document.getElementById('bonusContinueBtn');
const bonusNextBtn = document.getElementById('bonusNextBtn');

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen =>
    screen.classList.add('hidden')
  );
  document.getElementById(id).classList.remove('hidden');

  if (id !== 'gameUI') {
    gameBoard.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedTheme = card.id;

      // 🔉 Play theme sound
      if (selectedTheme === 'harry') soundHarry.play();
      else if (selectedTheme === 'twilight') soundTwilight.play();
      else if (selectedTheme === 'hunger') soundHunger.play();

      showLevels();
    });
  });


  boosterBtn.addEventListener('click', useBooster);
  bonusContinueBtn.addEventListener('click', () => {
    allowBonusPlay = true;
    bonusPrompt.style.display = 'none';
  });

  bonusNextBtn.addEventListener('click', () => {
    bonusPrompt.style.display = 'none';
    nextLevel();
  });

  coins = parseInt(localStorage.getItem('coins')) || 0;
  boosters = parseInt(localStorage.getItem('boosters')) || 0;
});

function showLevels() {
  showScreen('levelSelect');
  const levelsGrid = document.getElementById('levelsGrid');
  levelsGrid.innerHTML = '';
  const unlocked = getUnlockedLevels();

  for (let i = 1; i <= totalLevels; i++) {
    const btn = document.createElement('button');
    btn.classList.add('level-btn');
    btn.innerText = i;

    if (i <= unlocked) {
      btn.classList.add('unlocked');
      btn.addEventListener('click', () => {
        currentLevel = i;
        goal = 100 + (i - 1) * 20;
        bonusGoal = goal + 60;
        moves = 20;
        score = 0;
        hasWonLevel = false;
        bonusEarned = false;
        allowBonusPlay = false;
        showPreGame();
      });
    } else {
      btn.classList.add('locked');
      btn.disabled = true;
    }

    levelsGrid.appendChild(btn);
  }
}

function getUnlockedLevels() {
  return parseInt(localStorage.getItem(`${selectedTheme}_unlocked`)) || 1;
}

function showPreGame() {
  document.getElementById('preLevelNumber').innerText = currentLevel;
  document.getElementById('preGoalPoints').innerText = goal;
  document.getElementById('preMoveLimit').innerText = moves;
  showScreen('preGameMessage');

  const keyListener = () => {
    // ⏹️ Stop any theme music
    soundHarry.pause();
    soundTwilight.pause();
    soundHunger.pause();

    soundHarry.currentTime = 0;
    soundTwilight.currentTime = 0;
    soundHunger.currentTime = 0;

    document.removeEventListener('keydown', keyListener);
    requestAnimationFrame(() => {
      startGame();
    });
  };

  document.addEventListener('keydown', keyListener);
}


function startGame() {
  isGameOver = false;
  showScreen('gameUI');
  firstClick = null;
  createBoard();
  updateStatus();
}

function createBoard() {
  board = [];
  gameBoard.innerHTML = '';
  const emojis = emojiThemes[selectedTheme];

  for (let i = 0; i < boardSize * boardSize; i++) {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.dataset.index = i;

    let emoji;
    do {
      emoji = emojis[Math.floor(Math.random() * emojis.length)];
      tile.innerText = emoji;
      board[i] = tile;
    } while (checkInitialMatch(i)); // Retry until no match at i

    tile.addEventListener('click', () => tileClick(i));
    gameBoard.appendChild(tile);
  }
}

function checkInitialMatch(index) {
  const row = Math.floor(index / boardSize);
  const col = index % boardSize;
  const emoji = board[index].innerText;

  // Check horizontal
  if (col >= 2) {
    const e1 = board[index - 1]?.innerText;
    const e2 = board[index - 2]?.innerText;
    if (e1 === emoji && e2 === emoji) return true;
  }

  // Check vertical
  if (row >= 2) {
    const e1 = board[index - boardSize]?.innerText;
    const e2 = board[index - 2 * boardSize]?.innerText;
    if (e1 === emoji && e2 === emoji) return true;
  }

  return false;
}


function tileClick(index) {
  if (isGameOver) return;

  if (firstClick === null) {
    firstClick = index;
    board[index].classList.add('highlight');
  } else {
    board[firstClick].classList.remove('highlight');
    swapTiles(firstClick, index);
    firstClick = null;
  }
}


function swapTiles(i1, i2) {
  const tmp = board[i1].innerText;
  board[i1].innerText = board[i2].innerText;
  board[i2].innerText = tmp;

  soundSwap.play(); // 🔉 play on swap

  moves--;
  checkMatches();
  updateStatus();
}


function checkMatches() {
  const matched = new Set();

  // Initial horizontal matches
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col <= boardSize - 3; col++) {
      const i = row * boardSize + col;
      const e1 = board[i].innerText;
      const e2 = board[i + 1].innerText;
      const e3 = board[i + 2].innerText;
      if (e1 === e2 && e2 === e3 && e1 !== '') {
        matched.add(i); matched.add(i + 1); matched.add(i + 2);
        col += 2;
      }
    }
  }

  // Initial vertical matches
  for (let col = 0; col < boardSize; col++) {
    for (let row = 0; row <= boardSize - 3; row++) {
      const i = row * boardSize + col;
      const e1 = board[i].innerText;
      const e2 = board[i + boardSize].innerText;
      const e3 = board[i + 2 * boardSize].innerText;
      if (e1 === e2 && e2 === e3 && e1 !== '') {
        matched.add(i); matched.add(i + boardSize); matched.add(i + 2 * boardSize);
        row += 2;
      }
    }
  }

  if (matched.size > 0) {
    const matchGroups = new Set();

    // Detect horizontal groups again for score calculation
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col <= boardSize - 3; col++) {
        const i = row * boardSize + col;
        const e1 = board[i].innerText;
        const e2 = board[i + 1].innerText;
        const e3 = board[i + 2].innerText;
        if (e1 === e2 && e2 === e3 && e1 !== '') {
          matched.add(i); matched.add(i + 1); matched.add(i + 2);
          matchGroups.add(`${i}-${i + 1}-${i + 2}`);
          col += 2;
        }
      }
    }

    // Detect vertical groups again for score calculation
    for (let col = 0; col < boardSize; col++) {
      for (let row = 0; row <= boardSize - 3; row++) {
        const i = row * boardSize + col;
        const e1 = board[i].innerText;
        const e2 = board[i + boardSize].innerText;
        const e3 = board[i + 2 * boardSize].innerText;
        if (e1 === e2 && e2 === e3 && e1 !== '') {
          matched.add(i); matched.add(i + boardSize); matched.add(i + 2 * boardSize);
          matchGroups.add(`${i}-${i + boardSize}-${i + 2 * boardSize}`);
          row += 2;
        }
      }
    }

    score += matchGroups.size * 30;

    if (matchGroups.size > 0) {
      soundScore.play(); // 🔉 Play score sound
    }

    matched.forEach(i => board[i].innerText = '');
    dropEmojis();
    refillBoard();
    setTimeout(checkMatches, 300);
  }

  updateStatus();

  if (score >= goal && !hasWonLevel) {
    hasWonLevel = true;
    boosters += 1;
    coins += 50;
    updateLocalStorage();
    updateStatus();
    soundGoal.play(); // 🔉 play on reaching goal
    document.getElementById('bonusGoalText').innerText = bonusGoal;
    bonusPrompt.style.display = 'block';
  }

  if (hasWonLevel && score >= bonusGoal && !bonusEarned) {
    bonusEarned = true;
    boosters += 1;
    updateLocalStorage();
    updateStatus();
    gameOver(); // ✅ already added before
  }

  if (moves <= 0 && (hasWonLevel || allowBonusPlay)) {
    gameOver();
  } else if (!hasWonLevel && moves <= 0) {
    gameOver();
  }
}


function dropEmojis() {
  for (let col = 0; col < boardSize; col++) {
    for (let row = boardSize - 1; row >= 0; row--) {
      const index = row * boardSize + col;
      if (board[index].innerText === '') {
        for (let k = row - 1; k >= 0; k--) {
          const aboveIndex = k * boardSize + col;
          if (board[aboveIndex].innerText !== '') {
            board[index].innerText = board[aboveIndex].innerText;
            board[aboveIndex].innerText = '';
            break;
          }
        }
      }
    }
  }
}

function refillBoard() {
  const emojis = emojiThemes[selectedTheme];
  for (let i = 0; i < boardSize * boardSize; i++) {
    if (board[i].innerText === '') {
      board[i].innerText = emojis[Math.floor(Math.random() * emojis.length)];
    }
  }
}

function gameOver() {
  isGameOver = true;
  endButtons.classList.remove('hidden');
}


function updateStatus() {
  document.getElementById('score').innerText = score;
  document.getElementById('goal').innerText = goal;
  document.getElementById('moves').innerText = moves;
  document.getElementById('level').innerText = currentLevel;
  document.getElementById('coins').innerText = coins;
  document.getElementById('boosters').innerText = boosters;
}

function tryAgain() {
  score = 0;
  moves = 20;
  hasWonLevel = false;
  bonusEarned = false;
  allowBonusPlay = false;
  endButtons.classList.add('hidden');
  bonusPrompt.style.display = 'none';
  createBoard();
  updateStatus();
}

function nextLevel() {
  currentLevel++;
  goal = 100 + (currentLevel - 1) * 20;
  bonusGoal = goal + 60;
  document.getElementById('bonusGoalText').innerText = bonusGoal;
  moves = 20;
  score = 0;
  hasWonLevel = false;
  bonusEarned = false;
  allowBonusPlay = false;
  endButtons.classList.add('hidden');
  startGame();
}

function restartProgress() {
  localStorage.removeItem(`${selectedTheme}_unlocked`);
  localStorage.removeItem('coins');
  localStorage.removeItem('boosters');
  
  for (let i = 1; i <= totalLevels; i++) {
    localStorage.removeItem(`${selectedTheme}_level${i}`);
  }

  coins = 0;
  boosters = 0;
  currentLevel = 1;
  goal = 100;
  bonusGoal = 160;
  moves = 20;
  score = 0;
  hasWonLevel = false;
  bonusEarned = false;
  allowBonusPlay = false;

  endButtons.classList.add('hidden');
  bonusPrompt.style.display = 'none';

  updateStatus(); // Reflect reset coins and boosters
  showLevels();
}

function goHome() {
  showScreen('mainMenu');
}

function goBackToThemes() {
  showScreen('mainMenu');
}

function useBooster() {
  if (boosters <= 0) return;
  boosters--;
  highlightHint();
  updateStatus();
}

function highlightHint() {
  const emojis = emojiThemes[selectedTheme];

  for (let i = 0; i < boardSize * boardSize; i++) {
    const row = Math.floor(i / boardSize);
    const col = i % boardSize;

    // Try swapping right
    if (col < boardSize - 1) {
      swapText(i, i + 1);
      if (formsMatch(i) || formsMatch(i + 1)) {
        highlightSwap(i, i + 1);
        swapText(i, i + 1); // Swap back
        return;
      }
      swapText(i, i + 1); // Swap back
    }

    // Try swapping down
    if (row < boardSize - 1) {
      const downIndex = i + boardSize;
      swapText(i, downIndex);
      if (formsMatch(i) || formsMatch(downIndex)) {
        highlightSwap(i, downIndex);
        swapText(i, downIndex); // Swap back
        return;
      }
      swapText(i, downIndex); // Swap back
    }
  }
}

function swapText(i1, i2) {
  const tmp = board[i1].innerText;
  board[i1].innerText = board[i2].innerText;
  board[i2].innerText = tmp;
}

function highlightSwap(i1, i2) {
  board[i1].classList.add('highlight');
  board[i2].classList.add('highlight');
  setTimeout(() => {
    board[i1].classList.remove('highlight');
    board[i2].classList.remove('highlight');
  }, 1000);
}

function formsMatch(index) {
  const row = Math.floor(index / boardSize);
  const col = index % boardSize;
  const val = board[index].innerText;

  // Horizontal check
  for (let c = Math.max(0, col - 2); c <= Math.min(boardSize - 3, col); c++) {
    const i1 = row * boardSize + c;
    const i2 = i1 + 1;
    const i3 = i1 + 2;
    if (board[i1].innerText === val &&
        board[i2].innerText === val &&
        board[i3].innerText === val) {
      return true;
    }
  }

  // Vertical check
  for (let r = Math.max(0, row - 2); r <= Math.min(boardSize - 3, row); r++) {
    const i1 = r * boardSize + col;
    const i2 = i1 + boardSize;
    const i3 = i1 + 2 * boardSize;
    if (board[i1].innerText === val &&
        board[i2].innerText === val &&
        board[i3].innerText === val) {
      return true;
    }
  }

  return false;
}


function updateLocalStorage() {
  localStorage.setItem('coins', coins);
  localStorage.setItem('boosters', boosters);
}

setTimeout(() => {
  updateStatus();
}, 0);
