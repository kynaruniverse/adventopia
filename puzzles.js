/* =============================================
   ADVENTOPIA — puzzles.js
   All puzzle rendering and logic
   ============================================= */


// -----------------------------------------------
// PUZZLE 1 — THE BREAD SORT
// Type: Matching / Sorting (drag and drop)
// -----------------------------------------------

function renderBreadSortPuzzle(puzzleData) {

  // Shuffle items randomly for replayability
  const items = [...puzzleData.items].sort(() => Math.random() - 0.5);

  // Build the puzzle HTML
  elements.puzzleContainer.innerHTML = `

    <h2 style="color:#2C5F8A; font-size:1.3rem; margin-bottom:8px;">
      ${puzzleData.name}
    </h2>

    <p style="color:#555; font-size:0.9rem;
              margin-bottom:16px; line-height:1.5;">
      ${puzzleData.description}
    </p>

    <!-- Failure message — hidden until needed -->
    <p id="puzzle-fail-msg"
       style="display:none; color:#e53935; font-weight:bold;
              margin-bottom:10px; font-size:0.9rem;">
    </p>

    <!-- Bread items to drag -->
    <div id="bread-items"
         style="display:flex; flex-wrap:wrap; gap:8px;
                justify-content:center; margin-bottom:20px;">
      ${items.map(item => `
        <div class="bread-item"
             id="item-${item.id}"
             data-id="${item.id}"
             data-symbol="${item.symbol}"
             draggable="true"
             style="background:#FFF3E0; border:2px solid #FF9800;
                    border-radius:10px; padding:10px 14px;
                    cursor:grab; font-size:0.85rem;
                    font-weight:bold; color:#333;
                    user-select:none; text-align:center;
                    min-width:80px;">
          ${getSymbolEmoji(item.symbol)}
          <br/>${item.label}
        </div>
      `).join('')}
    </div>

    <!-- Baskets to drop into -->
    <div style="display:flex; gap:12px;
                justify-content:center; flex-wrap:wrap;
                margin-bottom:20px;">
      ${puzzleData.baskets.map(basket => `
        <div class="basket-zone"
             id="basket-${basket.id}"
             data-symbol="${basket.symbol}"
             style="background:${basket.color}33;
                    border:3px dashed ${basket.color};
                    border-radius:14px; padding:12px;
                    min-width:100px; min-height:100px;
                    text-align:center; font-weight:bold;
                    color:#333; font-size:0.85rem;">
          ${getSymbolEmoji(basket.symbol)}
          <br/>${basket.label}
          <div class="basket-contents"
               id="contents-${basket.id}"
               style="margin-top:8px; display:flex;
                      flex-wrap:wrap; gap:4px;
                      justify-content:center;">
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Buttons -->
    <div style="display:flex; gap:10px;
                justify-content:center; flex-wrap:wrap;">
      <button onclick="checkBreadSort('${puzzleData.id}')"
        style="background:#4CAF50; color:white; border:none;
               border-radius:20px; padding:10px 28px;
               font-size:1rem; cursor:pointer; font-weight:bold;">
        Check ✓
      </button>
      <button onclick="closePuzzle()"
        style="background:#9E9E9E; color:white; border:none;
               border-radius:20px; padding:10px 20px;
               font-size:0.9rem; cursor:pointer;">
        Close
      </button>
    </div>
  `;

  // Set up drag and drop
  setupBreadSortDragDrop();
}


// Symbol emoji helper
function getSymbolEmoji(symbol) {
  const map = {
    circle:   '⬤',
    square:   '■',
    triangle: '▲',
    star:     '★'
  };
  return map[symbol] || '?';
}


// Set up drag and drop interactions
function setupBreadSortDragDrop() {
  const items   = document.querySelectorAll('.bread-item');
  const baskets = document.querySelectorAll('.basket-zone');

  // Drag events for each bread item
  items.forEach(item => {

    item.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', item.dataset.id);
      item.style.opacity = '0.5';
    });

    item.addEventListener('dragend', () => {
      item.style.opacity = '1';
    });

    // Touch support for mobile
    item.addEventListener('touchstart', handleTouchStart, { passive: true });
    item.addEventListener('touchmove',  handleTouchMove,  { passive: false });
    item.addEventListener('touchend',   handleTouchEnd);
  });

  // Drop events for each basket
  baskets.forEach(basket => {

    basket.addEventListener('dragover', e => {
      e.preventDefault();
      basket.style.transform = 'scale(1.04)';
    });

    basket.addEventListener('dragleave', () => {
      basket.style.transform = 'scale(1)';
    });

    basket.addEventListener('drop', e => {
      e.preventDefault();
      basket.style.transform = 'scale(1)';
      const itemId  = e.dataTransfer.getData('text/plain');
      const itemEl  = document.getElementById(`item-${itemId}`);
      if (!itemEl) return;

      // Move item into basket contents area
      const contents = basket.querySelector('.basket-contents');
      itemEl.style.cursor  = 'default';
      itemEl.style.fontSize = '0.75rem';
      itemEl.draggable     = false;
      contents.appendChild(itemEl);
    });
  });
}


// Touch drag state
let touchDragEl   = null;
let touchClone    = null;
let touchOffsetX  = 0;
let touchOffsetY  = 0;

function handleTouchStart(e) {
  touchDragEl  = e.currentTarget;
  const touch  = e.touches[0];
  const rect   = touchDragEl.getBoundingClientRect();
  touchOffsetX = touch.clientX - rect.left;
  touchOffsetY = touch.clientY - rect.top;

  // Create a visual clone to drag
  touchClone = touchDragEl.cloneNode(true);
  touchClone.style.position  = 'fixed';
  touchClone.style.opacity   = '0.75';
  touchClone.style.zIndex    = '9999';
  touchClone.style.pointerEvents = 'none';
  touchClone.style.width     = rect.width + 'px';
  touchClone.style.left      = (touch.clientX - touchOffsetX) + 'px';
  touchClone.style.top       = (touch.clientY - touchOffsetY) + 'px';
  touchClone._offsetX = touchOffsetX;
  touchClone._offsetY = touchOffsetY;
  document.body.appendChild(touchClone);
}

function handleTouchMove(e) {
  e.preventDefault();
  const clone = touchClone || pageTouchClone;
  if (!clone) return;
  const touch   = e.touches[0];
  const offsetX = clone._offsetX || 0;
  const offsetY = clone._offsetY || 0;
  clone.style.left = (touch.clientX - offsetX) + 'px';
  clone.style.top  = (touch.clientY - offsetY) + 'px';
}

function handleTouchEnd(e) {
  if (!touchClone || !touchDragEl) return;

  const touch   = e.changedTouches[0];
  const target  = document.elementFromPoint(touch.clientX, touch.clientY);
  const basket  = target ? target.closest('.basket-zone') : null;

  if (basket) {
    const contents = basket.querySelector('.basket-contents');

    // Preserve all data attributes when moving element
    const symbol = touchDragEl.getAttribute('data-symbol');
    const id     = touchDragEl.getAttribute('data-id');

    touchDragEl.style.cursor   = 'default';
    touchDragEl.style.fontSize = '0.75rem';
    touchDragEl.draggable      = false;

    // Re-set attributes explicitly after move
    contents.appendChild(touchDragEl);
    touchDragEl.setAttribute('data-symbol', symbol);
    touchDragEl.setAttribute('data-id', id);
  }

  touchClone.remove();
  touchClone  = null;
  touchDragEl = null;
}


// Check the bread sort answer
function checkBreadSort(puzzleId) {
  const puzzleData = gameState.activePuzzle;
  if (!puzzleData) return;

  const baskets    = document.querySelectorAll('.basket-zone');
  let allCorrect   = true;
  let totalPlaced  = 0;

  baskets.forEach(basket => {
    const basketSymbol = basket.getAttribute('data-symbol');
    const items = basket.querySelectorAll('.bread-item');

    items.forEach(item => {
      totalPlaced++;
      const itemSymbol = item.getAttribute('data-symbol');
      if (itemSymbol !== basketSymbol) {
        allCorrect = false;
        item.style.border = '2px solid #e53935';
      } else {
        item.style.border = '2px solid #4CAF50';
      }
    });
  });

  if (totalPlaced < puzzleData.items.length) {
    const failMsg = document.getElementById('puzzle-fail-msg');
    if (failMsg) {
      failMsg.textContent = 'Place all the bread into baskets first!';
      failMsg.style.display = 'block';
      setTimeout(() => { failMsg.style.display = 'none'; }, 2500);
    }
    return;
  }

  if (allCorrect) {
    setTimeout(() => puzzleSolved(puzzleId, puzzleData.reward), 600);
  } else {
    puzzleFailed(puzzleId, puzzleData.failureMessage);
  }
}


// -----------------------------------------------
// PUZZLE 2 — THE STORY PAGES
// Type: Sequencing (drag into numbered slots)
// -----------------------------------------------

function renderStoryPagesPuzzle(puzzleData) {

  // Shuffle pages randomly for replayability
  const pages = [...puzzleData.pages].sort(() => Math.random() - 0.5);

  elements.puzzleContainer.innerHTML = `

    <h2 style="color:#2C5F8A; font-size:1.3rem; margin-bottom:8px;">
      ${puzzleData.name}
    </h2>

    <p style="color:#555; font-size:0.9rem;
              margin-bottom:16px; line-height:1.5;">
      ${puzzleData.description}
    </p>

    <!-- Failure message -->
    <p id="puzzle-fail-msg"
       style="display:none; color:#e53935; font-weight:bold;
              margin-bottom:10px; font-size:0.9rem;">
    </p>

    <!-- Two column layout — pages on left, slots on right -->
    <div style="display:flex; gap:16px;
                justify-content:center; flex-wrap:wrap;
                margin-bottom:20px;">

      <!-- LEFT: Loose pages to drag -->
      <div style="flex:1; min-width:140px;">
        <p style="font-size:0.8rem; color:#888;
                  margin-bottom:8px; font-weight:bold;">
          PAGES
        </p>
        <div id="page-pool"
             style="display:flex; flex-direction:column;
                    gap:8px; min-height:60px;">
          ${pages.map(page => `
            <div class="story-page"
                 id="page-${page.id}"
                 data-id="${page.id}"
                 data-correct="${page.correctPosition}"
                 draggable="true"
                 style="background:#FFF8E1;
                        border:2px solid #FFB300;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:grab;
                        font-size:0.8rem;
                        color:#333;
                        line-height:1.4;
                        user-select:none;">
              📄 ${page.text}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- RIGHT: Numbered slots to drop into -->
      <div style="flex:1; min-width:140px;">
        <p style="font-size:0.8rem; color:#888;
                  margin-bottom:8px; font-weight:bold;">
          ORDER
        </p>
        <div style="display:flex;
                    flex-direction:column; gap:8px;">
          ${[1,2,3,4,5].map(num => `
            <div class="page-slot"
                 id="slot-${num}"
                 data-slot="${num}"
                 style="background:#F3F4F6;
                        border:3px dashed #BDBDBD;
                        border-radius:10px;
                        padding:10px 12px;
                        min-height:52px;
                        font-size:0.85rem;
                        font-weight:bold;
                        color:#BDBDBD;
                        display:flex;
                        align-items:center;">
              ${num}.
            </div>
          `).join('')}
        </div>
      </div>

    </div>

    <!-- Buttons -->
    <div style="display:flex; gap:10px;
                justify-content:center; flex-wrap:wrap;">
      <button onclick="checkStoryPages('${puzzleData.id}')"
        style="background:#4CAF50; color:white; border:none;
               border-radius:20px; padding:10px 28px;
               font-size:1rem; cursor:pointer; font-weight:bold;">
        Check Order ✓
      </button>
      <button onclick="closePuzzle()"
        style="background:#9E9E9E; color:white; border:none;
               border-radius:20px; padding:10px 20px;
               font-size:0.9rem; cursor:pointer;">
        Close
      </button>
    </div>
  `;

  // Set up drag and drop for story pages
  setupStoryPagesDragDrop();
}


// Set up drag and drop for story pages
function setupStoryPagesDragDrop() {
  const pages = document.querySelectorAll('.story-page');
  const slots = document.querySelectorAll('.page-slot');

  pages.forEach(page => {

    page.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', page.dataset.id);
      e.dataTransfer.setData('source-type', 'page');
      page.style.opacity = '0.5';
    });

    page.addEventListener('dragend', () => {
      page.style.opacity = '1';
    });

    // Touch support
    page.addEventListener('touchstart', handlePageTouchStart,
      { passive: true });
    page.addEventListener('touchmove', handleTouchMove,
      { passive: false });
    page.addEventListener('touchend', handlePageTouchEnd);
  });

  slots.forEach(slot => {

    slot.addEventListener('dragover', e => {
      e.preventDefault();
      slot.style.background = '#E3F2FD';
      slot.style.borderColor = '#2C5F8A';
    });

    slot.addEventListener('dragleave', () => {
      if (!slot.querySelector('.story-page')) {
        slot.style.background = '#F3F4F6';
        slot.style.borderColor = '#BDBDBD';
      }
    });

    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.style.background = '#F3F4F6';
      slot.style.borderColor = '#BDBDBD';

      const pageId = e.dataTransfer.getData('text/plain');
      const pageEl = document.getElementById(`page-${pageId}`);
      if (!pageEl) return;

      // If slot already has a page send it back to pool
      const existing = slot.querySelector('.story-page');
      if (existing) {
        document.getElementById('page-pool').appendChild(existing);
        existing.draggable = true;
        existing.style.opacity = '1';
      }

      // Place new page in slot
      slot.innerHTML = '';
      pageEl.style.cursor = 'grab';
      pageEl.draggable = true;
      slot.appendChild(pageEl);

      // Re-attach drag listeners since element moved
      pageEl.addEventListener('dragstart', e2 => {
        e2.dataTransfer.setData('text/plain', pageEl.dataset.id);
        pageEl.style.opacity = '0.5';
      });
      pageEl.addEventListener('dragend', () => {
        pageEl.style.opacity = '1';
      });
    });
  });

  // Also make the page pool a drop target
  // so pages can be dragged back out of slots
  const pool = document.getElementById('page-pool');
  if (pool) {
    pool.addEventListener('dragover', e => {
      e.preventDefault();
      pool.style.background = '#FFFDE7';
    });

    pool.addEventListener('dragleave', () => {
      pool.style.background = 'transparent';
    });

    pool.addEventListener('drop', e => {
      e.preventDefault();
      pool.style.background = 'transparent';
      const pageId = e.dataTransfer.getData('text/plain');
      const pageEl = document.getElementById(`page-${pageId}`);
      if (!pageEl) return;

      // Remove from slot if it was in one
      const parentSlot = pageEl.closest('.page-slot');
      if (parentSlot) {
        parentSlot.innerHTML = `${parentSlot.dataset.slot}.`;
        parentSlot.style.color = '#BDBDBD';
      }

      pool.appendChild(pageEl);
    });
  }
}


