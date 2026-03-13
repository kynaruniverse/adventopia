/* =============================================
   ADVENTOPIA — main.js
   The core game engine
   ============================================= */

// -----------------------------------------------
// 1. GAME STATE
// Tracks everything about the current session
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
  navArrows: []
};

let pendingPuzzle = null;

// -----------------------------------------------
// 2. ELEMENT REFERENCES
// Grabs all the HTML elements we need to control
// -----------------------------------------------

const elements = {
  loadingScreen:   document.getElementById('loading-screen'),
  gameContainer:   document.getElementById('game-container'),
  errorScreen:     document.getElementById('error-screen'),
  canvas:          document.getElementById('game-canvas'),
  inventoryBar:    document.getElementById('inventory-bar'),
  dialogueBox:     document.getElementById('dialogue-box'),
  dialogueText:    document.getElementById('dialogue-text'),
  dialogueClose:   document.getElementById('dialogue-close'),
  puzzleOverlay:   document.getElementById('puzzle-overlay'),
  puzzleContainer: document.getElementById('puzzle-container'),
  hintOverlay:     document.getElementById('hint-overlay'),
  hintText:        document.getElementById('hint-text'),
  hintClose:       document.getElementById('hint-close'),
  rewardOverlay:   document.getElementById('reward-overlay'),
  rewardText:      document.getElementById('reward-text'),
  rewardClose:     document.getElementById('reward-close'),
  hintBtn:         document.getElementById('hint-btn'),
  audioBtn:        document.getElementById("audio-btn"),
  orientationWarning: document.getElementById("orientation-warning")
};

const ctx = elements.canvas.getContext('2d');

// -----------------------------------------------
// 3. UTILITY FUNCTIONS
// Small helpers used throughout the game
// -----------------------------------------------

