// Every picture in the game is drawn here, in code, from simple shapes — the turkey,
// the farmer, the oven, the carving knife, the farm and the kitchen. Nothing is loaded
// from a file, so the game has no assets to fetch and no art to copy.
import { PALETTE as P } from './config.js';

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

// The hero: a plump brown turkey mid-stride, tail fanned, wattle wobbling. Faces right.
// `run` is the run-cycle phase (0..1), `hidden` ducks him low, `scared` widens the eye.
export function drawTurkey(ctx, x, y, scale, run, hidden, scared) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const bob = Math.sin(run * Math.PI * 2) * 2;
  const legSwing = Math.sin(run * Math.PI * 2) * 7;

  // Fanned tail feathers behind the body.
  ctx.fillStyle = P.feather;
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.translate(-16, -8 + bob * 0.4);
    ctx.rotate(i * 0.32 - 0.5);
    ellipse(ctx, 0, -16, 5, 15);
    ctx.fillStyle = i === 0 ? P.gold : P.feather;
    ellipse(ctx, 0, -26, 2.5, 5);
    ctx.restore();
  }

  // Legs, scissoring with the run.
  ctx.strokeStyle = P.beak;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, 8);
  ctx.lineTo(-4 + legSwing, 22);
  ctx.moveTo(6, 8);
  ctx.lineTo(6 - legSwing, 22);
  ctx.stroke();
  ctx.fillStyle = P.beak;
  ellipse(ctx, -4 + legSwing, 23, 5, 2);
  ellipse(ctx, 6 - legSwing, 23, 5, 2);

  // Body and belly.
  ctx.fillStyle = P.turkeyBody;
  ellipse(ctx, 0, 0, 20, 16);
  ctx.fillStyle = P.turkeyBelly;
  ellipse(ctx, 4, 5, 13, 10);

  // Wing, tucked but flapping a little when running.
  ctx.fillStyle = P.feather;
  ctx.save();
  ctx.translate(-2, -2);
  ctx.rotate(Math.sin(run * Math.PI * 2) * 0.25 - 0.2);
  ellipse(ctx, -4, 0, 10, 7);
  ctx.restore();

  // Neck and head.
  const headY = hidden ? -14 : -22 + bob * 0.5;
  ctx.strokeStyle = P.turkeyBody;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(10, -10);
  ctx.quadraticCurveTo(18, -16, 16, headY + 4);
  ctx.stroke();
  ctx.fillStyle = P.turkeyBody;
  circle(ctx, 16, headY, 8);
  // Wattle, red and wobbling.
  ctx.fillStyle = P.wattle;
  ellipse(ctx, 21, headY + 5, 2.5, 5 + Math.sin(run * Math.PI * 4) * 1.2);
  // Beak.
  ctx.fillStyle = P.beak;
  ctx.beginPath();
  ctx.moveTo(22, headY - 2);
  ctx.lineTo(32, headY + 1);
  ctx.lineTo(22, headY + 4);
  ctx.closePath();
  ctx.fill();
  // Eye: wide when scared.
  ctx.fillStyle = '#fff';
  circle(ctx, 18, headY - 3, scared ? 3.4 : 2.6);
  ctx.fillStyle = '#1a1a1a';
  circle(ctx, 19, headY - 3, scared ? 1.8 : 1.4);

  ctx.restore();
}