// Touch state for story pages
let pageTouchEl  = null;
let pageTouchClone = null;

function handlePageTouchStart(e) {
  pageTouchEl = e.currentTarget;
  const touch  = e.touches[0];
  const rect   = pageTouchEl.getBoundingClientRect();
  const offsetX = touch.clientX - rect.left;
  const offsetY = touch.clientY - rect.top;

  pageTouchClone = pageTouchEl.cloneNode(true);
  pageTouchClone.style.position      = 'fixed';
  pageTouchClone.style.opacity       = '0.75';
  pageTouchClone.style.zIndex        = '9999';
  pageTouchClone.style.pointerEvents = 'none';
  pageTouchClone.style.width         = rect.width + 'px';
  pageTouchClone.style.left          = (touch.clientX - offsetX) + 'px';
  pageTouchClone.style.top           = (touch.clientY - offsetY) + 'px';
  pageTouchClone._offsetX            = offsetX;
  pageTouchClone._offsetY            = offsetY;
  document.body.appendChild(pageTouchClone);
}

function handlePageTouchEnd(e) {
  if (!pageTouchClone || !pageTouchEl) return;

  const touch  = e.changedTouches[0];
  const target = document.elementFromPoint(
    touch.clientX, touch.clientY
  );
  const slot = target ? target.closest('.page-slot') : null;
  const pool = target ? target.closest('#page-pool') : null;

  if (slot) {
    const existing = slot.querySelector('.story-page');
    if (existing) {
      document.getElementById('page-pool').appendChild(existing);
    }
    slot.innerHTML = '';
    const correctVal = pageTouchEl.getAttribute('data-correct');
    const idVal      = pageTouchEl.getAttribute('data-id');
    slot.appendChild(pageTouchEl);
    pageTouchEl.setAttribute('data-correct', correctVal);
    pageTouchEl.setAttribute('data-id', idVal);
    
  } else if (pool) {
    // Return to pool
    const parentSlot = pageTouchEl.closest('.page-slot');
    if (parentSlot) {
      parentSlot.innerHTML = `${parentSlot.dataset.slot}.`;
    }
    pool.appendChild(pageTouchEl);
  }

  pageTouchClone.remove();
  pageTouchClone = null;
  pageTouchEl    = null;
}


