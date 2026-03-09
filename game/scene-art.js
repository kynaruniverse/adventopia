/* =============================================
   ADVENTOPIA — scene-art.js
   Phase 6: Hand-crafted vector art engine
   Pure Canvas 2D — no external assets needed

   Draws full illustrated scenes, characters,
   and interactive objects using layered
   canvas primitives and gradients.
   ============================================= */


// -----------------------------------------------
// COLOUR PALETTE
// -----------------------------------------------
const ART = {
  // Shared
  sky1:      '#89CFF0',
  sky2:      '#C9E8F5',
  ground1:   '#7CB87E',
  ground2:   '#5A9E5C',
  stone:     '#B8A898',
  stoneDark: '#9A8070',
  wood:      '#A0723A',
  woodDark:  '#7A5228',
  leaf:      '#5BAD63',
  leafDark:  '#3D8A45',
  gold:      '#FFD700',
  goldDark:  '#E6A800',
  white:     '#FFFFFF',
  cream:     '#FFF8E7',
  shadow:    'rgba(0,0,0,0.18)',
  shadowSoft:'rgba(0,0,0,0.10)',

  // Characters
  pip: {
    skin:    '#FDDBB4',
    hair:    '#C0712A',
    scarf:   '#E84848',
    shirt:   '#4A90D9',
    trousers:'#3A5F8A',
    pack:    '#8B6340',
  },
  benny: {
    skin:    '#FDDBB4',
    coat:    '#FF8C00',
    hat:     '#8B4513',
    apron:   '#FFFDE7',
  },
  mara: {
    skin:    '#ECC99A',
    robe:    '#7B1FA2',
    hair:    '#E8E8E8',
    glasses: '#5D4037',
  },
  gus: {
    skin:    '#FDDBB4',
    armour:  '#546E7A',
    helmet:  '#37474F',
    cloak:   '#263238',
  }
};


// =============================================
// MASTER SCENE ART DISPATCHER
// Called instead of renderSceneBackground
// =============================================

function drawSceneArt(ctx, sceneData, cw, ch) {
  ctx.clearRect(0, 0, cw, ch);

  switch (sceneData.id) {
    case 'scene1_village_square': drawVillageSquare(ctx, cw, ch); break;
    case 'scene2_library':        drawLibrary(ctx, cw, ch);       break;
    case 'scene3_town_gate':      drawTownGate(ctx, cw, ch);      break;
    default:
      // Fallback — simple gradient
      const fb = ctx.createLinearGradient(0, 0, 0, ch);
      fb.addColorStop(0, sceneData.backgroundColor || '#87CEEB');
      fb.addColorStop(1, '#C5E8C5');
      ctx.fillStyle = fb;
      ctx.fillRect(0, 0, cw, ch);
  }

  // Scene name overlay — top bar
  drawSceneNameBar(ctx, sceneData.name || 'Scene', cw);
}


// -----------------------------------------------
// SHARED: Scene name bar
// -----------------------------------------------
function drawSceneNameBar(ctx, name, cw) {
  const grad = ctx.createLinearGradient(0, 0, 0, 48);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur  = 4;
  ctx.fillText(name, 18, 28);
  ctx.shadowBlur  = 0;
}


// =============================================
// SCENE 1 — VILLAGE SQUARE
// Morning, warm golden light, cobblestones,
// fountain centre, market stalls
// =============================================

function drawVillageSquare(ctx, cw, ch) {
  const s = Math.min(cw, ch);

  // --- SKY ---
  const sky = ctx.createLinearGradient(0, 0, 0, ch * 0.52);
  sky.addColorStop(0, '#5BB8F0');
  sky.addColorStop(0.5, '#8ED4F5');
  sky.addColorStop(1, '#C5E8FA');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, cw, ch * 0.52);

  // Sun
  drawSun(ctx, cw * 0.82, ch * 0.12, s * 0.065);

  // Clouds
  drawCloud(ctx, cw * 0.15, ch * 0.08, s * 0.10);
  drawCloud(ctx, cw * 0.55, ch * 0.06, s * 0.08);

  // --- GROUND — cobblestone plaza ---
  const gnd = ctx.createLinearGradient(0, ch * 0.50, 0, ch);
  gnd.addColorStop(0, '#B8A898');
  gnd.addColorStop(1, '#9A8878');
  ctx.fillStyle = gnd;
  ctx.fillRect(0, ch * 0.50, cw, ch * 0.50);

  // Cobblestone grid
  drawCobblestones(ctx, cw, ch);

  // Grass edges
  ctx.fillStyle = ART.ground1;
  ctx.fillRect(0, ch * 0.49, cw, ch * 0.04);
  drawGrassEdge(ctx, 0, ch * 0.49, cw, ch * 0.03, '#7CB87E');

  // --- BACKGROUND BUILDINGS ---
  drawBuilding(ctx, cw*0.03, ch*0.12, cw*0.18, ch*0.40, '#E8D5B0', '#D4BC90', 3);
  drawBuilding(ctx, cw*0.22, ch*0.08, cw*0.15, ch*0.44, '#D4B896', '#BC9E7C', 2);
  drawBuilding(ctx, cw*0.72, ch*0.10, cw*0.14, ch*0.42, '#C8D8B0', '#AABE8E', 2);
  drawBuilding(ctx, cw*0.86, ch*0.14, cw*0.14, ch*0.38, '#E0C8A8', '#C8AE88', 3);

  // Bunting
  drawBunting(ctx, cw * 0.05, ch * 0.30, cw * 0.95, ch * 0.28, cw);

  // --- FOUNTAIN (x=40 y=50 w=14 h=20) ---
  const fx = cw * 0.40, fy = ch * 0.50, fw = cw * 0.14, fh = ch * 0.20;
  drawFountain(ctx, fx + fw/2, fy + fh*0.65, s * 0.09);

  // --- NOTICE BOARD (x=10 y=35 w=14 h=22) ---
  const nx = cw*0.10, ny = ch*0.35, nw = cw*0.14, nh = ch*0.22;
  drawNoticeBoard(ctx, nx, ny, nw, nh);

  // --- BENCH (x=75 y=65 w=16 h=12) ---
  const bx = cw*0.75, by = ch*0.65, bw = cw*0.16, bh = ch*0.12;
  drawBench(ctx, bx, by, bw, bh);

  // --- BENNY THE BAKER (x=60 y=30 w=18 h=30) ---
  const cx = cw*0.60, cy = ch*0.30, cw2 = cw*0.18, ch2 = ch*0.30;
  drawBenny(ctx, cx + cw2/2, cy + ch2, ch2);

  // Market stall behind Benny
  drawMarketStall(ctx, cx - cw*0.02, cy - ch*0.04, cw2*1.4, ch2*0.5);

  // Pip + Shell in lower left — ambient
  drawPip(ctx, cw * 0.22, ch * 0.72, s * 0.11, false);
  drawShell(ctx, cw * 0.30, ch * 0.76, s * 0.04, 'idle');
}


// =============================================
// SCENE 2 — THE LIBRARY
// Cosy indoor, warm lantern light,
// tall bookshelves, reading table
// =============================================

