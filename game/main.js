/* =============================================
   ADVENTOPIA — main.js
   The core game engine
   ============================================= */

// -----------------------------------------------
// 1. GAME STATE
// -----------------------------------------------

const gameState = {
  currentScene: null,
  inventory: [],
  solvedPuzzles: [],
  collectedKeyPieces: [],
  achievements: [],
  hintIndex: {},
  puzzleAttempts: {},
  activePuzzle: null,
  audioEnabled: true,
  gameStarted: false,
  navArrows: [],
  pendingWorldComplete: false
};

let pendingPuzzle = null;

// -----------------------------------------------
// 2. ELEMENT REFERENCES
// -----------------------------------------------

const elements = {
  loadingScreen:      document.getElementById('loading-screen'),
  gameContainer:      document.getElementById('game-container'),
  errorScreen:        document.getElementById('error-screen'),
  canvas:             document.getElementById('game-canvas'),
  inventoryBar:       document.getElementById('inventory-bar'),
  dialogueBox:        document.getElementById('dialogue-box'),
  dialogueText:       document.getElementById('dialogue-text'),
  dialogueClose:      document.getElementById('dialogue-close'),
  puzzleOverlay:      document.getElementById('puzzle-overlay'),
  puzzleContainer:    document.getElementById('puzzle-container'),
  hintOverlay:        document.getElementById('hint-overlay'),
  hintText:           document.getElementById('hint-text'),
  hintClose:          document.getElementById('hint-close'),
  rewardOverlay:      document.getElementById('reward-overlay'),
  rewardText:         document.getElementById('reward-text'),
  rewardClose:        document.getElementById('reward-close'),
  hintBtn:            document.getElementById('hint-btn'),
  audioBtn:           document.getElementById('audio-btn'),
  orientationWarning: document.getElementById('orientation-warning')
};

const ctx = elements.canvas.getContext('2d');

// Logical canvas size — CSS pixels, not physical pixels.
// Always use these for coordinate calculations, never
// elements.canvas.width/height directly (those are DPR-scaled).
let logicalW = 0;
let logicalH = 0;

// -----------------------------------------------
// 3. UTILITY FUNCTIONS
// -----------------------------------------------

const FLEX_ELEMENTS = new Set([
  'reward-overlay',
  'hint-overlay',
  'puzzle-overlay',
  'dialogue-box',
  'error-screen',
  'game-menu'
]);

function show(el) {
  if (!el) return;
  el.classList.remove('hidden');
  if (FLEX_ELEMENTS.has(el.id)) {
    el.style.display = 'flex';
  }
}

function hide(el) {
  if (!el) return;
  el.style.display = '';
  el.classList.add('hidden');
}

function showError() {
  hide(elements.loadingScreen);
  hide(elements.gameContainer);
  show(elements.errorScreen);
}

// -----------------------------------------------
// 4. SAVE & LOAD
// -----------------------------------------------

function saveProgress() {
  try {
    const data = {
      inventory:          gameState.inventory,
      solvedPuzzles:      gameState.solvedPuzzles,
      collectedKeyPieces: gameState.collectedKeyPieces,
      achievements:       gameState.achievements,
      currentScene:       gameState.currentScene
    };
    localStorage.setItem('adventopia_save', JSON.stringify(data));
  } catch (err) {
    console.warn('Save failed:', err);
  }
}

function loadProgress() {
  try {
    const saved = localStorage.getItem('adventopia_save');
    if (saved) {
      const data = JSON.parse(saved);
      gameState.inventory          = data.inventory          || [];
      gameState.solvedPuzzles      = data.solvedPuzzles      || [];
      gameState.collectedKeyPieces = data.collectedKeyPieces || [];
      gameState.achievements       = data.achievements       || [];
      gameState.currentScene       = data.currentScene       || null;
    }
  } catch (err) {
    console.warn('Save data missing or corrupted. Starting fresh.');
    clearProgress();
  }
}

function clearProgress() {
  gameState.inventory          = [];
  gameState.solvedPuzzles      = [];
  gameState.collectedKeyPieces = [];
  gameState.achievements       = [];
  gameState.currentScene       = null;
  localStorage.removeItem('adventopia_save');
}

// -----------------------------------------------
// 5. CANVAS SETUP
// Sets physical canvas size for sharp DPR rendering.
// logicalW/H store CSS pixel dimensions for all
// coordinate calculations so nothing gets zoomed.
// -----------------------------------------------