// Check the story pages answer
function checkStoryPages(puzzleId) {
  const puzzleData = gameState.activePuzzle;
  if (!puzzleData) return;
  const slots = document.querySelectorAll('.page-slot');
  let allFilled  = true;
  let allCorrect = true;

  slots.forEach(slot => {
    const slotNum = parseInt(slot.dataset.slot);
    const pageEl  = slot.querySelector('.story-page');

    if (!pageEl) {
      allFilled = false;
      // Highlight empty slot
      slot.style.borderColor = '#e53935';
      return;
    }

    const correctPos = parseInt(pageEl.dataset.correct);

    if (correctPos === slotNum) {
      // Correct position — green
      slot.style.borderColor  = '#4CAF50';
      slot.style.background   = '#E8F5E9';
      pageEl.style.borderColor = '#4CAF50';
    } else {
      // Wrong position — red
      allCorrect = false;
      slot.style.borderColor  = '#e53935';
      slot.style.background   = '#FFEBEE';
      pageEl.style.borderColor = '#e53935';
    }
  });

  if (!allFilled) {
    puzzleFailed(puzzleId, 'Place a page in every slot before checking!');
    return;
  }

  if (allCorrect) {
    setTimeout(() => {
      puzzleSolved(puzzleId, puzzleData.reward);
    }, 600);
  } else {
    puzzleFailed(puzzleId, puzzleData.failureMessage);
  }
}


