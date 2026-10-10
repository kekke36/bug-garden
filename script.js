const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('start-btn');
const gameArea = document.getElementById('game-area');
const bugsLayer = document.getElementById('bugs-layer');
const messageEl = document.getElementById('message');
const netEl = document.getElementById('net');

const BUG_TYPES = [
  { name: 'bee', label: 'はち', points: 3, color: '#f0d640', accent: '#f8a400', size: 34 },
  { name: 'ladybug', label: 'てんとうむし', points: 2, color: '#f26b5d', accent: '#e2403a', size: 30 },
  { name: 'butterfly', label: 'ちょうちょ', points: 5, color: '#7d8cff', accent: '#4b5ed6', size: 36 },
  { name: 'dragonfly', label: 'とんぼ', points: 4, color: '#67d7d9', accent: '#2e9ca5', size: 32 },
  { name: 'beetle', label: 'かぶとむし', points: 6, color: '#7d6ad7', accent: '#5847b8', size: 32 },
  { name: 'ant', label: 'あり', points: 1, color: '#805642', accent: '#49372e', size: 26 },
  { name: 'grasshopper', label: 'ばった', points: 3, color: '#8bcf55', accent: '#4f9639', size: 34 },
  { name: 'firefly', label: 'ほたる', points: 5, color: '#b7d957', accent: '#f5df62', size: 30 },
  { name: 'caterpillar', label: 'いもむし', points: 2, color: '#65bd78', accent: '#35894c', size: 32 },
];

const state = {
  score: 0,
  timeLeft: 30,
  running: false,
  bugs: [],
  lastTimestamp: 0,
  timeLeftId: null,
};

let animationFrameId = null;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setScore() {
  scoreEl.textContent = String(state.score);
}

function setTime() {
  timeEl.textContent = String(Math.max(0, Math.ceil(state.timeLeft)));
}

function updateNetPosition(x, y) {
  const rect = gameArea.getBoundingClientRect();
  const clampedX = clamp(x - rect.left, 0, rect.width);
  const clampedY = clamp(y - rect.top, 0, rect.height);
  netEl.style.left = `${clampedX}px`;
  netEl.style.top = `${clampedY}px`;
}

function createBug() {
  const type = BUG_TYPES[Math.floor(Math.random() * BUG_TYPES.length)];
  const bugEl = document.createElement('div');
  bugEl.className = `bug ${type.name}`;
  bugEl.style.setProperty('--bug-size', `${type.size}px`);
  bugEl.style.setProperty('--bug-color', type.color);
  bugEl.style.setProperty('--bug-accent', type.accent);
  bugEl.innerHTML = `
    <div class="wing left"></div>
    <div class="wing right"></div>
    <div class="body"></div>
    <div class="antenna left"></div>
    <div class="antenna right"></div>
    <div class="spot"></div>
  `;

  const bug = {
    type,
    x: randomBetween(40, gameArea.clientWidth - 40),
    y: randomBetween(40, gameArea.clientHeight - 140),
    dx: randomBetween(-1.8, 1.8),
    dy: randomBetween(-1.4, 1.4),
    size: type.size,
    radius: type.size * 0.52,
    element: bugEl,
    caught: false,
  };

  bugEl.style.left = `${bug.x}px`;
  bugEl.style.top = `${bug.y}px`;
  bugsLayer.appendChild(bugEl);
  state.bugs.push(bug);
}

function removeBug(bug) {
  bug.caught = true;
  bug.element.classList.add('caught');
  setTimeout(() => {
    bug.element.remove();
    state.bugs = state.bugs.filter((item) => item !== bug);
  }, 220);
}

function spawnBugIfNeeded() {
  if (!state.running) return;

  while (state.bugs.length < 8) {
    createBug();
  }
}

function updateBugs() {
  const bounds = {
    left: 0,
    right: gameArea.clientWidth,
    top: 0,
    bottom: gameArea.clientHeight - 80,
  };

  for (const bug of state.bugs) {
    bug.x += bug.dx;
    bug.y += bug.dy;

    if (bug.x < 0 || bug.x > bounds.right) {
      bug.dx *= -1;
      bug.x = clamp(bug.x, 0, bounds.right);
    }

    if (bug.y < 0 || bug.y > bounds.bottom) {
      bug.dy *= -1;
      bug.y = clamp(bug.y, 0, bounds.bottom);
    }

    bug.element.style.left = `${bug.x}px`;
    bug.element.style.top = `${bug.y}px`;
  }
}

function catchNearbyBugs(x, y) {
  if (!state.running) return;

  const caughtBugs = [];
  const bugsToCatch = [...state.bugs];

  for (const bug of bugsToCatch) {
    const distance = Math.hypot(bug.x - x, bug.y - y);
    if (distance < bug.radius + 28) {
      caughtBugs.push(bug);
      state.score += bug.type.points;
      setScore();
      removeBug(bug);
    }
  }

  if (caughtBugs.length > 0) {
    const pointsEarned = caughtBugs.reduce((total, bug) => total + bug.type.points, 0);
    const catchMessage = caughtBugs.length === 1
      ? `${caughtBugs[0].type.label} +${pointsEarned}てん！`
      : `${caughtBugs.length}ひきつかまえた！ +${pointsEarned}てん！`;
    messageEl.textContent = `やったー！ ${catchMessage}`;
    messageEl.classList.remove('hidden');
    window.setTimeout(() => {
      if (state.running) {
        messageEl.classList.add('hidden');
      }
    }, 400);
  }
}

function tick(timestamp) {
  if (!state.running) {
    animationFrameId = null;
    return;
  }

  if (!state.lastTimestamp) {
    state.lastTimestamp = timestamp;
  }

  const delta = (timestamp - state.lastTimestamp) / 1000;
  state.lastTimestamp = timestamp;

  updateBugs(delta);
  spawnBugIfNeeded();

  animationFrameId = window.requestAnimationFrame(tick);
}

function startGame() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  state.score = 0;
  state.timeLeft = 30;
  state.running = true;
  state.lastTimestamp = 0;
  state.bugs.forEach((bug) => bug.element.remove());
  state.bugs = [];
  setScore();
  setTime();
  messageEl.classList.add('hidden');

  startBtn.textContent = 'もういちど';

  for (let index = 0; index < 6; index += 1) {
    createBug();
  }

  if (state.timeLeftId) {
    clearInterval(state.timeLeftId);
  }

  state.timeLeftId = window.setInterval(() => {
    if (!state.running) return;

    state.timeLeft -= 1;
    setTime();

    if (state.timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  animationFrameId = window.requestAnimationFrame(tick);
}

function endGame() {
  state.running = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  clearInterval(state.timeLeftId);
  state.timeLeftId = null;
  messageEl.textContent = `おしまい！ ${state.score} てん でした！`;
  messageEl.classList.remove('hidden');
}

gameArea.addEventListener('pointermove', (event) => {
  updateNetPosition(event.clientX, event.clientY);
});

gameArea.addEventListener('pointerdown', (event) => {
  const rect = gameArea.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  catchNearbyBugs(x, y);
  updateNetPosition(event.clientX, event.clientY);
});

startBtn.addEventListener('click', startGame);

window.addEventListener('pointermove', (event) => {
  const rect = gameArea.getBoundingClientRect();
  if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) {
    updateNetPosition(event.clientX, event.clientY);
  }
});

setScore();
setTime();
messageEl.classList.remove('hidden');
