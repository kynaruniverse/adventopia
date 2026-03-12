/* =============================================
   ADVENTOPIA — scene-art.js
   Handles rendering of backgrounds and objects
   Now optimized for PNG art integration
   ============================================= */

// Image cache — images are loaded once and reused.
// Prevents new Image() being created on every draw call.
const imageCache = {};

function getImage(src, onLoad, onError) {
  if (imageCache[src]) return imageCache[src];
  const img = new Image();
  imageCache[src] = img;
  img.onload = () => { if (onLoad) onLoad(img); };
  img.onerror = () => {
    img._error = true;
    console.warn(`[Asset] Failed to load: ${src}`);
    if (onError) onError();
  };
  img.src = src;
  return img;
}

function drawSceneArt(ctx, sceneData, width, height) {
  ctx.clearRect(0, 0, width, height);

  if (sceneData.backgroundImage) {
    const src = `assets/backgrounds/${sceneData.backgroundImage}`;
    const img = getImage(
      src,
      () => { if (gameState.currentScene === sceneData.id) renderSceneObjects(sceneData, -1, -1); },
      () => { if (gameState.currentScene === sceneData.id) renderSceneObjects(sceneData, -1, -1); }
    );
    if (img.complete && !img._error) {
      ctx.drawImage(img, 0, 0, width, height);
    } else {
      drawBackgroundPlaceholder(ctx, sceneData, width, height);
    }
  } else {
    drawBackgroundPlaceholder(ctx, sceneData, width, height);
  }
}

function drawBackgroundPlaceholder(ctx, sceneData, width, height) {
  ctx.fillStyle = sceneData.backgroundColor || '#87CEEB';
  ctx.fillRect(0, 0, width, height);

  // Add placeholder text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`[PLACEHOLDER: ${sceneData.name} Background]`, width / 2, height / 2);
  ctx.font = '16px Arial';
  ctx.fillText(`(Add assets/backgrounds/${sceneData.id}.png)`, width / 2, height / 2 + 40);
}

/**
 * Draws an interactive object or character.
 * Uses PNG assets if defined, otherwise falls back to placeholders.
 */
function drawObjectArt(ctx, obj, canvasWidth, canvasHeight, isHovered = false) {
  const x = (obj.x / 100) * canvasWidth;
  const y = (obj.y / 100) * canvasHeight;
  const w = (obj.w / 100) * canvasWidth;
  const h = (obj.h / 100) * canvasHeight;
  ctx.save();
  // 1. Apply Hover Effects
  if (isHovered) {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 20;
    // Slight lift effect
    ctx.translate(0, -5);
  }
  // 2. Draw the Image or Placeholder
  if (obj.image) {
    const src = `assets/${obj.imageType || 'objects'}/${obj.image}`;
    const img = getImage(
      src,
      () => { if (activeSceneData) renderSceneObjects(activeSceneData, -1, -1); },
      () => { obj._imageError = true; if (activeSceneData) renderSceneObjects(activeSceneData, -1, -1); }
    );
    if (img.complete && !img._error && !obj._imageError) {
      ctx.drawImage(img, x, y, w, h);
    } else {
      drawPlaceholderBox(ctx, obj, x, y, w, h, isHovered);
    }
  } else {
    drawPlaceholderBox(ctx, obj, x, y, w, h, isHovered);
  }
  ctx.restore();
}

function drawPlaceholderBox(ctx, obj, x, y, w, h, isHovered) {
  // Draw a rounded rectangle
  ctx.fillStyle = obj.color || '#FFD700';
  ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(0,0,0,0.2)';
  ctx.lineWidth = isHovered ? 4 : 2;
  
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, 10);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();
  ctx.stroke();

  // Label
  ctx.fillStyle = '#333';
  ctx.font = `bold ${Math.max(12, w / 6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(obj.label, x + w / 2, y + h / 2);
  
  // Sub-label for asset path
  ctx.font = `${Math.max(8, w / 10)}px Arial`;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText(`PH: ${obj.id}.png`, x + w / 2, y + h / 2 + (h/4));
}