// The farmer: overalls, straw hat, pitchfork in hand, always a step behind. Faces right.
// `stride` drives his legs; `searching` makes him stop and scratch his head.
export function drawFarmer(ctx, x, y, scale, stride, searching) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const swing = searching ? 0 : Math.sin(stride * Math.PI * 2) * 8;

  // Legs in blue overalls.
  ctx.strokeStyle = P.farmerShirt;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -6);
  ctx.lineTo(-4 + swing, 24);
  ctx.moveTo(5, -6);
  ctx.lineTo(5 - swing, 24);
  ctx.stroke();
  ctx.fillStyle = '#3a2c1c';
  ellipse(ctx, -4 + swing, 25, 6, 2.5);
  ellipse(ctx, 5 - swing, 25, 6, 2.5);

  // Body: checked shirt and overall straps.
  ctx.fillStyle = P.farmerShirt;
  roundRect(ctx, -13, -30, 26, 26, 7);
  ctx.fillStyle = '#2f4a6b';
  ctx.fillRect(-13, -14, 26, 4);
  ctx.fillStyle = '#d94f3d';
  ctx.fillRect(-8, -30, 4, 12);
  ctx.fillRect(4, -30, 4, 12);

  // Head with a straw hat and a moustache.
  ctx.fillStyle = P.farmerSkin;
  circle(ctx, 2, -40, 10);
  ctx.fillStyle = P.farmerHat;
  ellipse(ctx, 2, -47, 14, 4);
  ctx.fillStyle = '#a8873f';
  ellipse(ctx, 2, -50, 8, 4);
  ctx.fillStyle = '#5d3a1a';
  ctx.beginPath();
  ctx.moveTo(-2, -36);
  ctx.quadraticCurveTo(4, -32, 10, -36);
  ctx.quadraticCurveTo(4, -33, -2, -36);
  ctx.fill();
  // Eyes: narrowed, scanning for a turkey.
  ctx.fillStyle = '#1a1a1a';
  circle(ctx, 0, -42, 1.5);
  circle(ctx, 7, -42, 1.5);
  if (searching) {
    // Scratching his head: one arm raised.
    ctx.strokeStyle = P.farmerSkin;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(12, -22);
    ctx.lineTo(18, -40);
    ctx.stroke();
  }

  // Pitchfork in the trailing hand.
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-14, -24);
  ctx.lineTo(-20, 12);
  ctx.stroke();
  ctx.strokeStyle = P.steel;
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-20 + i * 3, 12);
    ctx.lineTo(-20 + i * 3, 2);
    ctx.stroke();
  }

  ctx.restore();
}

// The oven: a squat black range with a glowing door, heat shimmer and a pie on top.
export function drawOven(ctx, x, y, w, h, time) {
  ctx.fillStyle = P.oven;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = '#2b2b38';
  roundRect(ctx, x + 6, y + 8, w - 12, h * 0.45, 4);
  // Glowing door: the fire inside breathes.
  const glow = 0.55 + Math.sin(time * 5) * 0.2;
  ctx.fillStyle = `rgba(255, ${Math.floor(120 + 60 * glow)}, 30, ${glow})`;
  roundRect(ctx, x + 12, y + 14, w - 24, h * 0.45 - 12, 4);
  ctx.fillStyle = '#1c1c26';
  ctx.fillRect(x + 12, y + 14 + (h * 0.45 - 12) / 2 - 2, w - 24, 4);
  // Control knobs and a pie cooling on top.
  ctx.fillStyle = P.steel;
  for (let i = 0; i < 3; i += 1) circle(ctx, x + 18 + i * 16, y + h - 12, 3);
  ctx.fillStyle = '#c98f2e';
  ellipse(ctx, x + w / 2, y - 4, 22, 7);
  ctx.fillStyle = '#8a5a2b';
  ellipse(ctx, x + w / 2, y - 6, 16, 4);
}

// The carving knife: a long steel blade that drops from the sky and sticks in the dirt.
export function drawKnife(ctx, x, y, angle, stuck) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = P.steel;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(7, -6);
  ctx.lineTo(7, 6);
  ctx.lineTo(-7, 6);
  ctx.lineTo(-7, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#aab4bd';
  ctx.beginPath();
  ctx.moveTo(-7, -6);
  ctx.lineTo(0, -34);
  ctx.lineTo(7, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a2415';
  roundRect(ctx, -5, 6, 10, 16, 3);
  if (stuck) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ellipse(ctx, 0, 24, 12, 3);
  }
  ctx.restore();
}

// A wooden fence panel the turkey must hop.
export function drawFence(ctx, x, y, w, h) {
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(x, y + 6, w, 5);
  ctx.fillRect(x, y + h - 12, w, 5);
  ctx.fillStyle = '#8a6136';
  for (let i = 0; i < 3; i += 1) {
    const px = x + 4 + i * ((w - 8) / 2);
    ctx.fillRect(px, y, 6, h);
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px + 3, y - 5);
    ctx.lineTo(px + 6, y);
    ctx.closePath();
    ctx.fill();
  }
}