function resizeCanvas() {
  const sceneArea = document.getElementById('scene-area');
  if (sceneArea && elements.canvas) {
    const dpr = window.devicePixelRatio || 1;
    logicalW = sceneArea.offsetWidth;
    logicalH = sceneArea.offsetHeight;
    elements.canvas.width        = logicalW * dpr;
    elements.canvas.height       = logicalH * dpr;
    elements.canvas.style.width  = logicalW + 'px';
    elements.canvas.style.height = logicalH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

// -----------------------------------------------
// SCENE TRANSITION
// -----------------------------------------------

function transitionToScene(sceneId) {
  playSFX('sfx_scene_transition');
  let opacity = 0;
  const fadeIn = setInterval(() => {
    opacity += 0.08;
    ctx.fillStyle = `rgba(0,0,0,${Math.min(opacity, 1)})`;
    ctx.fillRect(0, 0, logicalW, logicalH);
    if (opacity >= 1) {
      clearInterval(fadeIn);
      loadScene(sceneId);
    }
  }, 20);
}

// -----------------------------------------------
// 6. SCENE LOADER
// -----------------------------------------------

async function loadScene(sceneId) {
  try {
    const response = await fetch(`data/${sceneId}.json`);
    if (!response.ok) throw new Error(`Scene not found: ${sceneId}`);
    const sceneData = await response.json();
    gameState.currentScene = sceneId;
    renderScene(sceneData);
    if (sceneData.music) playSceneMusic(sceneData.music);
    saveProgress();
    console.log(`[Game] Scene loaded: ${sceneId}`);
  } catch (err) {
    console.error('Scene load error:', err);
    showError();
  }
}

// -----------------------------------------------
// 7. SCENE RENDERER
// -----------------------------------------------

let activeSceneData = null;

function renderScene(sceneData) {
  resizeCanvas();
  activeSceneData = sceneData;
  renderSceneObjects(sceneData, -1, -1);
  setupSceneClicks(sceneData);

  if (sceneData.entryDialogue) {
    const visitKey = `visited_${sceneData.id}`;
    if (!sessionStorage.getItem(visitKey)) {
      sessionStorage.setItem(visitKey, 'true');
      setTimeout(() => showDialogue(sceneData.entryDialogue), 600);
    }
  }
}

function renderSceneObjects(sceneData, hoverX, hoverY) {
  // Use logicalW/H — CSS pixel dimensions — for all drawing.
  // DPR scaling is handled by ctx.setTransform in resizeCanvas().
  drawSceneArt(ctx, sceneData, logicalW, logicalH);

  if (sceneData.objects) {
    sceneData.objects.forEach(obj => {
      const x = (obj.x / 100) * logicalW;
      const y = (obj.y / 100) * logicalH;
      const w = (obj.w / 100) * logicalW;
      const h = (obj.h / 100) * logicalH;
      const isHovered = (
        hoverX >= x && hoverX <= x + w &&
        hoverY >= y && hoverY <= y + h
      );
      drawObjectArt(ctx, obj, logicalW, logicalH, isHovered);
    });
  }

  drawNavigationArrows(sceneData);
}

// -----------------------------------------------
// NAVIGATION ARROWS
// -----------------------------------------------

function drawNavigationArrows(sceneData) {
  gameState.navArrows = [];

  if (sceneData.previousScene) {
    drawArrow('left', 20, logicalH / 2, sceneData.previousScene);
    gameState.navArrows.push({
      direction: 'left',
      x: 10, y: logicalH / 2 - 40, w: 60, h: 80,
      targetScene: sceneData.previousScene
    });
  }

  if (sceneData.nextScene) {
    const isLocked = isSceneLocked(sceneData.nextScene);
    drawArrow('right', logicalW - 20, logicalH / 2, sceneData.nextScene, isLocked);
    gameState.navArrows.push({
      direction: 'right',
      x: logicalW - 70, y: logicalH / 2 - 40, w: 60, h: 80,
      targetScene: sceneData.nextScene,
      locked: isLocked
    });
  }
}

function drawArrow(direction, x, y, targetScene, locked = false) {
  ctx.save();
  ctx.globalAlpha  = locked ? 0.35 : 0.85;
  ctx.fillStyle    = locked ? '#999999' : '#ffffff';
  ctx.strokeStyle  = locked ? '#666666' : '#2C5F8A';
  ctx.lineWidth    = 3;

  ctx.beginPath();
  if (direction === 'left') {
    ctx.moveTo(x + 40, y - 30);
    ctx.lineTo(x,      y);
    ctx.lineTo(x + 40, y + 30);
  } else {
    ctx.moveTo(x - 40, y - 30);
    ctx.lineTo(x,      y);
    ctx.lineTo(x - 40, y + 30);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (locked) {
    ctx.fillStyle    = '#666666';
    ctx.font         = 'bold 16px Arial';
    ctx.textAlign    = 'center';
    ctx.fillText('🔒', x, y + 60);
  }

  ctx.restore();
}

// -----------------------------------------------
// 9. SCENE INTERACTION
// -----------------------------------------------

let hoverRafId = null;

function setupSceneClicks(sceneData) {
  elements.canvas.onclick     = (e) => handleCanvasClick(e, sceneData);
  elements.canvas.onmousemove = (e) => handleCanvasHover(e, sceneData);
}

function handleCanvasClick(event, sceneData) {
  const rect   = elements.canvas.getBoundingClientRect();
  // Scale from CSS rect to logical coords (not physical DPR pixels)
  const scaleX = logicalW / rect.width;
  const scaleY = logicalH / rect.height;
  const clickX = (event.clientX - rect.left) * scaleX;
  const clickY = (event.clientY - rect.top)  * scaleY;

  for (const arrow of gameState.navArrows) {
    if (clickX >= arrow.x && clickX <= arrow.x + arrow.w &&
        clickY >= arrow.y && clickY <= arrow.y + arrow.h) {
      if (!arrow.locked) {
        transitionToScene(arrow.targetScene);
        playSFX('sfx_click');
      } else {
        showDialogue('This path is currently locked. You need to find all three key pieces to proceed!');
        playSFX('sfx_wrong');
      }
      return;
    }
  }

  if (sceneData.objects) {
    for (const obj of sceneData.objects) {
      const x = (obj.x / 100) * logicalW;
      const y = (obj.y / 100) * logicalH;
      const w = (obj.w / 100) * logicalW;
      const h = (obj.h / 100) * logicalH;
      if (clickX >= x && clickX <= x + w && clickY >= y && clickY <= y + h) {
        handleObjectClick(obj);
        playSFX('sfx_click');
        return;
      }
    }
  }
}

function handleCanvasHover(event, sceneData) {
  if (hoverRafId) cancelAnimationFrame(hoverRafId);
  hoverRafId = requestAnimationFrame(() => {
    hoverRafId = null;
    const rect   = elements.canvas.getBoundingClientRect();
    const scaleX = logicalW / rect.width;
    const scaleY = logicalH / rect.height;
    const hoverX = (event.clientX - rect.left) * scaleX;
    const hoverY = (event.clientY - rect.top)  * scaleY;

    renderSceneObjects(sceneData, hoverX, hoverY);

    let isOverClickable = false;
    for (const arrow of gameState.navArrows) {
      if (hoverX >= arrow.x && hoverX <= arrow.x + arrow.w &&
          hoverY >= arrow.y && hoverY <= arrow.y + arrow.h) {
        isOverClickable = true;
        break;
      }
    }
    if (!isOverClickable && sceneData.objects) {
      for (const obj of sceneData.objects) {
        const x = (obj.x / 100) * logicalW;
        const y = (obj.y / 100) * logicalH;
        const w = (obj.w / 100) * logicalW;
        const h = (obj.h / 100) * logicalH;
        if (hoverX >= x && hoverX <= x + w && hoverY >= y && hoverY <= y + h) {
          isOverClickable = true;
          break;
        }
      }
    }
    elements.canvas.style.cursor = isOverClickable ? 'pointer' : 'default';
  });
}

function handleObjectClick(obj) {
  if (obj.dialogue && obj.puzzle) {
    pendingPuzzle = obj.puzzle;
    showDialogue(obj.dialogue);
    return;
  }
  if (obj.dialogue)     showDialogue(obj.dialogue);
  if (obj.puzzle)       triggerPuzzle(obj.puzzle);
  if (obj.collectItem)  collectItem(obj.collectItem);
}

function isSceneLocked(sceneId) {
  if (activeSceneData && activeSceneData.nextScene === sceneId && activeSceneData.nextSceneLock) {
    const lock = activeSceneData.nextSceneLock;
    if (lock.type === 'keyPieces') return gameState.collectedKeyPieces.length < lock.required;
    if (lock.type === 'puzzle')    return !gameState.solvedPuzzles.includes(lock.id);
  }
  return false;
}

// -----------------------------------------------
// 10. DIALOGUE SYSTEM
// -----------------------------------------------

function showDialogue(text) {
  elements.dialogueText.textContent = text;
  show(elements.dialogueBox);
  playSFX('sfx_dialogue');
}

elements.dialogueClose.addEventListener('click', () => {
  hide(elements.dialogueBox);
  if (pendingPuzzle) {
    const puzzleToLoad = pendingPuzzle;
    pendingPuzzle = null;
    setTimeout(() => triggerPuzzle(puzzleToLoad), 150);
  }
});

// -----------------------------------------------
// 11. PUZZLE SYSTEM
// -----------------------------------------------

function triggerPuzzle(puzzleId) {
  const isGatePattern = puzzleId === 'puzzle3_gate_pattern';
  if (gameState.solvedPuzzles.includes(puzzleId) && !isGatePattern) {
    showDialogue("You have already solved this one — great work!");
    return;
  }
  fetch(`data/${puzzleId}.json`)
    .then(res => { if (!res.ok) throw new Error('Puzzle not found'); return res.json(); })
    .then(puzzleData => {
      gameState.activePuzzle = puzzleData;
      if (!gameState.puzzleAttempts[puzzleId]) gameState.puzzleAttempts[puzzleId] = 0;
      renderPuzzle(puzzleData);
    })
    .catch(err => { console.error('Puzzle load error:', err); showError(); });
}

function renderPuzzle(puzzleData) {
  elements.puzzleContainer.innerHTML = '';
  show(elements.puzzleOverlay);
  if      (puzzleData.type === 'matching_sort')      renderBreadSortPuzzle(puzzleData);
  else if (puzzleData.type === 'sequencing')          renderStoryPagesPuzzle(puzzleData);
  else if (puzzleData.type === 'pattern_recognition') renderGatePatternPuzzle(puzzleData);
  else {
    elements.puzzleContainer.innerHTML = `
      <h2 style="color:#2C5F8A;margin-bottom:12px;">${puzzleData.name}</h2>
      <p style="color:#555;margin-bottom:20px;">${puzzleData.description}</p>
      <button onclick="closePuzzle()" style="margin-top:20px;background:#2C5F8A;color:white;border:none;border-radius:20px;padding:8px 24px;cursor:pointer;">Close</button>
    `;
  }
}

function closePuzzle() {
  hide(elements.puzzleOverlay);
  elements.puzzleContainer.innerHTML = '';
  gameState.activePuzzle = null;
}

function puzzleSolved(puzzleId, reward) {
  if (!gameState.solvedPuzzles.includes(puzzleId)) gameState.solvedPuzzles.push(puzzleId);
  gameState.puzzleAttempts[puzzleId] = 0;
  gameState.activePuzzle = null;
  saveProgress();
  hide(elements.puzzleOverlay);
  elements.puzzleContainer.innerHTML = '';
  playSFX('sfx_puzzle_complete');
  showReward(reward);
}

function puzzleFailed(puzzleId, failureMessage) {
  playSFX('sfx_wrong');
  if (!gameState.puzzleAttempts[puzzleId]) gameState.puzzleAttempts[puzzleId] = 0;
  gameState.puzzleAttempts[puzzleId]++;
  const failMsg = document.getElementById('puzzle-fail-msg');
  if (failMsg) {
    failMsg.textContent  = failureMessage || 'Not quite — give it another go!';
    failMsg.style.display = 'block';
    setTimeout(() => { failMsg.style.display = 'none'; }, 2500);
  }
  if (gameState.puzzleAttempts[puzzleId] >= 2 && gameState.activePuzzle?.hints) {
    setTimeout(() => showHint(puzzleId, gameState.activePuzzle.hints), 800);
  }
}

// -----------------------------------------------
// 12. HINT SYSTEM
// -----------------------------------------------

function showHint(puzzleId, hints) {
  if (!gameState.hintIndex[puzzleId]) gameState.hintIndex[puzzleId] = 0;
  const index = gameState.hintIndex[puzzleId];
  elements.hintText.textContent = index < hints.length
    ? hints[index]
    : "You're doing great — keep trying, you'll get it!";
  if (index < hints.length) gameState.hintIndex[puzzleId]++;
  playSFX('sfx_hint');
  show(elements.hintOverlay);
}

elements.hintClose.addEventListener('click', () => hide(elements.hintOverlay));

elements.hintBtn.addEventListener('click', () => {
  if (gameState.activePuzzle?.hints) {
    showHint(gameState.activePuzzle.id, gameState.activePuzzle.hints);
    return;
  }
  if (gameState.currentScene) {
    elements.hintText.textContent = 'Look around the scene — click on characters and objects to explore!';
    show(elements.hintOverlay);
  }
});

// -----------------------------------------------
// 13. INVENTORY SYSTEM
// -----------------------------------------------

function collectItem(item) {
  if (!gameState.inventory.includes(item.id)) {
    gameState.inventory.push(item.id);
    saveProgress();
    updateInventoryDisplay();
    playSFX('sfx_collect');
    showReward({ text: `You picked up: ${item.label}!`, badge: null });
  }
}

function updateInventoryDisplay() {
  elements.inventoryBar.innerHTML = '';
  gameState.inventory.forEach(itemId => {
    const slot = document.createElement('div');
    slot.className   = 'inventory-slot';
    slot.title       = itemId;
    slot.textContent = '🎒';
    elements.inventoryBar.appendChild(slot);
  });
  gameState.collectedKeyPieces.forEach(pieceId => {
    const slot   = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.title     = pieceId;
    const keyImg   = document.createElement('img');
    keyImg.src     = 'assets/icons/key_piece.png';
    keyImg.alt     = 'Key piece';
    keyImg.style.cssText = 'width:28px;height:28px;object-fit:contain;';
    slot.appendChild(keyImg);
    elements.inventoryBar.appendChild(slot);
  });
}

// -----------------------------------------------
// 14. REWARD SYSTEM
// -----------------------------------------------

function showReward(reward) {
  elements.rewardText.textContent = reward.text || 'Well done!';
  const existing = document.getElementById('reward-badge-img');
  if (existing) existing.remove();
  if (reward.badge) {
    const badgeFilename = 'badge_' + reward.badge.toLowerCase().replace(/ /g, '_') + '.png';
    const badgeImg      = document.createElement('img');
    badgeImg.id         = 'reward-badge-img';
    badgeImg.src        = 'assets/badges/' + badgeFilename;
    badgeImg.alt        = reward.badge + ' badge';
    badgeImg.style.cssText = 'width:140px;height:140px;margin:0 auto 12px;display:block;';
    elements.rewardText.insertAdjacentElement('beforebegin', badgeImg);
  }
  show(elements.rewardOverlay);
  playSFX('sfx_reward');

  if (reward.keyPiece && !gameState.collectedKeyPieces.includes(reward.keyPiece)) {
    gameState.collectedKeyPieces.push(reward.keyPiece);
    saveProgress();
    updateInventoryDisplay();
    playSFX('sfx_key_collect');
    if (gameState.collectedKeyPieces.length === 3) {
      gameState.pendingWorldComplete = true;
    }
  }
  if (reward.badge && !gameState.achievements.includes(reward.badge)) {
    gameState.achievements.push(reward.badge);
    saveProgress();
  }
}

elements.rewardClose.addEventListener('click', () => {
  hide(elements.rewardOverlay);
  if (gameState.pendingWorldComplete) {
    gameState.pendingWorldComplete = false;
    setTimeout(() => checkWorldComplete(), 200);
  }
});

// -----------------------------------------------
// 15. WORLD COMPLETION CHECK
// -----------------------------------------------

function checkWorldComplete() {
  if (gameState.collectedKeyPieces.length >= 3) {
    showDialogue("You collected all 3 golden key pieces! The Town Gate is now unlocked. Amazing work, Pip!");
  }
}

// -----------------------------------------------
// 16. AUDIO ENGINE
// -----------------------------------------------

const audioEngine = {
  bgMusic: null, currentSrc: null, enabled: true, sfxPool: {}
};

function playSFX(name) {
  if (!audioEngine.enabled) return;
  try {
    if (!audioEngine.sfxPool[name]) {
      audioEngine.sfxPool[name] = new Audio(`assets/audio/${name}.mp3`);
      audioEngine.sfxPool[name].volume = 0.7;
    }
    const sfx = audioEngine.sfxPool[name];
    sfx.currentTime = 0;
    sfx.play().catch(() => {});
  } catch(e) {}
}

function playSceneMusic(src) {
  if (!src) return;
  if (audioEngine.currentSrc === src && audioEngine.bgMusic && !audioEngine.bgMusic.paused) return;
  stopMusic();
  audioEngine.bgMusic      = new Audio(src);
  audioEngine.bgMusic.loop = true;
  audioEngine.bgMusic.volume = 0.38;
  audioEngine.currentSrc   = src;
  if (audioEngine.enabled) {
    audioEngine.bgMusic.play().catch(() => {
      document.addEventListener('click', function resumeAudio() {
        if (audioEngine.enabled && audioEngine.bgMusic) audioEngine.bgMusic.play().catch(() => {});
        document.removeEventListener('click', resumeAudio);
      }, { once: true });
    });
  }
}

function stopMusic() {
  if (audioEngine.bgMusic) {
    audioEngine.bgMusic.pause();
    audioEngine.bgMusic.currentTime = 0;
    audioEngine.bgMusic  = null;
    audioEngine.currentSrc = null;
  }
}

elements.audioBtn.addEventListener('click', () => {
  audioEngine.enabled        = !audioEngine.enabled;
  gameState.audioEnabled     = audioEngine.enabled;
  elements.audioBtn.textContent = audioEngine.enabled ? '🔊 Audio' : '🔇 Audio';
  if (audioEngine.enabled) {
    if (audioEngine.bgMusic) audioEngine.bgMusic.play().catch(() => {});
  } else {
    if (audioEngine.bgMusic) audioEngine.bgMusic.pause();
  }
});

// -----------------------------------------------
// 17. MENU SYSTEM
// -----------------------------------------------

const menuBtn  = document.getElementById('menu-btn');
const gameMenu = document.getElementById('game-menu');

function openMenu() {
  show(gameMenu);
  menuBtn.setAttribute('aria-expanded', 'true');
  const icon = document.getElementById('menu-icon');
  if (icon) icon.textContent = '✕';
}

function closeMenu() {
  hide(gameMenu);
  menuBtn.setAttribute('aria-expanded', 'false');
  const icon = document.getElementById('menu-icon');
  if (icon) icon.textContent = '☰';
}

menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  gameMenu.classList.contains('hidden') ? openMenu() : closeMenu();
});

document.addEventListener('click', (e) => {
  if (!gameMenu.classList.contains('hidden') &&
      !gameMenu.contains(e.target) &&
      e.target !== menuBtn) {
    closeMenu();
  }
});

document.querySelectorAll('.menu-item').forEach(btn => {
  btn.addEventListener('click', () => closeMenu());
});

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// Pulse menu button on first ever visit
const menuTutorialKey = 'adventopia_menu_seen';
if (!localStorage.getItem(menuTutorialKey)) {
  setTimeout(() => {
    menuBtn.classList.add('pulse');
    menuBtn.addEventListener('animationend', () => {
      menuBtn.classList.remove('pulse');
      localStorage.setItem(menuTutorialKey, '1');
    }, { once: true });
  }, 2500);
}

// -----------------------------------------------
// 18. ORIENTATION DETECTION
// -----------------------------------------------

function checkOrientation() {
  const isPortrait = window.innerHeight > window.innerWidth;
  if (isPortrait) {
    elements.orientationWarning.classList.add('show');
  } else {
    elements.orientationWarning.classList.remove('show');
  }
}

// -----------------------------------------------
// 19. GAME INIT
// -----------------------------------------------

async function initGame() {
  try {
    hide(elements.rewardOverlay);
    hide(elements.hintOverlay);
    hide(elements.dialogueBox);
    hide(elements.puzzleOverlay);
    hide(gameMenu);
    checkOrientation();
    resizeCanvas();
    loadProgress();
    updateInventoryDisplay();
    await new Promise(resolve => setTimeout(resolve, 1200));
    hide(elements.loadingScreen);
    show(elements.gameContainer);
    const startScene = gameState.currentScene || 'scene1_village_square';
    await loadScene(startScene);
    gameState.gameStarted = true;
    menuBtn.style.display = 'flex';
  } catch (err) {
    console.error('Game init failed:', err);
    showError();
  }
}

window.addEventListener('resize', () => {
  checkOrientation();
  if (gameState.gameStarted && activeSceneData) {
    resizeCanvas();
    renderSceneObjects(activeSceneData, -1, -1);
  }
});

window.addEventListener('orientationchange', checkOrientation);

if (screen.orientation?.lock) {
  screen.orientation.lock('landscape').catch(() => {});
}

initGame();