const FLEX_ELEMENTS = new Set([
  'reward-overlay',
  'hint-overlay',
  'puzzle-overlay',
  'dialogue-box',
  'error-screen'
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
// Stores progress in localStorage
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
// Sizes the canvas to fill the scene area
// -----------------------------------------------

function resizeCanvas() {
  const sceneArea = document.getElementById('scene-area');
  if (sceneArea && elements.canvas) {
    const dpr = window.devicePixelRatio || 1;
    const w   = sceneArea.offsetWidth;
    const h   = sceneArea.offsetHeight;
    elements.canvas.width  = w * dpr;
    elements.canvas.height = h * dpr;
    elements.canvas.style.width  = w + 'px';
    elements.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

// -----------------------------------------------
// SCENE TRANSITION
// Fades out then loads the new scene
// -----------------------------------------------

function transitionToScene(sceneId) {
  playSFX('sfx_scene_transition');
  let opacity = 0;
  const fadeIn = setInterval(() => {
    opacity += 0.08;
    ctx.fillStyle = `rgba(0,0,0,${Math.min(opacity, 1)})`;
    ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
    if (opacity >= 1) {
      clearInterval(fadeIn);
      loadScene(sceneId);
    }
  }, 20);
}

// -----------------------------------------------
// 6. SCENE LOADER
// Fetches and loads a scene from its JSON file
// -----------------------------------------------

async function loadScene(sceneId) {
  try {
    const response = await fetch(`data/${sceneId}.json`);
    if (!response.ok) throw new Error(`Scene not found: ${sceneId}`);
    const sceneData = await response.json();
    gameState.currentScene = sceneId;
    renderScene(sceneData);

    if (sceneData.music) {
      playSceneMusic(sceneData.music);
    }

    // Auto-save on scene load
    saveProgress();
    console.log(`[Game] Scene loaded and progress saved: ${sceneId}`);
  } catch (err) {
    console.error('Scene load error:', err);
    showError();
  }
}

// -----------------------------------------------
// 7. SCENE RENDERER
// Draws the scene background and objects
// -----------------------------------------------

let activeSceneData = null;

function renderScene(sceneData) {
  resizeCanvas();
  activeSceneData = sceneData;

  renderSceneBackground(sceneData);
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

function renderSceneBackground(sceneData) {
  drawSceneArt(ctx, sceneData, elements.canvas.width, elements.canvas.height);
}

function renderSceneObjects(sceneData, hoverX, hoverY) {
  drawSceneArt(ctx, sceneData, elements.canvas.width, elements.canvas.height);

  if (sceneData.objects) {
    sceneData.objects.forEach(obj => {
      const x = (obj.x / 100) * elements.canvas.width;
      const y = (obj.y / 100) * elements.canvas.height;
      const w = (obj.w / 100) * elements.canvas.width;
      const h = (obj.h / 100) * elements.canvas.height;
      const isHovered = (
        hoverX >= x && hoverX <= x + w &&
        hoverY >= y && hoverY <= y + h
      );
      drawObjectArt(ctx, obj, elements.canvas.width, elements.canvas.height, isHovered);
    });
  }

  drawNavigationArrows(sceneData);
}

// -----------------------------------------------
// NAVIGATION ARROWS
// Draws left and right arrows for scene movement
// -----------------------------------------------

function drawNavigationArrows(sceneData) {
  const cw = elements.canvas.width;
  const ch = elements.canvas.height;

  gameState.navArrows = [];

  if (sceneData.previousScene) {
    drawArrow('left', 20, ch / 2, sceneData.previousScene);
    gameState.navArrows.push({
      direction: 'left',
      x: 10,
      y: ch / 2 - 40,
      w: 60,
      h: 80,
      targetScene: sceneData.previousScene
    });
  }

  if (sceneData.nextScene) {
    const isLocked = isSceneLocked(sceneData.nextScene);
    drawArrow('right', cw - 20, ch / 2, sceneData.nextScene, isLocked);
    gameState.navArrows.push({
      direction: 'right',
      x: cw - 70,
      y: ch / 2 - 40,
      w: 60,
      h: 80,
      targetScene: sceneData.nextScene,
      locked: isLocked
    });
  }
}

function drawArrow(direction, x, y, targetScene, locked = false) {
  ctx.save();
  ctx.globalAlpha = locked ? 0.35 : 0.85;
  ctx.fillStyle = locked ? '#999999' : '#ffffff';
  ctx.strokeStyle = locked ? '#666666' : '#2C5F8A';
  ctx.lineWidth = 3;

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
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔒', x, y + 60);
  }

  ctx.restore();
}

// -----------------------------------------------
// 9. SCENE INTERACTION
// Handles clicks and hovers on scene objects
// -----------------------------------------------
let hoverRafId = null;

function setupSceneClicks(sceneData) {
  elements.canvas.onclick = (event) => handleCanvasClick(event, sceneData);
  elements.canvas.onmousemove = (event) => handleCanvasHover(event, sceneData);
}

function handleCanvasClick(event, sceneData) {
  const rect = elements.canvas.getBoundingClientRect();
  const scaleX = elements.canvas.width / rect.width;
  const scaleY = elements.canvas.height / rect.height;
  const clickX = (event.clientX - rect.left) * scaleX;
  const clickY = (event.clientY - rect.top) * scaleY;

  for (const arrow of gameState.navArrows) {
    if (clickX >= arrow.x && clickX <= arrow.x + arrow.w &&
        clickY >= arrow.y && clickY <= arrow.y + arrow.h) {
      if (!arrow.locked) {
        transitionToScene(arrow.targetScene);
        playSFX('sfx_click');
        return;
      } else {
        showDialogue('This path is currently locked. You need to find all three key pieces to proceed!');
        playSFX('sfx_wrong');
        return;
      }
    }
  }

  if (sceneData.objects) {
    for (const obj of sceneData.objects) {
      const x = (obj.x / 100) * elements.canvas.width;
      const y = (obj.y / 100) * elements.canvas.height;
      const w = (obj.w / 100) * elements.canvas.width;
      const h = (obj.h / 100) * elements.canvas.height;

      if (clickX >= x && clickX <= x + w &&
          clickY >= y && clickY <= y + h) {
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
    const rect = elements.canvas.getBoundingClientRect();
    const scaleX = elements.canvas.width / rect.width;
    const scaleY = elements.canvas.height / rect.height;
    const hoverX = (event.clientX - rect.left) * scaleX;
    const hoverY = (event.clientY - rect.top) * scaleY;
    renderSceneObjects(sceneData, hoverX, hoverY);

    // Change cursor to pointer when over a clickable object or arrow
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
        const x = (obj.x / 100) * elements.canvas.width;
        const y = (obj.y / 100) * elements.canvas.height;
        const w = (obj.w / 100) * elements.canvas.width;
        const h = (obj.h / 100) * elements.canvas.height;
        if (hoverX >= x && hoverX <= x + w &&
            hoverY >= y && hoverY <= y + h) {
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

  if (obj.dialogue) {
    showDialogue(obj.dialogue);
  }

  if (obj.puzzle) {
    triggerPuzzle(obj.puzzle);
  }

  if (obj.collectItem) {
    collectItem(obj.collectItem);
  }
}

function isSceneLocked(sceneId) {
  // Read lock requirements from the active scene's JSON.
  // Add "nextSceneLock": { "type": "keyPieces", "required": 3 }
  // to any scene JSON to lock its next scene without touching this file.
  if (activeSceneData && activeSceneData.nextScene === sceneId && activeSceneData.nextSceneLock) {
    const lock = activeSceneData.nextSceneLock;
    if (lock.type === 'keyPieces') return gameState.collectedKeyPieces.length < lock.required;
    if (lock.type === 'puzzle') return !gameState.solvedPuzzles.includes(lock.id);
  }
  // Legacy fallback — keeps World 1 working while JSON is updated
  if (sceneId === 'scene3_town_gate') return gameState.collectedKeyPieces.length < 3;
  return false;
}

// -----------------------------------------------
// 10. DIALOGUE SYSTEM
// Shows NPC speech and story text
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
// Triggers and manages puzzles
// -----------------------------------------------

function triggerPuzzle(puzzleId) {
  const isGatePattern = puzzleId === 'puzzle3_gate_pattern';
  if (gameState.solvedPuzzles.includes(puzzleId) && !isGatePattern) {
    showDialogue("You have already solved this one — great work!");
    return;
  }

  fetch(`data/${puzzleId}.json`)
    .then(res => {
      if (!res.ok) throw new Error('Puzzle not found');
      return res.json();
    })
    .then(puzzleData => {
      gameState.activePuzzle = puzzleData;
      if (!gameState.puzzleAttempts[puzzleId]) {
        gameState.puzzleAttempts[puzzleId] = 0;
      }
      renderPuzzle(puzzleData);
    })
    .catch(err => {
      console.error('Puzzle load error:', err);
      showError();
    });
}

function renderPuzzle(puzzleData) {
  elements.puzzleContainer.innerHTML = '';
  show(elements.puzzleOverlay);

  if (puzzleData.type === 'matching_sort') {
    renderBreadSortPuzzle(puzzleData);
  } else if (puzzleData.type === 'sequencing') {
    renderStoryPagesPuzzle(puzzleData);
  } else if (puzzleData.type === 'pattern_recognition') {
    renderGatePatternPuzzle(puzzleData);
  } else {
    elements.puzzleContainer.innerHTML = `
      <h2 style="color:#2C5F8A; margin-bottom:12px;">${puzzleData.name}</h2>
      <p style="color:#555; margin-bottom:20px;">${puzzleData.description}</p>
      <button onclick="closePuzzle()" style="margin-top:20px; background:#2C5F8A; color:white; border:none; border-radius:20px; padding:8px 24px; cursor:pointer;">Close</button>
    `;
  }
}

function closePuzzle() {
  hide(elements.puzzleOverlay);
  elements.puzzleContainer.innerHTML = '';
  gameState.activePuzzle = null;
}

function puzzleSolved(puzzleId, reward) {
  if (!gameState.solvedPuzzles.includes(puzzleId)) {
    gameState.solvedPuzzles.push(puzzleId);
  }
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
  if (!gameState.puzzleAttempts[puzzleId]) {
    gameState.puzzleAttempts[puzzleId] = 0;
  }
  gameState.puzzleAttempts[puzzleId]++;

  const failMsg = document.getElementById('puzzle-fail-msg');
  if (failMsg) {
    failMsg.textContent = failureMessage || 'Not quite — give it another go!';
    failMsg.style.display = 'block';
    setTimeout(() => { failMsg.style.display = 'none'; }, 2500);
  }

  if (gameState.puzzleAttempts[puzzleId] >= 2 && gameState.activePuzzle && gameState.activePuzzle.hints) {
    setTimeout(() => {
      showHint(puzzleId, gameState.activePuzzle.hints);
    }, 800);
  }
}

// -----------------------------------------------
// 12. HINT SYSTEM
// -----------------------------------------------

function showHint(puzzleId, hints) {
  if (!gameState.hintIndex[puzzleId]) {
    gameState.hintIndex[puzzleId] = 0;
  }

  const index = gameState.hintIndex[puzzleId];

  if (index < hints.length) {
    elements.hintText.textContent = hints[index];
    gameState.hintIndex[puzzleId]++;
  } else {
    elements.hintText.textContent = "You're doing great — keep trying, you'll get it!";
  }

  playSFX('sfx_hint');
  show(elements.hintOverlay);
}

elements.hintClose.addEventListener('click', () => {
  hide(elements.hintOverlay);
});

elements.hintBtn.addEventListener('click', () => {
  if (gameState.activePuzzle && gameState.activePuzzle.hints) {
    showHint(gameState.activePuzzle.id, gameState.activePuzzle.hints);
    return;
  }
  if (gameState.currentScene) {
    elements.hintText.textContent = 'Look around the scene — click on characters and objects to explore. Find someone who needs help!';
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
    showReward({
      text: `You picked up: ${item.label}!`,
      badge: null
    });
  }
}

function updateInventoryDisplay() {
  elements.inventoryBar.innerHTML = '';
  gameState.inventory.forEach(itemId => {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.title = itemId;
    slot.textContent = '🎒';
    elements.inventoryBar.appendChild(slot);
  });

  gameState.collectedKeyPieces.forEach(pieceId => {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.title = pieceId;
    const keyImg = document.createElement('img');
    keyImg.src = 'assets/icons/key_piece.png';
    keyImg.alt = 'Key piece';
    keyImg.style.cssText = 'width:28px; height:28px; object-fit:contain;';
    slot.appendChild(keyImg);
    elements.inventoryBar.appendChild(slot);
  });
}

// -----------------------------------------------
// 14. REWARD SYSTEM
// -----------------------------------------------

function showReward(reward) {
  elements.rewardText.textContent = reward.text || 'Well done!';
  
  // Show badge image if this reward includes a badge
  const existingBadgeImg = document.getElementById('reward-badge-img');
  if (existingBadgeImg) existingBadgeImg.remove();
  if (reward.badge) {
    const badgeFilename = 'badge_' + reward.badge.toLowerCase().replace(/ /g, '_') + '.png';
    const badgeImg = document.createElement('img');
    badgeImg.id = 'reward-badge-img';
    badgeImg.src = 'assets/badges/' + badgeFilename;
    badgeImg.alt = reward.badge + ' badge';
    badgeImg.style.cssText = 'width:140px; height:140px; margin: 0 auto 12px; display:block;';
    elements.rewardText.insertAdjacentElement('beforebegin', badgeImg);
  }
  
  show(elements.rewardOverlay);
  playSFX('sfx_reward');

  if (reward.keyPiece && !gameState.collectedKeyPieces.includes(reward.keyPiece)) {
    gameState.collectedKeyPieces.push(reward.keyPiece);
    saveProgress();
    updateInventoryDisplay();
    playSFX('sfx_key_collect');
    // If this was the third and final key piece, queue the unlock message
    // after the reward overlay is dismissed
    if (gameState.collectedKeyPieces.length === 3) {
      const origClose = elements.rewardClose.onclick;
      elements.rewardClose.addEventListener('click', function onThirdKey() {
        elements.rewardClose.removeEventListener('click', onThirdKey);
        setTimeout(() => checkWorldComplete(), 200);
      });
    }
  }

  if (reward.badge && !gameState.achievements.includes(reward.badge)) {
    gameState.achievements.push(reward.badge);
    saveProgress();
  }
}

elements.rewardClose.addEventListener('click', () => {
  hide(elements.rewardOverlay);
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
  bgMusic:    null,
  currentSrc: null,
  enabled:    true,
  sfxPool:    {}
};

function playSFX(name) {
  if (!audioEngine.enabled) return;
  try {
    const src = `assets/audio/${name}.mp3`;
    const audio = new Audio(src);
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch(e) {}
}

function playSceneMusic(src) {
  if (!src) return;
  if (audioEngine.currentSrc === src && audioEngine.bgMusic && !audioEngine.bgMusic.paused) {
    return;
  }
  stopMusic();
  audioEngine.bgMusic = new Audio(src);
  audioEngine.bgMusic.loop = true;
  audioEngine.bgMusic.volume = 0.38;
  audioEngine.currentSrc = src;
  if (audioEngine.enabled) {
    audioEngine.bgMusic.play().catch(() => {
      document.addEventListener('click', function resumeAudio() {
        if (audioEngine.enabled && audioEngine.bgMusic) {
          audioEngine.bgMusic.play().catch(() => {});
        }
        document.removeEventListener('click', resumeAudio);
      }, { once: true });
    });
  }
}

function stopMusic() {
  if (audioEngine.bgMusic) {
    audioEngine.bgMusic.pause();
    audioEngine.bgMusic.currentTime = 0;
    audioEngine.bgMusic = null;
    audioEngine.currentSrc = null;
  }
}

elements.audioBtn.addEventListener('click', () => {
// -----------------------------------------------
// MENU SYSTEM
// -----------------------------------------------

const menuBtn  = document.getElementById('menu-btn');
const gameMenu = document.getElementById('game-menu');

menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = !gameMenu.classList.contains('hidden');
  if (isOpen) {
    hide(gameMenu);
    menuBtn.querySelector('#menu-icon').textContent = '☰';
  } else {
    show(gameMenu);
    menuBtn.querySelector('#menu-icon').textContent = '✕';
  }
});

// Close menu when clicking anywhere outside it
document.addEventListener('click', (e) => {
  if (!gameMenu.classList.contains('hidden') &&
      !gameMenu.contains(e.target) &&
      e.target !== menuBtn) {
    hide(gameMenu);
    menuBtn.querySelector('#menu-icon').textContent = '☰';
  }
});

// Close menu when any menu item is tapped
document.querySelectorAll('.menu-item').forEach(btn => {
  btn.addEventListener('click', () => {
    hide(gameMenu);
    menuBtn.querySelector('#menu-icon').textContent = '☰';
  });
});

// Fullscreen toggle
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// Pulse the menu button on first visit to teach players it exists
const menuTutorialKey = 'adventopia_menu_seen';
if (!localStorage.getItem(menuTutorialKey)) {
  setTimeout(() => {
    menuBtn.classList.add('pulse');
    menuBtn.addEventListener('animationend', () => {
      menuBtn.classList.remove('pulse');
      localStorage.setItem(menuTutorialKey, '1');
    }, { once: true });
  }, 2000);
}
  audioEngine.enabled = !audioEngine.enabled;
  gameState.audioEnabled = audioEngine.enabled;
  elements.audioBtn.textContent = audioEngine.enabled ? '🔊 Audio' : '🔇 Audio';
  if (audioEngine.enabled) {
    if (audioEngine.bgMusic) audioEngine.bgMusic.play().catch(() => {});
  } else {
    if (audioEngine.bgMusic) audioEngine.bgMusic.pause();
  }
});

// -----------------------------------------------
// 17. ORIENTATION DETECTION
// -----------------------------------------------

function checkOrientation() {
  const isPortrait = window.innerHeight > window.innerWidth;
  if (isPortrait) {
    show(elements.orientationWarning);
  } else {
    hide(elements.orientationWarning);
  }
}

// -----------------------------------------------
// 18. GAME INIT
// -----------------------------------------------

async function initGame() {
  try {
    // Explicitly hide all overlays before anything loads.
    // Prevents stale CSS states from showing overlays on startup.
    hide(elements.rewardOverlay);
    hide(elements.hintOverlay);
    hide(elements.dialogueBox);
    hide(elements.puzzleOverlay);
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

if (screen.orientation && screen.orientation.lock) {
  screen.orientation.lock('landscape').catch(err => {
    console.log('Orientation lock not supported or denied:', err);
  });
}

initGame();