function drawLibrary(ctx, cw, ch) {
  const s = Math.min(cw, ch);

  // --- ROOM WALLS & FLOOR ---
  // Warm plaster walls
  const wall = ctx.createLinearGradient(0, 0, 0, ch);
  wall.addColorStop(0, '#E8D8C0');
  wall.addColorStop(0.7, '#D4C0A0');
  wall.addColorStop(1, '#C0AA88');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, cw, ch);

  // Wooden floor
  const floor = ctx.createLinearGradient(0, ch * 0.68, 0, ch);
  floor.addColorStop(0, '#C8A878');
  floor.addColorStop(1, '#A07848');
  ctx.fillStyle = floor;
  ctx.fillRect(0, ch * 0.68, cw, ch * 0.32);

  // Floor planks
  drawFloorPlanks(ctx, cw, ch * 0.68, ch);

  // Dado rail
  ctx.fillStyle = '#B89870';
  ctx.fillRect(0, ch * 0.67, cw, ch * 0.015);
  ctx.fillStyle = '#8B6848';
  ctx.fillRect(0, ch * 0.68, cw, ch * 0.008);

  // Ceiling beam
  ctx.fillStyle = '#7A5228';
  ctx.fillRect(0, 0, cw, ch * 0.06);
  ctx.fillStyle = '#5C3D1A';
  ctx.fillRect(0, ch * 0.055, cw, ch * 0.01);

  // Warm ambient glow (lantern light from right)
  const glow = ctx.createRadialGradient(cw, ch*0.3, 0, cw*0.7, ch*0.4, cw*0.7);
  glow.addColorStop(0, 'rgba(255,200,80,0.22)');
  glow.addColorStop(1, 'rgba(255,180,40,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, cw, ch);

  // Hanging lanterns
  drawLantern(ctx, cw * 0.30, ch * 0.06, s * 0.04);
  drawLantern(ctx, cw * 0.65, ch * 0.06, s * 0.04);

  // --- BOOKSHELVES (x=5 y=10 w=20 h=55) ---
  drawBookshelves(ctx, cw*0.05, ch*0.10, cw*0.20, ch*0.55, s);

  // --- WALL MAP (x=70 y=10 w=22 h=28) ---
  drawWallMap(ctx, cw*0.70, ch*0.10, cw*0.22, ch*0.28);

  // Reading table (ambient)
  drawReadingTable(ctx, cw*0.35, ch*0.60, cw*0.30, ch*0.12);

  // Scattered book pages on floor (flavour)
  drawScatteredPages(ctx, cw, ch);

  // --- SPIRAL STAIRCASE (x=80 y=50 w=14 h=35) ---
  drawSpiralStaircase(ctx, cw*0.80, ch*0.50, cw*0.14, ch*0.35);

  // --- MARA THE LIBRARIAN (x=55 y=25 w=18 h=32) ---
  const mx = cw*0.55, my = ch*0.25, mw = cw*0.18, mh = ch*0.32;
  drawMara(ctx, mx + mw/2, my + mh, mh);
}


// =============================================
// SCENE 3 — THE TOWN GATE
// Late afternoon, golden magical light,
// grand stone archway, ivy, mist beyond
// =============================================

function drawTownGate(ctx, cw, ch) {
  const s = Math.min(cw, ch);

  // --- SKY — golden afternoon ---
  const sky = ctx.createLinearGradient(0, 0, 0, ch * 0.55);
  sky.addColorStop(0, '#FF8C42');
  sky.addColorStop(0.35, '#FFB347');
  sky.addColorStop(0.7, '#FFD27F');
  sky.addColorStop(1, '#FFF0C0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, cw, ch * 0.55);

  // Sun low on horizon
  drawSun(ctx, cw * 0.78, ch * 0.18, s * 0.07);

  // Clouds — warm
  ctx.globalAlpha = 0.6;
  drawCloud(ctx, cw * 0.10, ch * 0.10, s * 0.09, '#FFE0A0');
  drawCloud(ctx, cw * 0.45, ch * 0.07, s * 0.07, '#FFD890');
  ctx.globalAlpha = 1;

  // --- MAGICAL MIST beyond gate ---
  const mist = ctx.createRadialGradient(cw*0.5, ch*0.5, 0, cw*0.5, ch*0.5, cw*0.35);
  mist.addColorStop(0, 'rgba(200,240,255,0.55)');
  mist.addColorStop(0.6, 'rgba(180,220,255,0.20)');
  mist.addColorStop(1, 'rgba(180,220,255,0)');
  ctx.fillStyle = mist;
  ctx.fillRect(cw*0.25, ch*0.15, cw*0.50, ch*0.55);

  // --- GROUND ---
  const gnd = ctx.createLinearGradient(0, ch*0.52, 0, ch);
  gnd.addColorStop(0, '#A89878');
  gnd.addColorStop(1, '#8A7A60');
  ctx.fillStyle = gnd;
  ctx.fillRect(0, ch*0.52, cw, ch*0.48);

  // Cobblestones at gate
  drawCobblestones(ctx, cw, ch, 0.52);

  // Grass strips at sides
  ctx.fillStyle = ART.ground1;
  ctx.fillRect(0, ch*0.51, cw*0.18, ch*0.06);
  ctx.fillRect(cw*0.82, ch*0.51, cw*0.18, ch*0.06);

  // --- STONE WALL BACKDROP ---
  drawStoneWallBackdrop(ctx, cw, ch);

  // --- IVY WALLS (x=2 y=5 w=10 h=50) ---
  drawIvyWall(ctx, cw*0.02, ch*0.05, cw*0.10, ch*0.50);

  // --- GATE ARCH (x=40 y=20 w=22 h=40) ---
  drawGateArch(ctx, cw*0.40, ch*0.12, cw*0.22, ch*0.50, s);

  // --- SIGNPOST (x=72 y=35 w=14 h=30) ---
  drawSignpost(ctx, cw*0.72, ch*0.35, cw*0.14, ch*0.30);

  // --- GUS THE GATEKEEPER (x=15 y=25 w=18 h=32) ---
  const gx = cw*0.15, gy = ch*0.25, gw = cw*0.18, gh = ch*0.32;
  drawGus(ctx, gx + gw/2, gy + gh, gh);

  // Pip ambient
  drawPip(ctx, cw * 0.60, ch * 0.68, s * 0.10, false);
  drawShell(ctx, cw * 0.67, ch * 0.73, s * 0.04, 'excited');
}


// =============================================
// MASTER OBJECT ART DISPATCHER
// Replaces drawPlaceholderObject
// =============================================

function drawObjectArt(ctx, obj, cw, ch, isHovered) {
  const x = (obj.x / 100) * cw;
  const y = (obj.y / 100) * ch;
  const w = (obj.w / 100) * cw;
  const h = (obj.h / 100) * ch;
  const s = Math.min(cw, ch);

  // Hover glow ring
  if (isHovered) {
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur  = 28;
    ctx.strokeStyle = 'rgba(255,215,0,0.8)';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 4, w + 8, h + 8, 12);
    ctx.stroke();
    ctx.restore();

    // "tap to interact" label
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    const lw = 110, lh = 22;
    const lx = x + w/2 - lw/2, ly = y - 30;
    ctx.roundRect(lx, ly, lw, lh, 11);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ tap to interact', x + w/2, ly + 15);
    ctx.restore();
  }
}


// =============================================
// DRAWING HELPERS — ENVIRONMENT
// =============================================

