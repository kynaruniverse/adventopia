/* =============================================
   ADVENTOPIA — scene-art.js
   Handles rendering of backgrounds and objects

   IMAGE SCALING RULES:
   - Backgrounds: cover (fill canvas, crop centre)
   - Characters/objects: contain (fit in slot, no crop)
   ============================================= */


// -----------------------------------------------
// IMAGE CACHE
// Images are loaded once and reused every draw.
// -----------------------------------------------

const imageCache = {};

function getImage(src, onLoad, onError) {
  if (imageCache[src]) {
    const cached = imageCache[src];
    // Already finished loading — fire callback immediately
    if (cached.complete && !cached._error && onLoad) onLoad(cached);
    // Already errored — fire error callback immediately
    if (cached._error && onError) onError();
    // Still loading — callback will never fire, but
    // the next draw tick will catch it via img.complete
    return cached;
  }
  
  const img = new Image();
  imageCache[src] = img;
  
  img.onload  = () => { if (onLoad)  onLoad(img); };
  img.onerror = () => {
    img._error = true;
    console.warn(`[Asset] Failed to load: ${src}`);
    if (onError) onError();
  };
  
  img.src = src;
  return img;
}


// -----------------------------------------------
// COVER DRAW
// Fills the target area completely.
// Maintains aspect ratio — crops from centre.
// Used for scene backgrounds.
// -----------------------------------------------

function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  
  let srcX, srcY, srcW, srcH;
  
  if (imgRatio > targetRatio) {
    // Image is wider than target — crop sides
    srcH = img.naturalHeight;
    srcW = srcH * targetRatio;
    srcX = (img.naturalWidth - srcW) / 2;
    srcY = 0;
  } else {
    // Image is taller than target — crop top/bottom
    srcW = img.naturalWidth;
    srcH = srcW / targetRatio;
    srcX = 0;
    srcY = (img.naturalHeight - srcH) / 2;
  }
  
  ctx.drawImage(img, srcX, srcY, srcW, srcH, x, y, w, h);
}


// -----------------------------------------------
// CONTAIN DRAW
// Fits the image inside the target area.
// Maintains aspect ratio — never crops.
// Centres the image in the slot.
// Used for characters and objects.
// -----------------------------------------------

function drawImageContain(ctx, img, x, y, w, h) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  
  let drawW, drawH, drawX, drawY;
  
  if (imgRatio > targetRatio) {
    // Image is wider — fit to width
    drawW = w;
    drawH = w / imgRatio;
    drawX = x;
    drawY = y + (h - drawH) / 2;
  } else {
    // Image is taller — fit to height
    drawH = h;
    drawW = h * imgRatio;
    drawX = x + (w - drawW) / 2;
    drawY = y;
  }
  
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}


// -----------------------------------------------
// SCENE BACKGROUND
// -----------------------------------------------

function drawSceneArt(ctx, sceneData, width, height) {
  ctx.clearRect(0, 0, width, height);

  if (!sceneData.id) {
    console.warn('[Scene] sceneData is missing an id field — redraws may not fire');
  }

  if (sceneData.backgroundImage) {
    const src       = `assets/backgrounds/${sceneData.backgroundImage}`;
    const sceneId   = sceneData.id;

    const img = getImage(
      src,
      () => {
        if (gameState.currentScene === sceneId) {
          renderSceneObjects(sceneData, -1, -1);
        }
      },
      () => {
        if (gameState.currentScene === sceneId) {
          renderSceneObjects(sceneData, -1, -1);
        }
      }
    );
    
    if (img.complete && !img._error) {
      drawImageCover(ctx, img, 0, 0, width, height);
    } else {
      drawBackgroundPlaceholder(ctx, sceneData, width, height);
    }
    
  } else {
    drawBackgroundPlaceholder(ctx, sceneData, width, height);
  }
}

function drawBackgroundPlaceholder(ctx, sceneData, width, height) {
  ctx.save();
  ctx.fillStyle = sceneData.backgroundColor || '#87CEEB';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle    = 'rgba(255,255,255,0.5)';
  ctx.font         = '24px Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`[${sceneData.name} Background]`, width / 2, height / 2);
  ctx.font = '14px Arial';
  ctx.fillText(
    `Add: assets/backgrounds/${sceneData.id}.png`,
    width / 2, height / 2 + 36
  );
  ctx.restore();
}


// -----------------------------------------------
// OBJECT / CHARACTER DRAWING
// -----------------------------------------------

function drawObjectArt(ctx, obj, canvasWidth, canvasHeight, isHovered = false) {
  const x = (obj.x / 100) * canvasWidth;
  const y = (obj.y / 100) * canvasHeight;
  const w = (obj.w / 100) * canvasWidth;
  const h = (obj.h / 100) * canvasHeight;
  
  ctx.save();
  
  if (isHovered) {
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 24;
    ctx.translate(0, -6);
  }
  
  if (obj.image) {
    const src = `assets/${obj.imageType || 'objects'}/${obj.image}`;
    
    const img = getImage(
      src,
      () => {
        if (typeof activeSceneData !== 'undefined' && activeSceneData) {
          renderSceneObjects(activeSceneData, -1, -1);
        }
      },
      () => {
        obj._imageError = true;
        if (typeof activeSceneData !== 'undefined' && activeSceneData) {
          renderSceneObjects(activeSceneData, -1, -1);
        }
      }
    );
    
    if (img.complete && !img._error && !obj._imageError) {
      drawImageContain(ctx, img, x, y, w, h);
      
      // Gold hover ring drawn around the contain bounds.
      // Coordinates use x/y directly — ctx.translate already
      // shifted the canvas so these land in the right place.
      if (isHovered) {
        const imgRatio    = img.naturalWidth / img.naturalHeight;
        const targetRatio = w / h;
        let drawW, drawH, drawX, drawY;
        if (imgRatio > targetRatio) {
          drawW = w;
          drawH = w / imgRatio;
          drawX = x;
          drawY = y + (h - drawH) / 2;
        } else {
          drawH = h;
          drawW = h * imgRatio;
          drawX = x + (w - drawW) / 2;
          drawY = y;
        }
        ctx.shadowBlur  = 0;
        ctx.strokeStyle = 'rgba(255,215,0,0.8)';
        ctx.lineWidth   = 3;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(drawX - 4, drawY - 4, drawW + 8, drawH + 8, 8);
        } else {
          ctx.rect(drawX - 4, drawY - 4, drawW + 8, drawH + 8);
        }
        ctx.stroke();
      }
      
    } else {
      drawPlaceholderBox(ctx, obj, x, y, w, h, isHovered);
    }
    
  } else {
    drawPlaceholderBox(ctx, obj, x, y, w, h, isHovered);
  }
  
  ctx.restore();
}


// -----------------------------------------------
// PLACEHOLDER BOX
// Shown when an image is missing or still loading
// -----------------------------------------------

function drawPlaceholderBox(ctx, obj, x, y, w, h, isHovered) {
  ctx.fillStyle = obj.color || '#FFD700';
  ctx.strokeStyle = isHovered ? '#FFD700' : 'rgba(0,0,0,0.2)';
  ctx.lineWidth = isHovered ? 4 : 2;
  
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, 10);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();
  ctx.stroke();
  
  ctx.fillStyle    = '#333';
  ctx.font         = `bold ${Math.max(12, w / 6)}px Arial`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(obj.label || obj.id || '?', x + w / 2, y + h / 2);
}