// -----------------------------------------------
// PUZZLE 3 — THE GATE PATTERN
// Type: Pattern Recognition (select correct symbol)
// Then: Insert all 3 key pieces to complete World 1
// -----------------------------------------------

function renderGatePatternPuzzle(puzzleData) {

  const pattern  = puzzleData.pattern;
  const sequence = pattern.sequence;
  const options  = [...pattern.options].sort(() => Math.random() - 0.5);

  // Check if pattern already solved — show key piece stage
  const patternSolved = gameState.solvedPuzzles.includes(
    puzzleData.id + '_pattern'
  );

  elements.puzzleContainer.innerHTML = `

    <h2 style="color:#2C5F8A; font-size:1.3rem; margin-bottom:8px;">
      ${puzzleData.name}
    </h2>

    <p style="color:#555; font-size:0.9rem;
              margin-bottom:16px; line-height:1.5;">
      ${puzzleData.description}
    </p>

    <!-- Failure message -->
    <p id="puzzle-fail-msg"
       style="display:none; color:#e53935; font-weight:bold;
              margin-bottom:10px; font-size:0.9rem;">
    </p>

    <!-- STAGE 1: Pattern sequence display -->
    <div id="pattern-stage"
         style="display:${patternSolved ? 'none' : 'block'}">

      <p style="font-size:0.85rem; color:#666;
                margin-bottom:12px; font-weight:bold;">
        What comes next in the pattern?
      </p>

      <!-- The sequence row -->
      <div style="display:flex; gap:10px;
                  justify-content:center;
                  margin-bottom:20px; flex-wrap:wrap;">
        ${sequence.map(symbol => `
          <div style="width:60px; height:60px;
                      background:#EEF2FF;
                      border:3px solid #3A7DC9;
                      border-radius:12px;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      font-size:1.8rem;">
            ${getSymbolEmoji(symbol)}
          </div>
        `).join('')}

        <!-- Blank slot for the answer -->
        <div id="answer-slot"
             style="width:60px; height:60px;
                    background:#FFF9C4;
                    border:3px dashed #FFB300;
                    border-radius:12px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:1.8rem;
                    color:#BDBDBD;">
          ?
        </div>
      </div>

      <!-- Answer options -->
      <p style="font-size:0.85rem; color:#666;
                margin-bottom:10px; font-weight:bold;">
        Choose the correct shape:
      </p>

      <div style="display:flex; gap:12px;
                  justify-content:center;
                  margin-bottom:20px; flex-wrap:wrap;">
        ${options.map(option => `
          <button class="pattern-option"
                  data-symbol="${option}"
                  onclick="selectPatternOption(this)"
                  style="width:70px; height:70px;
                         background:#F5F5F5;
                         border:3px solid #BDBDBD;
                         border-radius:14px;
                         font-size:2rem;
                         cursor:pointer;
                         transition:all 0.15s;">
            ${getSymbolEmoji(option)}
          </button>
        `).join('')}
      </div>

      <!-- Check pattern button -->
      <button onclick="checkGatePattern('${puzzleData.id}', '${pattern.answer}')"
        style="background:#4CAF50; color:white; border:none;
               border-radius:20px; padding:10px 28px;
               font-size:1rem; cursor:pointer;
               font-weight:bold; margin-right:8px;">
        Check Pattern ✓
      </button>

      <button onclick="closePuzzle()"
        style="background:#9E9E9E; color:white; border:none;
               border-radius:20px; padding:10px 20px;
               font-size:0.9rem; cursor:pointer;">
        Close
      </button>

    </div>

    <!-- STAGE 2: Key piece insertion -->
    <div id="keypiece-stage"
         style="display:${patternSolved ? 'block' : 'none'}">

      <p style="color:#2e7d32; font-weight:bold;
                font-size:1rem; margin-bottom:16px;">
        ✅ Pattern solved! Now insert your key pieces.
      </p>

      <p style="color:#555; font-size:0.9rem; margin-bottom:20px;">
        You have collected
        <strong>${gameState.collectedKeyPieces.length}</strong>
        of 3 key pieces.
      </p>

      <!-- Key piece slots -->
      <div style="display:flex; gap:16px;
                  justify-content:center; margin-bottom:24px;">
        ${[1,2,3].map(num => {
          const hasKey = gameState.collectedKeyPieces.length >= num;
          return `
            <div style="width:70px; height:70px;
                        background:${hasKey ? '#E8F5E9' : '#F5F5F5'};
                        border:3px solid ${hasKey ? '#4CAF50' : '#BDBDBD'};
                        border-radius:14px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:2rem;">
              ${hasKey ? '🔑' : '○'}
            </div>
          `;
        }).join('')}
      </div>

      ${gameState.collectedKeyPieces.length >= 3 ? `
        <button onclick="completeWorld1()"
          style="background:#FF9800; color:white; border:none;
                 border-radius:20px; padding:12px 32px;
                 font-size:1.1rem; cursor:pointer;
                 font-weight:bold; margin-right:8px;">
          🗝️ Open the Gate!
        </button>
      ` : `
        <p style="color:#e53935; font-size:0.9rem;
                  font-weight:bold; margin-bottom:12px;">
          You need all 3 key pieces first.
          Go back and complete the other puzzles!
        </p>
      `}

      <button onclick="closePuzzle()"
        style="background:#9E9E9E; color:white; border:none;
               border-radius:20px; padding:10px 20px;
               font-size:0.9rem; cursor:pointer;
               margin-top:8px;">
        Close
      </button>

    </div>
  `;
}