function drawSun(ctx, x, y, r) {
  ctx.save();
  // Rays
  ctx.strokeStyle = 'rgba(255,230,100,0.5)';
  ctx.lineWidth   = r * 0.18;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2);
    ctx.lineTo(x + Math.cos(a) * r * 2.0, y + Math.sin(a) * r * 2.0);
    ctx.stroke();
  }
  // Sun glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
  glow.addColorStop(0, 'rgba(255,240,100,0.45)');
  glow.addColorStop(1, 'rgba(255,200,50,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Core
  const sunGrad = ctx.createRadialGradient(x - r*0.2, y - r*0.2, 0, x, y, r);
  sunGrad.addColorStop(0, '#FFFDE0');
  sunGrad.addColorStop(1, '#FFD040');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCloud(ctx, x, y, r, color = '#FFFFFF') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur  = r * 0.5;
  const blobs = [
    [0, 0, r], [-r*0.6, r*0.2, r*0.7], [r*0.6, r*0.2, r*0.75],
    [-r*1.1, r*0.4, r*0.55], [r*1.1, r*0.35, r*0.55],
  ];
  blobs.forEach(([dx, dy, rad]) => {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, rad, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawCobblestones(ctx, cw, ch, yStart = 0.50) {
  ctx.save();
  ctx.globalAlpha = 0.28;
  const stoneW = cw / 14;
  const stoneH = ch * 0.055;
  for (let row = 0; row < 9; row++) {
    const offset = (row % 2 === 0) ? 0 : stoneW * 0.5;
    const gy = ch * yStart + row * stoneH;
    for (let col = -1; col < 16; col++) {
      const gx = col * stoneW + offset;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.roundRect(gx + 1, gy + 1, stoneW - 2, stoneH - 2, 3);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawGrassEdge(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  // Tuft row
  const tuftW = w / 60;
  for (let i = 0; i < 60; i++) {
    const tx = x + i * tuftW + Math.random() * tuftW * 0.5;
    const th = h * (0.5 + Math.random() * 0.5);
    ctx.beginPath();
    ctx.moveTo(tx, y + h);
    ctx.quadraticCurveTo(tx + tuftW*0.5, y + h - th, tx + tuftW, y + h);
    ctx.fill();
  }
}

function drawBuilding(ctx, x, y, w, h, wallColor, roofColor, windows) {
  // Wall
  const wall = ctx.createLinearGradient(x, y, x + w, y + h);
  wall.addColorStop(0, wallColor);
  wall.addColorStop(1, roofColor);
  ctx.fillStyle = wall;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Roof
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(x - w*0.05, y);
  ctx.lineTo(x + w/2, y - h*0.25);
  ctx.lineTo(x + w*1.05, y);
  ctx.closePath();
  ctx.fill();

  // Windows
  for (let i = 0; i < windows; i++) {
    const wx = x + (i + 0.5) * (w / (windows + 0.5)) - w*0.07;
    const wy = y + h * 0.30;
    const ww = w * 0.18, wh = h * 0.22;
    ctx.fillStyle = 'rgba(255,240,180,0.8)';
    ctx.beginPath();
    ctx.roundRect(wx, wy, ww, wh, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,80,50,0.5)';
    ctx.lineWidth   = 1;
    ctx.stroke();
    // Cross pane
    ctx.beginPath();
    ctx.moveTo(wx + ww/2, wy);
    ctx.lineTo(wx + ww/2, wy + wh);
    ctx.moveTo(wx, wy + wh/2);
    ctx.lineTo(wx + ww, wy + wh/2);
    ctx.strokeStyle = 'rgba(100,80,50,0.35)';
    ctx.stroke();
  }

  // Door
  const dx = x + w/2 - w*0.12;
  const dy = y + h*0.65;
  const dw = w*0.24, dh = h*0.35;
  ctx.fillStyle = ART.woodDark;
  ctx.beginPath();
  ctx.roundRect(dx, dy, dw, dh, [dw*0.5, dw*0.5, 0, 0]);
  ctx.fill();
}

function drawBunting(ctx, x1, y1, x2, y2, cw) {
  const colors = ['#E84848','#4A90D9','#FFD700','#5BAD63','#FF8C00','#9C27B0'];
  const numFest = 18;
  ctx.save();
  ctx.lineWidth = 1.5;
  // Rope
  ctx.strokeStyle = 'rgba(100,70,40,0.5)';
  ctx.beginPath();
  for (let i = 0; i <= numFest; i++) {
    const t  = i / numFest;
    const px = x1 + (x2 - x1) * t;
    const sag = Math.sin(t * Math.PI) * 18;
    const py = y1 + (y2 - y1) * t + sag;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Triangular flags
  for (let i = 0; i < numFest; i++) {
    const t  = (i + 0.5) / numFest;
    const px = x1 + (x2 - x1) * t;
    const sag = Math.sin(t * Math.PI) * 18;
    const py = y1 + (y2 - y1) * t + sag;
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(px - 8, py);
    ctx.lineTo(px + 8, py);
    ctx.lineTo(px, py + 16);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawFloorPlanks(ctx, cw, yFloor, ch) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  const plankH = (ch - yFloor) / 7;
  for (let i = 0; i < 7; i++) {
    ctx.strokeStyle = 'rgba(80,50,20,0.5)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, yFloor + i * plankH);
    ctx.lineTo(cw, yFloor + i * plankH);
    ctx.stroke();
  }
  // Vertical joins
  const joinSpacing = cw / 8;
  for (let j = 0; j < 9; j++) {
    const offset = (j % 2 === 0) ? 0 : joinSpacing * 0.5;
    ctx.strokeStyle = 'rgba(80,50,20,0.25)';
    ctx.beginPath();
    ctx.moveTo(j * joinSpacing + offset, yFloor);
    ctx.lineTo(j * joinSpacing + offset, ch);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLantern(ctx, x, y, r) {
  // Cord
  ctx.strokeStyle = '#5C3D1A';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, y);
  ctx.stroke();

  // Glow
  const glow = ctx.createRadialGradient(x, y + r, 0, x, y + r, r * 4);
  glow.addColorStop(0, 'rgba(255,200,60,0.35)');
  glow.addColorStop(1, 'rgba(255,180,40,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y + r, r * 4, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#D4A020';
  ctx.beginPath();
  ctx.roundRect(x - r, y, r * 2, r * 2.2, r * 0.3);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,220,80,0.6)';
  ctx.beginPath();
  ctx.roundRect(x - r*0.65, y + r*0.2, r*1.3, r*1.6, r*0.2);
  ctx.fill();
  // Cap
  ctx.fillStyle = '#A07010';
  ctx.beginPath();
  ctx.moveTo(x - r*1.2, y + r*0.1);
  ctx.lineTo(x + r*1.2, y + r*0.1);
  ctx.lineTo(x + r*0.8, y);
  ctx.lineTo(x - r*0.8, y);
  ctx.closePath();
  ctx.fill();
}

function drawStoneWallBackdrop(ctx, cw, ch) {
  // Stone wall
  const wallGrad = ctx.createLinearGradient(0, 0, 0, ch * 0.55);
  wallGrad.addColorStop(0, '#A09080');
  wallGrad.addColorStop(1, '#8A7868');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, ch*0.18, cw, ch*0.38);

  // Stone texture
  ctx.save();
  ctx.globalAlpha = 0.2;
  const sw = cw / 10, sh = ch * 0.06;
  for (let row = 0; row < 7; row++) {
    const offset = (row % 2 === 0) ? 0 : sw * 0.5;
    for (let col = -1; col < 12; col++) {
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.roundRect(col*sw + offset + 1, ch*0.18 + row*sh + 1, sw - 2, sh - 2, 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}


// =============================================
// DRAWING HELPERS — SCENE OBJECTS
// =============================================

function drawFountain(ctx, cx, cy, r) {
  ctx.save();
  // Shadow
  ctx.fillStyle = ART.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r*0.2, r*1.1, r*0.3, 0, 0, Math.PI*2);
  ctx.fill();

  // Basin
  const basin = ctx.createRadialGradient(cx, cy, r*0.2, cx, cy, r);
  basin.addColorStop(0, '#90CAF9');
  basin.addColorStop(0.7, '#5E9AC8');
  basin.addColorStop(1, '#B8A898');
  ctx.fillStyle = basin;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r*0.35, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#8898A8';
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Centre pillar
  ctx.fillStyle = '#A09888';
  ctx.beginPath();
  ctx.roundRect(cx - r*0.12, cy - r*0.9, r*0.24, r*0.9, r*0.06);
  ctx.fill();

  // Small top bowl
  ctx.fillStyle = '#90C0E0';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r*0.88, r*0.35, r*0.12, 0, 0, Math.PI*2);
  ctx.fill();

  // Water arc
  ctx.strokeStyle = 'rgba(100,180,255,0.7)';
  ctx.lineWidth   = r * 0.07;
  ctx.lineCap     = 'round';
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r*0.33, cy - r*0.88);
    ctx.quadraticCurveTo(
      cx + Math.cos(a) * r*0.65, cy - r*0.6,
      cx + Math.cos(a) * r*0.55, cy - r*0.12
    );
    ctx.stroke();
  }

  // Glints on water
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  [[-0.25,-0.1],[0.15,-0.05],[-0.05,0.08]].forEach(([dx,dy]) => {
    ctx.beginPath();
    ctx.ellipse(cx + dx*r, cy + dy*r, r*0.05, r*0.025, 0.5, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.restore();
}

function drawNoticeBoard(ctx, x, y, w, h) {
  ctx.save();
  // Post
  ctx.fillStyle = ART.woodDark;
  ctx.beginPath();
  ctx.roundRect(x + w*0.42, y + h*0.65, w*0.16, h*0.38, 3);
  ctx.fill();

  // Board
  const board = ctx.createLinearGradient(x, y, x, y + h*0.7);
  board.addColorStop(0, '#C8A060');
  board.addColorStop(1, '#A07840');
  ctx.fillStyle = board;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h*0.65, 6);
  ctx.fill();
  ctx.strokeStyle = ART.woodDark;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Paper notice
  ctx.fillStyle = '#FFFDE7';
  ctx.beginPath();
  ctx.roundRect(x + w*0.08, y + h*0.08, w*0.84, h*0.50, 3);
  ctx.fill();

  // Text lines
  ctx.fillStyle = '#5A3A1A';
  ctx.font      = `bold ${Math.max(6, w*0.12)}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('NOTICE', x + w/2, y + h*0.22);
  ctx.fillStyle = '#7A5A2A';
  ctx.font      = `${Math.max(5, w*0.09)}px Arial`;
  ctx.fillText('Help needed!', x + w/2, y + h*0.33);
  ctx.fillText('See Benny →', x + w/2, y + h*0.44);

  // Tacks
  ['#FF4040','#4080FF'].forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x + w*(0.15 + i*0.72), y + h*0.10, w*0.055, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.restore();
}

function drawBench(ctx, x, y, w, h) {
  ctx.save();
  // Shadow
  ctx.fillStyle = ART.shadow;
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h*0.95, w*0.45, h*0.18, 0, 0, Math.PI*2);
  ctx.fill();

  // Legs
  ctx.fillStyle = ART.woodDark;
  [[0.12, 0.4],[0.88, 0.4]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.roundRect(x + w*dx - w*0.04, y + h*dy, w*0.08, h*0.58, 2);
    ctx.fill();
  });

  // Seat
  const seat = ctx.createLinearGradient(x, y, x, y + h*0.45);
  seat.addColorStop(0, '#C8A060');
  seat.addColorStop(1, '#A07840');
  ctx.fillStyle = seat;
  ctx.beginPath();
  ctx.roundRect(x, y + h*0.08, w, h*0.3, 4);
  ctx.fill();
  ctx.strokeStyle = ART.woodDark;
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Backrest
  ctx.fillStyle = '#B89050';
  ctx.beginPath();
  ctx.roundRect(x + w*0.05, y, w*0.90, h*0.15, 3);
  ctx.fill();
  ctx.restore();
}

function drawMarketStall(ctx, x, y, w, h) {
  ctx.save();
  // Awning stripes
  const stripeColors = ['#E84848','#FFFFFF'];
  const stripes = 8;
  const sw = w / stripes;
  ctx.beginPath();
  ctx.moveTo(x - w*0.05, y);
  ctx.lineTo(x + w*1.05, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = stripeColors[i % 2];
    ctx.fillRect(x + i * sw, y, sw, h * 1.5);
  }
  // Scallop edge
  ctx.restore();
  ctx.fillStyle = '#E84848';
  for (let i = 0; i < stripes * 2; i++) {
    ctx.beginPath();
    ctx.arc(x + i * (w / (stripes * 2)) + w/(stripes*4), y + h, w/(stripes*4), 0, Math.PI*2);
    ctx.fill();
  }
  // Posts
  ctx.fillStyle = ART.woodDark;
  ctx.fillRect(x + w*0.03, y, w*0.04, h*2);
  ctx.fillRect(x + w*0.93, y, w*0.04, h*2);
}

function drawBookshelves(ctx, x, y, w, h, s) {
  ctx.save();
  // Shelf unit frame
  const frame = ctx.createLinearGradient(x, y, x + w, y);
  frame.addColorStop(0, '#5D4037');
  frame.addColorStop(1, '#4E342E');
  ctx.fillStyle = frame;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = '#3E2723';
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Shelves (4 rows)
  const bookColors = ['#E53935','#1E88E5','#43A047','#FB8C00','#8E24AA','#F4511E','#00ACC1','#FFD600','#5E35B1','#00897B'];
  const numShelves = 4;
  const shelfH     = h / (numShelves + 0.5);

  for (let row = 0; row < numShelves; row++) {
    const sy = y + h*0.06 + row * shelfH;

    // Shelf board
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(x + w*0.03, sy + shelfH*0.82, w*0.94, shelfH*0.08);

    // Books on shelf
    const numBooks = 5 + Math.floor(row * 1.5);
    const bookW    = (w * 0.88) / numBooks;
    for (let b = 0; b < numBooks; b++) {
      const bx = x + w*0.06 + b * bookW;
      const bh = shelfH * (0.55 + Math.sin(b * 2.3 + row) * 0.15);
      const by = sy + shelfH*0.82 - bh;
      const tilt = Math.sin(b * 1.7) * 2;
      ctx.save();
      ctx.translate(bx + bookW/2, by + bh);
      ctx.rotate((tilt * Math.PI) / 180);
      ctx.fillStyle = bookColors[(b + row * 3) % bookColors.length];
      ctx.beginPath();
      ctx.roundRect(-bookW*0.38, -bh, bookW*0.76, bh, 1);
      ctx.fill();
      // Spine line
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth   = 0.5;
      ctx.beginPath();
      ctx.moveTo(-bookW*0.38 + bookW*0.12, -bh + bh*0.1);
      ctx.lineTo(-bookW*0.38 + bookW*0.12, -bh*0.1);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawWallMap(ctx, x, y, w, h) {
  ctx.save();
  // Frame
  ctx.fillStyle = ART.woodDark;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 4, w + 8, h + 8, 4);
  ctx.fill();

  // Map paper
  const paper = ctx.createLinearGradient(x, y, x + w, y + h);
  paper.addColorStop(0, '#FFF8C8');
  paper.addColorStop(1, '#EED890');
  ctx.fillStyle = paper;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 2);
  ctx.fill();

  // Map content — simple village layout
  ctx.strokeStyle = '#8B6A2A';
  ctx.lineWidth   = 1;
  // Paths
  ctx.beginPath();
  ctx.moveTo(x + w*0.5, y + h*0.5);
  ctx.lineTo(x + w*0.5, y + h*0.9);
  ctx.moveTo(x + w*0.5, y + h*0.5);
  ctx.lineTo(x + w*0.2, y + h*0.3);
  ctx.moveTo(x + w*0.5, y + h*0.5);
  ctx.lineTo(x + w*0.8, y + h*0.3);
  ctx.stroke();
  // Location dots
  const locs = [[0.5,0.9,'#E84848'],[0.2,0.3,'#4A90D9'],[0.8,0.3,'#FFD700'],[0.5,0.5,'#4CAF50']];
  locs.forEach(([dx, dy, col]) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x + w*dx, y + h*dy, w*0.04, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  });
  // Star on gate
  ctx.fillStyle = '#FFD700';
  ctx.font = `bold ${w*0.12}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('★', x + w*0.8, y + h*0.28);

  // Title
  ctx.fillStyle = '#5A3A1A';
  ctx.font = `bold ${w*0.10}px Arial`;
  ctx.fillText('THE VILLAGE', x + w*0.5, y + h*0.12);
  ctx.restore();
}

function drawReadingTable(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = ART.shadow;
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h*1.3, w*0.4, h*0.25, 0, 0, Math.PI*2);
  ctx.fill();

  // Legs
  ctx.fillStyle = ART.woodDark;
  [[0.1],[0.9]].forEach(([dx]) => {
    ctx.beginPath();
    ctx.roundRect(x + w*dx - w*0.03, y + h*0.9, w*0.06, h*0.6, 3);
    ctx.fill();
  });

  // Table top
  const top = ctx.createLinearGradient(x, y, x, y + h);
  top.addColorStop(0, '#D4A878');
  top.addColorStop(1, '#B07848');
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.roundRect(x - w*0.05, y, w*1.1, h*0.9, 5);
  ctx.fill();
  ctx.strokeStyle = ART.woodDark;
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawScatteredPages(ctx, cw, ch) {
  ctx.save();
  const pages = [
    [0.30, 0.72, -12], [0.50, 0.78, 8], [0.65, 0.70, -5],
    [0.25, 0.55, 15], [0.72, 0.62, -18]
  ];
  pages.forEach(([dx, dy, angle]) => {
    const px = cw * dx, py = ch * dy;
    const pw = cw * 0.06, ph = ch * 0.08;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.fillStyle = '#FFFDE7';
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur  = 4;
    ctx.beginPath();
    ctx.roundRect(-pw/2, -ph/2, pw, ph, 2);
    ctx.fill();
    ctx.strokeStyle = '#E0C870';
    ctx.lineWidth   = 0.5;
    ctx.stroke();
    // Text lines on page
    ctx.strokeStyle = '#C8A840';
    ctx.lineWidth   = 0.8;
    for (let l = 0; l < 4; l++) {
      ctx.beginPath();
      ctx.moveTo(-pw*0.35, -ph*0.25 + l * ph*0.18);
      ctx.lineTo(pw*0.35 * (0.6 + l*0.1), -ph*0.25 + l * ph*0.18);
      ctx.stroke();
    }
    ctx.restore();
  });
  ctx.restore();
}

function drawSpiralStaircase(ctx, x, y, w, h) {
  ctx.save();
  // Base
  ctx.fillStyle = ART.stone;
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h*0.95, w*0.42, w*0.15, 0, 0, Math.PI*2);
  ctx.fill();

  // Steps (simplified spiral view)
  const numSteps = 5;
  for (let i = numSteps - 1; i >= 0; i--) {
    const t   = i / numSteps;
    const sw  = w * (0.9 - t * 0.3);
    const sh  = h * 0.12;
    const sx  = x + w/2 - sw/2 + t * w * 0.15;
    const sy  = y + h * (0.85 - i * 0.18);
    const col = `hsl(20, 15%, ${45 + i*5}%)`;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(sx + sw/2, sy, sw/2, sh*0.35, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth   = 1;
    ctx.stroke();
  }
  // Central pole
  ctx.fillStyle = ART.stoneDark;
  ctx.beginPath();
  ctx.roundRect(x + w*0.44, y + h*0.10, w*0.12, h*0.80, w*0.06);
  ctx.fill();
  ctx.restore();
}

function drawIvyWall(ctx, x, y, w, h) {
  ctx.save();
  // Stone wall base
  ctx.fillStyle = ART.stone;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();

  // Ivy clusters
  const ivyColors = ['#3D8A45','#5BAD63','#2E7D32','#4CAF50'];
  for (let i = 0; i < 18; i++) {
    const lx = x + (Math.random() * w);
    const ly = y + (Math.random() * h);
    const lr = w * (0.12 + Math.random() * 0.18);
    ctx.fillStyle = ivyColors[Math.floor(Math.random() * ivyColors.length)];
    ctx.globalAlpha = 0.7 + Math.random() * 0.3;
    ctx.beginPath();
    // Leaf shape
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(Math.random() * Math.PI * 2);
    ctx.ellipse(0, 0, lr, lr * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Sparkle
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(x + w*0.5, y + h*0.3, w*0.06, 0, Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawGateArch(ctx, x, y, w, h, s) {
  ctx.save();
  const cx = x + w / 2;

  // Stone pillar LEFT
  const pillarW = w * 0.22;
  const pillarH = h * 0.85;
  drawStonePillar(ctx, x, y + h*0.15, pillarW, pillarH);
  // Stone pillar RIGHT
  drawStonePillar(ctx, x + w - pillarW, y + h*0.15, pillarW, pillarH);

  // Arch stone over top
  ctx.fillStyle = ART.stone;
  ctx.beginPath();
  ctx.arc(cx, y + h*0.42, w*0.40, Math.PI, 0);
  ctx.lineTo(x + w - pillarW, y + h*0.42);
  ctx.lineTo(x + pillarW, y + h*0.42);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ART.stoneDark;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Arch keystone
  ctx.fillStyle = '#D4C4A8';
  ctx.beginPath();
  ctx.moveTo(cx - w*0.06, y + h*0.04);
  ctx.lineTo(cx + w*0.06, y + h*0.04);
  ctx.lineTo(cx + w*0.04, y + h*0.14);
  ctx.lineTo(cx - w*0.04, y + h*0.14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ART.stoneDark;
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Gate opening (mist visible through)
  const gateX = x + pillarW;
  const gateW = w - pillarW * 2;
  const gateY = y + h*0.15;
  const gateH = h * 0.70;
  const mistGate = ctx.createLinearGradient(cx, gateY, cx, gateY + gateH);
  mistGate.addColorStop(0, 'rgba(180,230,255,0.75)');
  mistGate.addColorStop(1, 'rgba(200,240,200,0.50)');
  ctx.fillStyle = mistGate;
  ctx.beginPath();
  ctx.arc(cx, gateY + gateW*0.48, gateW*0.48, Math.PI, 0);
  ctx.lineTo(gateX + gateW, gateY + gateH);
  ctx.lineTo(gateX, gateY + gateH);
  ctx.closePath();
  ctx.fill();

  // Gate panel / keyhole panel (x=40 y=20 w=22 h=40)
  // Drawn as an ornate panel in the arch
  const panelW = w * 0.55, panelH = h * 0.35;
  const panelX = cx - panelW/2, panelY = gateY + gateH * 0.38;
  drawKeyPanel(ctx, panelX, panelY, panelW, panelH);

  // Ivy on arch
  ctx.fillStyle = ART.leaf;
  ctx.globalAlpha = 0.65;
  for (let i = 0; i < 8; i++) {
    const t  = i / 7;
    const ax = cx + Math.cos(Math.PI + t * Math.PI) * w * 0.40;
    const ay = y + h*0.42 - Math.sin(t * Math.PI) * h * 0.38;
    ctx.beginPath();
    ctx.arc(ax, ay, w * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawStonePillar(ctx, x, y, w, h) {
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#C8B8A8');
  grad.addColorStop(0.4, '#E0D0C0');
  grad.addColorStop(1, '#A89888');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = ART.stoneDark;
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  // Stone lines
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth   = 0.8;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + h * (i/5));
    ctx.lineTo(x + w, y + h * (i/5));
    ctx.stroke();
  }
}

function drawKeyPanel(ctx, x, y, w, h) {
  ctx.save();
  // Panel body
  const panel = ctx.createLinearGradient(x, y, x, y + h);
  panel.addColorStop(0, '#C8A828');
  panel.addColorStop(0.5, '#E8C840');
  panel.addColorStop(1, '#A88018');
  ctx.fillStyle = panel;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#806010';
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Keyhole slots (3)
  const slotSpacing = w / 4;
  for (let i = 0; i < 3; i++) {
    const sx = x + slotSpacing * (i + 0.7);
    const sy = y + h * 0.25;
    const sr = h * 0.20;
    // Slot circle
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI*2);
    ctx.fill();
    // Slot stem
    ctx.fillRect(sx - sr*0.3, sy, sr*0.6, sr*0.9);
    // Inner ring
    ctx.strokeStyle = 'rgba(255,200,50,0.4)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, sr * 0.6, 0, Math.PI*2);
    ctx.stroke();
  }

  // Pattern symbols (4 in a row)
  const symbols = ['★', '●', '★', '●'];
  symbols.forEach((sym, i) => {
    ctx.fillStyle = i < 4 ? '#FFFFFF' : '#806010';
    ctx.font      = `bold ${h*0.22}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(sym, x + w * (i + 0.5) / 4, y + h * 0.88);
  });

  ctx.restore();
}

function drawSignpost(ctx, x, y, w, h) {
  ctx.save();
  // Post
  ctx.fillStyle = ART.wood;
  ctx.beginPath();
  ctx.roundRect(x + w*0.44, y + h*0.30, w*0.12, h*0.72, 3);
  ctx.fill();
  ctx.strokeStyle = ART.woodDark;
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Signs (2 arms)
  [['More worlds', '#F5E8C0', -8], ['← Back', '#E8F0C0', 8]].forEach(([text, col, angle], i) => {
    const sy = y + h * (0.10 + i * 0.25);
    const sw = w * 0.95, sh = h * 0.20;
    ctx.save();
    ctx.translate(x + w/2, sy + sh/2);
    ctx.rotate((angle * Math.PI) / 180);
    // Sign board
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-sw/2, -sh/2);
    ctx.lineTo(sw/2 - sh*0.3, -sh/2);
    ctx.lineTo(sw/2, 0);
    ctx.lineTo(sw/2 - sh*0.3, sh/2);
    ctx.lineTo(-sw/2, sh/2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ART.woodDark;
    ctx.lineWidth   = 1;
    ctx.stroke();
    // Text
    ctx.fillStyle = '#5A3A1A';
    ctx.font = `bold ${Math.max(7, sw*0.14)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, sh*0.22);
    ctx.restore();
  });
  ctx.restore();
}


// =============================================
// CHARACTER DRAWING FUNCTIONS
// =============================================

function drawPip(ctx, x, y, size, isHovered) {
  ctx.save();
  const s = size;
  // Shadow
  ctx.fillStyle = ART.shadow;
  ctx.beginPath();
  ctx.ellipse(x, y + s*0.05, s*0.35, s*0.10, 0, 0, Math.PI*2);
  ctx.fill();

  // Backpack
  ctx.fillStyle = ART.pip.pack;
  ctx.beginPath();
  ctx.roundRect(x + s*0.08, y - s*0.72, s*0.28, s*0.38, 4);
  ctx.fill();
  ctx.strokeStyle = '#5A3A18';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Body / shirt
  ctx.fillStyle = ART.pip.shirt;
  ctx.beginPath();
  ctx.roundRect(x - s*0.18, y - s*0.65, s*0.36, s*0.38, 6);
  ctx.fill();

  // Scarf
  ctx.fillStyle = ART.pip.scarf;
  ctx.beginPath();
  ctx.roundRect(x - s*0.16, y - s*0.44, s*0.32, s*0.10, 3);
  ctx.fill();
  // Scarf tail
  ctx.beginPath();
  ctx.moveTo(x + s*0.06, y - s*0.36);
  ctx.quadraticCurveTo(x + s*0.22, y - s*0.22, x + s*0.18, y - s*0.08);
  ctx.lineTo(x + s*0.10, y - s*0.08);
  ctx.quadraticCurveTo(x + s*0.14, y - s*0.22, x - s*0.02, y - s*0.36);
  ctx.fill();

  // Trousers
  ctx.fillStyle = ART.pip.trousers;
  ctx.beginPath();
  ctx.roundRect(x - s*0.16, y - s*0.28, s*0.14, s*0.32, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + s*0.02, y - s*0.28, s*0.14, s*0.32, 3);
  ctx.fill();

  // Shoes
  ctx.fillStyle = '#3A2A18';
  ctx.beginPath();
  ctx.ellipse(x - s*0.10, y + s*0.04, s*0.12, s*0.06, -0.2, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + s*0.10, y + s*0.04, s*0.12, s*0.06, 0.2, 0, Math.PI*2);
  ctx.fill();

  // Head
  const headGrad = ctx.createRadialGradient(x - s*0.04, y - s*0.78, 0, x, y - s*0.72, s*0.22);
  headGrad.addColorStop(0, '#FDEBC8');
  headGrad.addColorStop(1, ART.pip.skin);
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(x, y - s*0.75, s*0.22, 0, Math.PI*2);
  ctx.fill();

  // Hair
  ctx.fillStyle = ART.pip.hair;
  ctx.beginPath();
  ctx.arc(x, y - s*0.88, s*0.20, Math.PI*0.9, Math.PI*2.1);
  ctx.fill();
  // Side hair tufts
  ctx.beginPath();
  ctx.arc(x - s*0.18, y - s*0.76, s*0.08, Math.PI*0.5, Math.PI*1.5);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#2A1A0A';
  ctx.beginPath();
  ctx.arc(x - s*0.08, y - s*0.76, s*0.04, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + s*0.08, y - s*0.76, s*0.04, 0, Math.PI*2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x - s*0.06, y - s*0.78, s*0.015, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + s*0.10, y - s*0.78, s*0.015, 0, Math.PI*2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = '#5A2A1A';
  ctx.lineWidth   = s*0.025;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.arc(x, y - s*0.70, s*0.08, 0.1, Math.PI - 0.1);
  ctx.stroke();

  ctx.restore();
}

function drawShell(ctx, x, y, r, state) {
  ctx.save();
  // Shadow
  ctx.fillStyle = ART.shadow;
  ctx.beginPath();
  ctx.ellipse(x, y + r*0.2, r*0.8, r*0.25, 0, 0, Math.PI*2);
  ctx.fill();

  // Body (little legs)
  ctx.fillStyle = '#8DC87A';
  ctx.beginPath();
  ctx.ellipse(x, y, r*0.8, r*0.45, 0, 0, Math.PI*2);
  ctx.fill();

  // Excited bounce — slightly up
  const bounce = (state === 'excited') ? -r*0.15 : 0;

  // Shell — glowing
  const shellGrad = ctx.createRadialGradient(x - r*0.2, y - r*0.5 + bounce, 0, x, y - r*0.3 + bounce, r);
  shellGrad.addColorStop(0, '#A0E870');
  shellGrad.addColorStop(0.5, '#5CB840');
  shellGrad.addColorStop(1, '#3A8A28');
  ctx.fillStyle = shellGrad;
  ctx.beginPath();
  ctx.ellipse(x, y - r*0.35 + bounce, r*0.75, r*0.55, 0, 0, Math.PI*2);
  ctx.fill();

  // Shell pattern
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth   = r*0.06;
  ctx.beginPath();
  ctx.arc(x, y - r*0.35 + bounce, r*0.35, 0, Math.PI*2);
  ctx.stroke();
  // Shell glow (when excited)
  if (state === 'excited') {
    const glow = ctx.createRadialGradient(x, y - r*0.35 + bounce, 0, x, y - r*0.35 + bounce, r*1.4);
    glow.addColorStop(0, 'rgba(100,255,80,0.45)');
    glow.addColorStop(1, 'rgba(80,200,60,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y - r*0.35 + bounce, r*1.4, 0, Math.PI*2);
    ctx.fill();
  }

  // Head
  ctx.fillStyle = '#8DC87A';
  ctx.beginPath();
  ctx.arc(x + r*0.55, y - r*0.1, r*0.28, 0, Math.PI*2);
  ctx.fill();
  // Eye
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.arc(x + r*0.65, y - r*0.18, r*0.07, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x + r*0.68, y - r*0.21, r*0.025, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawBenny(ctx, cx, baseY, size) {
  ctx.save();
  const s = size;
  // Shadow
  ctx.fillStyle = ART.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, s*0.30, s*0.08, 0, 0, Math.PI*2);
  ctx.fill();

  // Shoes
  ctx.fillStyle = '#3A2A10';
  ctx.beginPath();
  ctx.ellipse(cx - s*0.12, baseY - s*0.02, s*0.13, s*0.06, -0.2, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + s*0.12, baseY - s*0.02, s*0.13, s*0.06, 0.2, 0, Math.PI*2);
  ctx.fill();

  // Legs / trousers
  ctx.fillStyle = '#8B6340';
  ctx.beginPath();
  ctx.roundRect(cx - s*0.18, baseY - s*0.30, s*0.15, s*0.30, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(cx + s*0.03, baseY - s*0.30, s*0.15, s*0.30, 4);
  ctx.fill();

  // Apron
  ctx.fillStyle = '#FFFDE7';
  ctx.beginPath();
  ctx.roundRect(cx - s*0.17, baseY - s*0.65, s*0.34, s*0.38, 5);
  ctx.fill();
  ctx.strokeStyle = '#E0D4B0';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Coat / body
  ctx.fillStyle = ART.benny.coat;
  ctx.beginPath();
  ctx.roundRect(cx - s*0.19, baseY - s*0.68, s*0.38, s*0.42, 6);
  ctx.fill();

  // Head
  const hg = ctx.createRadialGradient(cx - s*0.04, baseY - s*0.85, 0, cx, baseY - s*0.78, s*0.22);
  hg.addColorStop(0, '#FDEBC8');
  hg.addColorStop(1, ART.benny.skin);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(cx, baseY - s*0.80, s*0.22, 0, Math.PI*2);
  ctx.fill();

  // Baker's hat
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(cx - s*0.16, baseY - s*1.10, s*0.32, s*0.28, [s*0.08, s*0.08, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#F0F0F0';
  ctx.beginPath();
  ctx.roundRect(cx - s*0.18, baseY - s*0.98, s*0.36, s*0.08, 3);
  ctx.fill();
  ctx.strokeStyle = '#DDDDDD';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Rosy cheeks
  ctx.fillStyle = 'rgba(255,150,100,0.30)';
  ctx.beginPath();
  ctx.arc(cx - s*0.14, baseY - s*0.78, s*0.06, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s*0.14, baseY - s*0.78, s*0.06, 0, Math.PI*2);
  ctx.fill();

  // Eyes (happy squint)
  ctx.strokeStyle = '#2A1A0A';
  ctx.lineWidth   = s*0.03;
  ctx.lineCap     = 'round';
  [[-0.09], [0.09]].forEach(([dx]) => {
    ctx.beginPath();
    ctx.arc(cx + dx * s, baseY - s*0.80, s*0.05, Math.PI*0.15, Math.PI*0.85);
    ctx.stroke();
  });

  // Big smile
  ctx.beginPath();
  ctx.arc(cx, baseY - s*0.72, s*0.10, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // Arms — holding bread basket
  ctx.fillStyle = ART.benny.skin;
  ctx.beginPath();
  ctx.roundRect(cx - s*0.32, baseY - s*0.56, s*0.16, s*0.10, 4);
  ctx.fill();
  // Bread loaf in arm
  ctx.fillStyle = '#D4A060';
  ctx.beginPath();
  ctx.ellipse(cx - s*0.35, baseY - s*0.60, s*0.12, s*0.07, -0.3, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#A07040';
  ctx.lineWidth   = 0.8;
  ctx.stroke();
  ctx.restore();
}

function drawMara(ctx, cx, baseY, size) {
  ctx.save();
  const s = size;
  // Shadow
  ctx.fillStyle = ART.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, s*0.28, s*0.08, 0, 0, Math.PI*2);
  ctx.fill();

  // Robe (tall flowing)
  const robeGrad = ctx.createLinearGradient(cx, baseY - s, cx + s*0.1, baseY);
  robeGrad.addColorStop(0, '#9C27B0');
  robeGrad.addColorStop(1, '#6A1B9A');
  ctx.fillStyle = robeGrad;
  ctx.beginPath();
  ctx.moveTo(cx - s*0.20, baseY - s*0.80);
  ctx.quadraticCurveTo(cx - s*0.28, baseY - s*0.40, cx - s*0.22, baseY);
  ctx.lineTo(cx + s*0.22, baseY);
  ctx.quadraticCurveTo(cx + s*0.28, baseY - s*0.40, cx + s*0.20, baseY - s*0.80);
  ctx.closePath();
  ctx.fill();

  // Collar / trim
  ctx.fillStyle = '#CE93D8';
  ctx.beginPath();
  ctx.roundRect(cx - s*0.15, baseY - s*0.80, s*0.30, s*0.10, 4);
  ctx.fill();

  // Book held
  ctx.fillStyle = '#1565C0';
  ctx.save();
  ctx.translate(cx + s*0.22, baseY - s*0.48);
  ctx.rotate(0.2);
  ctx.beginPath();
  ctx.roundRect(-s*0.06, -s*0.14, s*0.12, s*0.20, 2);
  ctx.fill();
  ctx.fillStyle = '#FFFDE7';
  ctx.beginPath();
  ctx.roundRect(-s*0.04, -s*0.12, s*0.08, s*0.16, 1);
  ctx.fill();
  ctx.restore();

  // Head
  const hg = ctx.createRadialGradient(cx - s*0.04, baseY - s*0.92, 0, cx, baseY - s*0.86, s*0.20);
  hg.addColorStop(0, '#F5DEB3');
  hg.addColorStop(1, ART.mara.skin);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(cx, baseY - s*0.88, s*0.20, 0, Math.PI*2);
  ctx.fill();

  // White hair bun
  ctx.fillStyle = '#E8E8E8';
  ctx.beginPath();
  ctx.arc(cx, baseY - s*1.00, s*0.18, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, baseY - s*1.01, s*0.11, 0, Math.PI*2);
  ctx.fill();

  // Glasses
  ctx.strokeStyle = ART.mara.glasses;
  ctx.lineWidth   = s*0.025;
  ctx.beginPath();
  ctx.arc(cx - s*0.08, baseY - s*0.88, s*0.055, 0, Math.PI*2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + s*0.08, baseY - s*0.88, s*0.055, 0, Math.PI*2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s*0.025, baseY - s*0.88);
  ctx.lineTo(cx + s*0.025, baseY - s*0.88);
  ctx.stroke();

  // Kind eyes (behind glasses)
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.arc(cx - s*0.08, baseY - s*0.88, s*0.03, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s*0.08, baseY - s*0.88, s*0.03, 0, Math.PI*2);
  ctx.fill();

  // Warm smile
  ctx.strokeStyle = '#5A2A1A';
  ctx.lineWidth   = s*0.022;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.arc(cx, baseY - s*0.80, s*0.07, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();
}

function drawGus(ctx, cx, baseY, size) {
  ctx.save();
  const s = size;
  // Shadow
  ctx.fillStyle = ART.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, s*0.30, s*0.08, 0, 0, Math.PI*2);
  ctx.fill();

  // Cloak / cape
  ctx.fillStyle = ART.gus.cloak;
  ctx.beginPath();
  ctx.moveTo(cx - s*0.22, baseY - s*0.85);
  ctx.quadraticCurveTo(cx - s*0.35, baseY - s*0.40, cx - s*0.28, baseY);
  ctx.lineTo(cx + s*0.28, baseY);
  ctx.quadraticCurveTo(cx + s*0.35, baseY - s*0.40, cx + s*0.22, baseY - s*0.85);
  ctx.closePath();
  ctx.fill();

  // Armour body plate
  const armGrad = ctx.createLinearGradient(cx - s*0.18, 0, cx + s*0.18, 0);
  armGrad.addColorStop(0, '#78909C');
  armGrad.addColorStop(0.5, '#B0BEC5');
  armGrad.addColorStop(1, '#546E7A');
  ctx.fillStyle = armGrad;
  ctx.beginPath();
  ctx.roundRect(cx - s*0.18, baseY - s*0.75, s*0.36, s*0.45, 6);
  ctx.fill();
  // Armour details
  ctx.strokeStyle = '#37474F';
  ctx.lineWidth   = s*0.02;
  ctx.beginPath();
  ctx.moveTo(cx, baseY - s*0.75);
  ctx.lineTo(cx, baseY - s*0.32);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s*0.18, baseY - s*0.56);
  ctx.lineTo(cx + s*0.18, baseY - s*0.56);
  ctx.stroke();

  // Belt buckle
  ctx.fillStyle = ART.gold;
  ctx.beginPath();
  ctx.roundRect(cx - s*0.06, baseY - s*0.34, s*0.12, s*0.08, 2);
  ctx.fill();

  // Spear / staff
  ctx.strokeStyle = ART.wood;
  ctx.lineWidth   = s*0.04;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + s*0.28, baseY - s*1.10);
  ctx.lineTo(cx + s*0.28, baseY + s*0.05);
  ctx.stroke();
  // Spear tip
  ctx.fillStyle = '#B0BEC5';
  ctx.beginPath();
  ctx.moveTo(cx + s*0.28, baseY - s*1.10);
  ctx.lineTo(cx + s*0.20, baseY - s*0.90);
  ctx.lineTo(cx + s*0.36, baseY - s*0.90);
  ctx.closePath();
  ctx.fill();

  // Head
  const hg = ctx.createRadialGradient(cx - s*0.04, baseY - s*0.93, 0, cx, baseY - s*0.87, s*0.20);
  hg.addColorStop(0, '#FDEBC8');
  hg.addColorStop(1, ART.gus.skin);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(cx, baseY - s*0.88, s*0.20, 0, Math.PI*2);
  ctx.fill();

  // Helmet
  const helmGrad = ctx.createLinearGradient(cx - s*0.22, baseY - s*1.08, cx + s*0.05, baseY - s*0.88);
  helmGrad.addColorStop(0, '#546E7A');
  helmGrad.addColorStop(0.5, '#90A4AE');
  helmGrad.addColorStop(1, '#37474F');
  ctx.fillStyle = helmGrad;
  ctx.beginPath();
  ctx.arc(cx, baseY - s*0.92, s*0.24, Math.PI, 0);
  ctx.fill();
  // Helmet brim
  ctx.fillStyle = '#455A64';
  ctx.beginPath();
  ctx.roundRect(cx - s*0.26, baseY - s*0.93, s*0.52, s*0.06, 2);
  ctx.fill();
  // Plume
  ctx.strokeStyle = '#E53935';
  ctx.lineWidth   = s*0.045;
  ctx.lineCap     = 'round';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * s*0.05, baseY - s*1.08);
    ctx.quadraticCurveTo(
      cx + i*s*0.12 + Math.sin(i*0.8)*s*0.08,
      baseY - s*1.22,
      cx + i*s*0.08,
      baseY - s*1.28
    );
    ctx.stroke();
  }

  // Bushy eyebrows
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth   = s*0.03;
  ctx.lineCap     = 'round';
  [[-0.09,-0.88],[0.09,-0.88]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + (dx - 0.05)*s, (baseY + (dy + 0.025)*s));
    ctx.lineTo(cx + (dx + 0.05)*s, (baseY + (dy - 0.010)*s));
    ctx.stroke();
  });

  // Eyes (slightly concerned / forgetful)
  ctx.fillStyle = '#2A1A0A';
  ctx.beginPath();
  ctx.arc(cx - s*0.08, baseY - s*0.88, s*0.035, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s*0.08, baseY - s*0.88, s*0.035, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(cx - s*0.07, baseY - s*0.895, s*0.012, 0, Math.PI*2);
  ctx.fill();

  // Friendly smile
  ctx.strokeStyle = '#5A2A1A';
  ctx.lineWidth   = s*0.025;
  ctx.beginPath();
  ctx.arc(cx, baseY - s*0.79, s*0.09, 0.15, Math.PI - 0.15);
  ctx.stroke();
  ctx.restore();
}