// A round hay bale, and the tall haystack a turkey can hide inside.
export function drawHaybale(ctx, x, y, w, h) {
  ctx.fillStyle = P.hay;
  ellipse(ctx, x + w / 2, y + h / 2, w / 2, h / 2);
  ctx.strokeStyle = '#b98a2e';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, (w / 2) * (0.4 + Math.abs(i) * 0.18), 0.3 + i * 0.25, Math.PI * 1.1 + i * 0.25, Math.PI * 1.9 + i * 0.25);
    ctx.stroke();
  }
}

export function drawHaystack(ctx, x, y, w, h) {
  ctx.fillStyle = '#d9a83e';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w / 2, y - h * 0.7, x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b98a2e';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    ctx.beginPath();
    ctx.moveTo(x + w * t, y + h * 0.15 + Math.abs(t - 0.5) * h * 0.4);
    ctx.lineTo(x + w * t, y + h);
    ctx.stroke();
  }
  // A little "HIDE HERE" arrow the player learns to love.
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HIDE ↓', x + w / 2, y - 6);
}

// A corn cob, golden and worth 25 points.
export function drawCorn(ctx, x, y, time) {
  const bob = Math.sin(time * 4 + x * 0.01) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(Math.sin(time * 2 + x) * 0.15);
  ctx.fillStyle = P.corn;
  ellipse(ctx, 0, 0, 8, 13);
  ctx.fillStyle = '#e8a91c';
  for (let i = -1; i <= 1; i += 1) {
    ctx.fillRect(i * 5 - 1, -10, 2, 20);
  }
  ctx.fillStyle = P.leafGreen;
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.lineTo(-10, 18);
  ctx.lineTo(-2, 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6, 8);
  ctx.lineTo(10, 18);
  ctx.lineTo(2, 14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// A gravy puddle: slick, brown, and it slows the turkey down.
export function drawPuddle(ctx, x, y, w, time) {
  ctx.fillStyle = 'rgba(122, 74, 30, 0.85)';
  ellipse(ctx, x + w / 2, y + 4, w / 2, 7);
  ctx.fillStyle = 'rgba(255, 220, 150, 0.35)';
  ellipse(ctx, x + w / 2 - 8 + Math.sin(time * 2) * 4, y + 2, w / 5, 2.5);
}

// A pumpkin with a carved grin, scattered around the farmyard.
export function drawPumpkin(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = P.orange;
  ellipse(ctx, 0, 0, 16, 13);
  ctx.fillStyle = '#d35400';
  ellipse(ctx, -7, 0, 5, 12);
  ellipse(ctx, 7, 0, 5, 12);
  ctx.fillStyle = '#5d8a2a';
  ctx.fillRect(-2, -15, 4, 6);
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(-8, -4);
  ctx.lineTo(-4, -4);
  ctx.lineTo(-6, -1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, -4);
  ctx.lineTo(4, -4);
  ctx.lineTo(6, -1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, 4);
  ctx.lineTo(-2, 7);
  ctx.lineTo(2, 4);
  ctx.lineTo(6, 7);
  ctx.lineTo(8, 4);
  ctx.lineTo(0, 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// A bare autumn tree with drifting leaves.
export function drawTree(ctx, x, y, scale, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#5d3a1a';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -60);
  ctx.moveTo(0, -40);
  ctx.lineTo(-22, -70);
  ctx.moveTo(0, -50);
  ctx.lineTo(20, -78);
  ctx.moveTo(0, -60);
  ctx.lineTo(-6, -88);
  ctx.stroke();
  ctx.fillStyle = '#c0392b';
  for (let i = 0; i < 5; i += 1) {
    const lx = Math.sin(time * 0.7 + i * 2.1) * 12 + (i - 2) * 10;
    const ly = -30 - ((i * 17 + Math.floor(time * 20 + i * 13) % 40) % 60);
    ellipse(ctx, lx, ly, 3, 2);
  }
  ctx.restore();
}

// The kitchen window at the end of the run: the way out.
export function drawWindow(ctx, x, y, w, h, time) {
  ctx.fillStyle = '#2b1c12';
  roundRect(ctx, x - 6, y - 6, w + 12, h + 12, 6);
  const glow = 0.7 + Math.sin(time * 2) * 0.15;
  ctx.fillStyle = `rgba(255, 214, 120, ${glow})`;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#7a9b3a';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w * 0.4, y + h * 0.4);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2b1c12';
  ctx.fillRect(x + w / 2 - 2, y, 4, h);
  ctx.fillRect(x, y + h / 2 - 2, w, 4);
}