// Handle pattern option selection
function selectPatternOption(btn) {
  // Deselect all options
  document.querySelectorAll('.pattern-option').forEach(opt => {
    opt.style.background  = '#F5F5F5';
    opt.style.borderColor = '#BDBDBD';
    opt.style.transform   = 'scale(1)';
    opt.classList.remove('pattern-selected');
  });

  // Select this one
  btn.style.background  = '#E3F2FD';
  btn.style.borderColor = '#2C5F8A';
  btn.style.transform   = 'scale(1.08)';
  btn.classList.add('pattern-selected');

  // Show selected symbol in answer slot
  const slot = document.getElementById('answer-slot');
  if (slot) {
    slot.textContent   = getSymbolEmoji(btn.dataset.symbol);
    slot.style.borderColor = '#2C5F8A';
    slot.style.background  = '#E3F2FD';
  }
}


// Check the gate pattern answer
function checkGatePattern(puzzleId, correctAnswer) {
  const puzzleData = gameState.activePuzzle;
  if (!puzzleData) return;
  const selected = document.querySelector('.pattern-option.pattern-selected');  

  if (!selected) {
    puzzleFailed(puzzleId, 'Choose a shape first!');
    return;
  }

  const chosenSymbol = selected.dataset.symbol;

  if (chosenSymbol === correctAnswer) {
    // Mark pattern stage as solved
    if (!gameState.solvedPuzzles.includes(puzzleId + '_pattern')) {
      gameState.solvedPuzzles.push(puzzleId + '_pattern');
    }

    // Award key piece 3 if not already collected
    if (!gameState.collectedKeyPieces.includes('key_piece_3')) {
      gameState.collectedKeyPieces.push('key_piece_3');
      saveProgress();
      updateInventoryDisplay();
    }

    // Show success then move to key piece stage
    selected.style.background  = '#E8F5E9';
    selected.style.borderColor = '#4CAF50';

    const slot = document.getElementById('answer-slot');
    if (slot) {
      slot.style.background  = '#E8F5E9';
      slot.style.borderColor = '#4CAF50';
    }

    setTimeout(() => {
      // Switch to key piece stage
      const patternStage  = document.getElementById('pattern-stage');
      const keyPieceStage = document.getElementById('keypiece-stage');
      if (patternStage)  patternStage.style.display  = 'none';
      if (keyPieceStage) keyPieceStage.style.display = 'block';

      // Update key piece count display
      const countEl = keyPieceStage.querySelector('strong');
      if (countEl) {
        countEl.textContent = gameState.collectedKeyPieces.length;
      }
    }, 700);

  } else {
    // Wrong answer
    selected.style.background  = '#FFEBEE';
    selected.style.borderColor = '#e53935';

    const slot = document.getElementById('answer-slot');
    if (slot) {
      slot.style.background  = '#FFEBEE';
      slot.style.borderColor = '#e53935';
    }

    puzzleFailed(puzzleId, puzzleData.failureMessage);
  }
}


