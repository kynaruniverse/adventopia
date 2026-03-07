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
  audioEnabled: true,
  gameStarted: false,
  navArrows: []
};


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
  audioBtn:        document.getElementById('audio-btn')
};

const ctx = elements.canvas.getContext('2d');


// -----------------------------------------------
// 3. UTILITY FUNCTIONS
// Small helpers used throughout the game
// -----------------------------------------------

function show(el) {
  el.classList.remove('hidden');
}

function hide(el) {
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
  elements.canvas.width  = sceneArea.offsetWidth;
  elements.canvas.height = sceneArea.offsetHeight;
}

// -----------------------------------------------
// SCENE TRANSITION
// Fades out then loads the new scene
// -----------------------------------------------

function transitionToScene(sceneId) {
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
    saveProgress();
  } catch (err) {
    console.error('Scene load error:', err);
    showError();
  }
}


// -----------------------------------------------
// 7. SCENE RENDERER
// Draws the scene background and objects
// -----------------------------------------------

function renderScene(sceneData) {
  resizeCanvas();
  ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

  // Draw background colour as placeholder
  ctx.fillStyle = sceneData.backgroundColor || '#87CEEB';
  ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);

  // Draw scene name top left
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, elements.canvas.width, 44);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(sceneData.name || 'Scene', 16, 28);

  // Draw placeholder objects
  if (sceneData.objects) {
    sceneData.objects.forEach(obj => {
      drawPlaceholderObject(obj);
    });
  }

  // Draw navigation arrows if available
  drawNavigationArrows(sceneData);

  // Set up click detection
  setupSceneClicks(sceneData);

  // Show entry dialogue if first visit
  if (sceneData.entryDialogue) {
    const visitKey = `visited_${sceneData.id}`;
    if (!sessionStorage.getItem(visitKey)) {
      sessionStorage.setItem(visitKey, 'true');
      setTimeout(() => showDialogue(sceneData.entryDialogue), 600);
    }
  }
}

// -----------------------------------------------
// NAVIGATION ARROWS
// Draws left and right arrows for scene movement
// -----------------------------------------------

function drawNavigationArrows(sceneData) {
  const cw = elements.canvas.width;
  const ch = elements.canvas.height;

  // Store arrow hit zones for click detection
  gameState.navArrows = [];

  // Left arrow — go to previous scene
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

  // Right arrow — go to next scene
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

  // Lock icon if locked
  if (locked) {
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔒', x, y + 60);
  }

  ctx.restore();
}
// -----------------------------------------------
// 8. PLACEHOLDER OBJECT DRAWING
// Draws simple coloured boxes for objects
// until real art assets are ready
// -----------------------------------------------


function drawPlaceholderObject(obj) {
  const x = (obj.x / 100) * elements.canvas.width;
  const y = (obj.y / 100) * elements.canvas.height;
  const w = (obj.w / 100) * elements.canvas.width;
  const h = (obj.h / 100) * elements.canvas.height;

  ctx.fillStyle   = obj.color || '#FFD700';
  ctx.strokeStyle = '#333';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#333';
  ctx.font      = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(obj.label || obj.id, x + w / 2, y + h / 2 + 5);
}


// -----------------------------------------------
// 9. CLICK DETECTION
// Handles what happens when a player taps
// an object in the scene
// -----------------------------------------------

function setupSceneClicks(sceneData) {
  elements.canvas.onclick = function(e) {
    const rect   = elements.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check navigation arrows first
    if (gameState.navArrows) {
      for (const arrow of gameState.navArrows) {
        if (
          mouseX >= arrow.x && mouseX <= arrow.x + arrow.w &&
          mouseY >= arrow.y && mouseY <= arrow.y + arrow.h
        ) {
          attemptSceneNavigation(arrow.targetScene);
          return;
        }
      }
    }

    // Check scene objects
    if (!sceneData.objects) return;

    sceneData.objects.forEach(obj => {
      const x = (obj.x / 100) * elements.canvas.width;
      const y = (obj.y / 100) * elements.canvas.height;
      const w = (obj.w / 100) * elements.canvas.width;
      const h = (obj.h / 100) * elements.canvas.height;

      if (
        mouseX >= x && mouseX <= x + w &&
        mouseY >= y && mouseY <= y + h
      ) {
        handleObjectClick(obj);
      }
    });
  };
}

// -----------------------------------------------
// SCENE LOCK CHECKING
// Checks if a scene is locked based on
// key pieces collected
// -----------------------------------------------

function isSceneLocked(sceneId) {
  // Fetch scene data from already loaded cache
  // For now check against known unlock requirements
  const unlockMap = {
    'scene2_library':   'key_piece_1',
    'scene3_town_gate': 'key_piece_2'
  };

  const requiredKey = unlockMap[sceneId];
  if (!requiredKey) return false;

  return !gameState.collectedKeyPieces.includes(requiredKey);
}

function attemptSceneNavigation(targetSceneId) {
  if (isSceneLocked(targetSceneId)) {
    showDialogue(
      "This area is locked for now. " +
      "Solve the puzzle here first to earn a key piece!"
    );
    return;
  }
  transitionToScene(targetSceneId);
}


