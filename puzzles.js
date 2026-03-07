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
      <button onclick="checkBreadSort('${puzzleData.id}',
                        ${JSON.stringify(puzzleData).replace(/'/g, "\\'")})"
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
  document.body.appendChild(touchClone);
}

function handleTouchMove(e) {
  e.preventDefault();
  if (!touchClone) return;
  const touch = e.touches[0];
  touchClone.style.left = (touch.clientX - touchOffsetX) + 'px';
  touchClone.style.top  = (touch.clientY - touchOffsetY) + 'px';
}

function handleTouchEnd(e) {
  if (!touchClone || !touchDragEl) return;

  const touch   = e.changedTouches[0];
  const target  = document.elementFromPoint(touch.clientX, touch.clientY);
  const basket  = target ? target.closest('.basket-zone') : null;

  if (basket) {
    const contents = basket.querySelector('.basket-contents');
    touchDragEl.style.cursor   = 'default';
    touchDragEl.style.fontSize = '0.75rem';
    touchDragEl.draggable      = false;
    contents.appendChild(touchDragEl);
  }

  touchClone.remove();
  touchClone  = null;
  touchDragEl = null;
}


// Check the bread sort answer
function checkBreadSort(puzzleId, puzzleData) {
  const baskets = document.querySelectorAll('.basket-zone');
  let allCorrect = true;

  baskets.forEach(basket => {
    const basketSymbol = basket.dataset.symbol;
    const items = basket.querySelectorAll('.bread-item');

    items.forEach(item => {
      if (item.dataset.symbol !== basketSymbol) {
        allCorrect = false;
        // Highlight wrong items in red
        item.style.border = '2px solid #e53935';
      } else {
        // Highlight correct items in green
        item.style.border = '2px solid #4CAF50';
      }
    });

    // Check if any items are still in the original area
    const remaining = document.querySelectorAll(
      '#bread-items .bread-item'
    );
    if (remaining.length > 0) allCorrect = false;
  });

  if (allCorrect) {
    setTimeout(() => {
      puzzleSolved(puzzleId, puzzleData.reward);
    }, 600);
  } else {
    puzzleFailed(puzzleId, puzzleData.failureMessage);
  }
}


// -----------------------------------------------
// PUZZLE 2 — THE STORY PAGES
// Placeholder — built in next step
// -----------------------------------------------

function renderStoryPagesPuzzle(puzzleData) {
  elements.puzzleContainer.innerHTML = `
    <h2 style="color:#2C5F8A; margin-bottom:12px;">
      ${puzzleData.name}
    </h2>
    <p style="color:#555; margin-bottom:16px;">
      ${puzzleData.description}
    </p>
    <p style="color:#888; font-size:0.9rem;">
      Coming in the next step...
    </p>
    <button onclick="closePuzzle()"
      style="margin-top:16px; background:#2C5F8A; color:white;
             border:none; border-radius:20px; padding:8px 24px;
             cursor:pointer;">
      Close
    </button>
  `;
}


// -----------------------------------------------
// PUZZLE 3 — THE GATE PATTERN
// Placeholder — built in next step
// -----------------------------------------------

function renderGatePatternPuzzle(puzzleData) {
  elements.puzzleContainer.innerHTML = `
    <h2 style="color:#2C5F8A; margin-bottom:12px;">
      ${puzzleData.name}
    </h2>
    <p style="color:#555; margin-bottom:16px;">
      ${puzzleData.description}
    </p>
    <p style="color:#888; font-size:0.9rem;">
      Coming in the next step...
    </p>
    <button onclick="closePuzzle()"
      style="margin-top:16px; background:#2C5F8A; color:white;
             border:none; border-radius:20px; padding:8px 24px;
             cursor:pointer;">
      Close
    </button>
  `;
}