// Complete World 1 — called when all 3 keys inserted
function completeWorld1() {
  const puzzleData = gameState.activePuzzle;
  if (!puzzleData) return;
  hide(elements.puzzleOverlay);
  elements.puzzleContainer.innerHTML = '';

  // Mark puzzle as fully solved
  if (!gameState.solvedPuzzles.includes(puzzleData.id)) {
    gameState.solvedPuzzles.push(puzzleData.id);
  }

  saveProgress();

  // Show the world complete reward
  showWorldCompleteScreen(puzzleData);
}


// World complete celebration screen
function showWorldCompleteScreen(puzzleData) {
  const reward = puzzleData.reward;

  // Add Village Hero badge
  if (reward.badge && !gameState.achievements.includes(reward.badge)) {
    gameState.achievements.push(reward.badge);
    saveProgress();
  }

  // Build celebration overlay
  const celebrationDiv = document.createElement('div');
  celebrationDiv.id = 'world-complete-screen';
  celebrationDiv.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #1a237e, #283593);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 500;
    text-align: center;
    padding: 24px;
    color: white;
  `;

  celebrationDiv.innerHTML = `
    <div style="font-size:4rem; margin-bottom:16px;
                animation:none;">
      🎉
    </div>

    <h1 style="font-size:2rem; font-weight:bold;
               margin-bottom:12px; color:#FFD700;">
      World Complete!
    </h1>

    <h2 style="font-size:1.2rem; margin-bottom:16px;
               color:#90CAF9; font-weight:normal;">
      The Learning Village
    </h2>

    <p style="font-size:1rem; line-height:1.7;
              margin-bottom:24px; max-width:400px;
              opacity:0.9;">
      ${reward.worldCompleteMessage ||
        'You did it! The gate swings open. Adventure awaits!'}
    </p>

    <!-- Badges earned -->
    <div style="background:rgba(255,255,255,0.1);
                border:2px solid rgba(255,255,255,0.3);
                border-radius:16px; padding:16px 24px;
                margin-bottom:24px;">
      <p style="font-size:0.85rem; opacity:0.7;
                margin-bottom:8px;">
        BADGES EARNED
      </p>
      <div style="display:flex; gap:12px;
                  justify-content:center; flex-wrap:wrap;">
        ${gameState.achievements.map(badge => `
          <div style="background:rgba(255,215,0,0.2);
                      border:2px solid #FFD700;
                      border-radius:10px;
                      padding:8px 14px;
                      font-size:0.85rem;
                      font-weight:bold;
                      color:#FFD700;">
            ⭐ ${badge}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Key pieces display -->
    <div style="display:flex; gap:12px;
                justify-content:center; margin-bottom:28px;">
      ${gameState.collectedKeyPieces.map(() => `
        <div style="font-size:2rem;">🔑</div>
      `).join('')}
    </div>

    <button onclick="dismissWorldComplete()"
      style="background:#FFD700; color:#1a237e;
             border:none; border-radius:24px;
             padding:14px 40px; font-size:1.1rem;
             cursor:pointer; font-weight:bold;
             box-shadow:0 4px 12px rgba(0,0,0,0.3);">
      Continue Adventure 🗺️
    </button>
  `;

  document.body.appendChild(celebrationDiv);
}


// Dismiss world complete screen
function dismissWorldComplete() {
  const screen = document.getElementById('world-complete-screen');
  if (screen) screen.remove();

  // Show coming soon message for World 2
  showDialogue(
    "World 2 is coming soon! " +
    "For now you can replay The Learning Village " +
    "and try to beat your score. Well done Pip!"
  );
}