function handleObjectClick(obj) {
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


// -----------------------------------------------
// 10. DIALOGUE SYSTEM
// Shows NPC speech and story text
// -----------------------------------------------

function showDialogue(text) {
  elements.dialogueText.textContent = text;
  show(elements.dialogueBox);
}

elements.dialogueClose.addEventListener('click', () => {
  hide(elements.dialogueBox);
});


// -----------------------------------------------
// 11. PUZZLE SYSTEM
// Triggers and manages puzzles
// -----------------------------------------------

function triggerPuzzle(puzzleId) {
  if (gameState.solvedPuzzles.includes(puzzleId)) {
    showDialogue("You've already solved this one — great work!");
    return;
  }

  fetch(`data/${puzzleId}.json`)
    .then(res => {
      if (!res.ok) throw new Error('Puzzle not found');
      return res.json();
    })
    .then(puzzleData => {
      renderPuzzle(puzzleData);
    })
    .catch(err => {
      console.error('Puzzle load error:', err);
      showError();
    });
}

function renderPuzzle(puzzleData) {
  elements.puzzleContainer.innerHTML = `
    <h2 style="color:#2C5F8A; margin-bottom:12px;">
      ${puzzleData.name}
    </h2>
    <p style="color:#555; margin-bottom:20px; line-height:1.5;">
      ${puzzleData.description}
    </p>
    <p style="color:#888; font-size:0.9rem;">
      Puzzle interface coming in Phase 4...
    </p>
    <button onclick="closePuzzle()"
      style="margin-top:20px; background:#2C5F8A; color:white;
             border:none; border-radius:20px; padding:8px 24px;
             font-size:0.95rem; cursor:pointer;">
      Close
    </button>
  `;
  show(elements.puzzleOverlay);
}

function closePuzzle() {
  hide(elements.puzzleOverlay);
  elements.puzzleContainer.innerHTML = '';
}

function puzzleSolved(puzzleId, reward) {
  gameState.solvedPuzzles.push(puzzleId);
  saveProgress();
  hide(elements.puzzleOverlay);
  showReward(reward);
}


// -----------------------------------------------
// 12. HINT SYSTEM
// Lumie's hints — shown on request or after
// 2 incorrect attempts
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
    elements.hintText.textContent =
      "You're doing great — keep trying, you'll get it!";
  }

  show(elements.hintOverlay);
}

elements.hintClose.addEventListener('click', () => {
  hide(elements.hintOverlay);
});

elements.hintBtn.addEventListener('click', () => {
  if (gameState.currentScene) {
    elements.hintText.textContent =
      "Click on something in the scene to explore. Look for characters to talk to!";
    show(elements.hintOverlay);
  }
});


// -----------------------------------------------
// 13. INVENTORY SYSTEM
// Collects and displays items in the HUD bar
// -----------------------------------------------

function collectItem(item) {
  if (!gameState.inventory.includes(item.id)) {
    gameState.inventory.push(item.id);
    saveProgress();
    updateInventoryDisplay();
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
    slot.textContent = '🔑';
    elements.inventoryBar.appendChild(slot);
  });
}


// -----------------------------------------------
// 14. REWARD SYSTEM
// Shows badges, key pieces, and positive messages
// -----------------------------------------------

function showReward(reward) {
  elements.rewardText.textContent = reward.text || 'Well done!';
  show(elements.rewardOverlay);

  if (reward.keyPiece) {
    gameState.collectedKeyPieces.push(reward.keyPiece);
    saveProgress();
    updateInventoryDisplay();
  }

  if (reward.badge) {
    gameState.achievements.push(reward.badge);
    saveProgress();
  }
}

elements.rewardClose.addEventListener('click', () => {
  hide(elements.rewardOverlay);

  if (gameState.collectedKeyPieces.length === 3) {
    checkWorldComplete();
  }
});


// -----------------------------------------------
// 15. WORLD COMPLETION CHECK
// Checks if all 3 key pieces are collected
// -----------------------------------------------

function checkWorldComplete() {
  if (gameState.collectedKeyPieces.length >= 3) {
    showDialogue(
      "You collected all 3 golden key pieces! " +
      "The Town Gate is now unlocked. Amazing work, Pip!"
    );
  }
}


// -----------------------------------------------
// 16. AUDIO TOGGLE
// -----------------------------------------------

elements.audioBtn.addEventListener('click', () => {
  gameState.audioEnabled = !gameState.audioEnabled;
  elements.audioBtn.textContent =
    gameState.audioEnabled ? '🔊 Audio' : '🔇 Audio';
});


// -----------------------------------------------
// 17. GAME INIT
// Starts the game — called when page loads
// -----------------------------------------------

async function initGame() {
  try {
    resizeCanvas();
    loadProgress();
    updateInventoryDisplay();

    // Short delay to show loading screen
    await new Promise(resolve => setTimeout(resolve, 1200));

    hide(elements.loadingScreen);
    show(elements.gameContainer);

    // Load first scene or last saved scene
    const startScene = gameState.currentScene || 'scene1_village_square';
    await loadScene(startScene);

    gameState.gameStarted = true;

  } catch (err) {
    console.error('Game init failed:', err);
    showError();
  }
}

// Handle window resize
window.addEventListener('resize', () => {
  if (gameState.gameStarted && gameState.currentScene) {
    resizeCanvas();
  }
});

// Start the game
initGame();