// Everything the player sees: the scrolling autumn scenery for each stage, the turkey
// and the farmer, the hazards, the HUD (score, distance, lives, stage, spotted meter)
// and the title, pause and end screens. It only draws — the rules live in world.js.
import { GROUND_Y, PALETTE as P, VIEW, stageFor } from './config.js';
import { progress } from './world.js';
import {
  drawCorn, drawFarmer, drawFence, drawHaybale, drawHaystack, drawKnife, drawOven,
  drawPuddle, drawPumpkin, drawTree, drawTurkey, drawWindow,
} from './art.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function drawSky(ctx, world) {
  const stage = stageFor(world.distance);
  const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  gradient.addColorStop(0, stage.sky[0]);
  gradient.addColorStop(1, stage.sky[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, GROUND_Y);

  // A low autumn sun and a few lazy clouds.
  ctx.fillStyle = 'rgba(255, 236, 180, 0.9)';
  ctx.beginPath();
  ctx.arc(820, 84, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 243, 214, 0.75)';
  const cloudX = (world.time * 8) % 1100;
  for (const [cx, cy, scale] of [[cloudX - 100, 70, 1], [cloudX + 320, 110, 0.7], [cloudX + 640, 60, 0.85]]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 46 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 26 * scale, cy + 4, 30 * scale, 11 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(ctx, world) {
  const stage = stageFor(world.distance);
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, GROUND_Y, VIEW.width, 10);
  // Dirt speckles scrolling past.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  const offset = (world.distance * 28) % 48;
  for (let x = -offset; x < VIEW.width; x += 48) {
    ctx.fillRect(x, GROUND_Y + 26, 14, 4);
    ctx.fillRect(x + 24, GROUND_Y + 56, 10, 3);
  }
}

function drawScenery(ctx, world) {
  const stage = stageFor(world.distance);
  for (const item of world.scenery) {
    const x = item.x;
    if (x < -100 || x > VIEW.width + 100) continue;
    if (item.kind === 'tree') drawTree(ctx, x, GROUND_Y, item.scale, world.time);
    else if (item.kind === 'pumpkin') drawPumpkin(ctx, x, GROUND_Y + 76, item.scale);
    else {
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(x, GROUND_Y - 26, 6, 26);
    }
  }
  if (stage.id === 'barn') {
    // The barn wall looms behind the run.
    ctx.fillStyle = 'rgba(122, 60, 30, 0.55)';
    ctx.fillRect(0, 120, VIEW.width, GROUND_Y - 120);
    ctx.fillStyle = 'rgba(90, 42, 20, 0.6)';
    for (let x = 0; x < VIEW.width; x += 64) ctx.fillRect(x, 120, 4, GROUND_Y - 120);
    ctx.fillStyle = 'rgba(60, 30, 16, 0.8)';
    ctx.beginPath();
    ctx.moveTo(420, GROUND_Y);
    ctx.lineTo(480, 300);
    ctx.lineTo(540, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
  if (stage.id === 'kitchen') {
    // The kitchen wall, tiled, with the escape window glowing at the far right.
    ctx.fillStyle = 'rgba(70, 44, 28, 0.85)';
    ctx.fillRect(0, 60, VIEW.width, GROUND_Y - 60);
    ctx.strokeStyle = 'rgba(255, 220, 160, 0.12)';
    ctx.lineWidth = 1;
    for (let y = 60; y < GROUND_Y; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW.width, y);
      ctx.stroke();
    }
    drawWindow(ctx, 880, 150, 60, 80, world.time);
  }
}

function drawEntities(ctx, world) {
  for (const stack of world.haystacks) {
    drawHaystack(ctx, stack.x, GROUND_Y - stack.h, stack.w, stack.h);
  }
  for (const corn of world.corns) {
    if (!corn.taken) drawCorn(ctx, corn.x, corn.y, world.time);
  }
  for (const obstacle of world.obstacles) {
    if (obstacle.kind === 'fence') drawFence(ctx, obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    else if (obstacle.kind === 'haybale') drawHaybale(ctx, obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    else if (obstacle.kind === 'puddle') drawPuddle(ctx, obstacle.x, obstacle.y, obstacle.w, world.time);
    else if (obstacle.kind === 'oven') drawOven(ctx, obstacle.x, obstacle.y, obstacle.w, obstacle.h, world.time);
    else if (obstacle.kind === 'knife') {
      drawKnife(ctx, obstacle.x + obstacle.w / 2, obstacle.y + 26, obstacle.falling ? 0.12 : 0, !obstacle.falling);
      if (obstacle.falling) {
        ctx.fillStyle = 'rgba(192, 57, 43, 0.85)';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', obstacle.x + obstacle.w / 2, obstacle.y - 8);
      }
    }
  }

  const player = world.player;
  const scared = world.spotted > 60 || world.farmer.x > player.x - 160;
  // The hidden turkey peeks out of the haystack.
  const turkeyY = player.hidden ? GROUND_Y - player.h + 26 : player.y;
  const blink = player.invulnerable > 0 && Math.floor(world.time * 12) % 2 === 0;
  if (!blink) {
    drawTurkey(ctx, player.x + player.w / 2, turkeyY + player.h - 6, 1, player.runPhase, player.hidden, scared);
  }
  if (player.hidden) {
    drawHaystack(ctx, player.x - 8, GROUND_Y - 74, 74, 74);
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('shhh…', player.x + player.w / 2, GROUND_Y - 84);
  }

  const farmer = world.farmer;
  if (farmer.x > -70) {
    drawFarmer(ctx, farmer.x + farmer.w / 2, GROUND_Y + 6, 1, farmer.stride, farmer.searching);
  }
}

function heart(ctx, x, y, filled) {
  ctx.fillStyle = filled ? P.red : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(x, y + 5);
  ctx.bezierCurveTo(x - 9, y - 3, x - 4, y - 9, x, y - 3);
  ctx.bezierCurveTo(x + 4, y - 9, x + 9, y - 3, x, y + 5);
  ctx.fill();
}

function drawHud(ctx, world) {
  ctx.fillStyle = 'rgba(58, 36, 21, 0.72)';
  ctx.beginPath();
  ctx.roundRect(10, 10, 330, 74, 10);
  ctx.fill();
  ctx.fillStyle = P.cream;
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`SCORE ${Math.floor(world.score)}`, 22, 36);
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`DISTANCE ${Math.floor(world.distance)} m / 1200 m`, 22, 60);
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = P.gold;
  ctx.fillText(stageFor(world.distance).name, 22, 78);
  for (let i = 0; i < 3; i += 1) heart(ctx, 300 + i * 24, 30, i < world.lives);

  // Escape progress bar across the top.
  ctx.fillStyle = 'rgba(58, 36, 21, 0.72)';
  ctx.beginPath();
  ctx.roundRect(360, 14, 380, 22, 8);
  ctx.fill();
  ctx.fillStyle = P.gold;
  ctx.beginPath();
  ctx.roundRect(364, 18, 372 * progress(world), 14, 6);
  ctx.fill();
  ctx.fillStyle = P.cream;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ESCAPE', 550, 30);

  // Spotted meter: the farmer's suspicion, right where you can see it.
  ctx.fillStyle = 'rgba(58, 36, 21, 0.72)';
  ctx.beginPath();
  ctx.roundRect(760, 10, 190, 40, 10);
  ctx.fill();
  ctx.fillStyle = world.spotted > 60 ? P.red : P.cream;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SPOTTED', 772, 27);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(772, 32, 166, 8);
  ctx.fillStyle = world.spotted > 60 ? '#ff5a3c' : P.gold;
  ctx.fillRect(772, 32, 166 * (world.spotted / 100), 8);

  if (world.messageTimer > 0) {
    ctx.fillStyle = 'rgba(58, 36, 21, 0.85)';
    const width = ctx.measureText(world.message).width + 36;
    ctx.beginPath();
    ctx.roundRect((VIEW.width - width) / 2, 100, width, 36, 10);
    ctx.fill();
    ctx.fillStyle = P.cream;
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.message, VIEW.width / 2, 124);
  }
}

function button(ctx, x, y, w, h, label) {
  ctx.fillStyle = P.orange;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.roundRect(x, y + h - 8, w, 8, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 8);
  return { x, y, w, h };
}

export function titleButtons() {
  return { start: { x: 380, y: 400, w: 200, h: 56 } };
}

export function overButtons() {
  return { restart: { x: 380, y: 420, w: 200, h: 56 } };
}

function drawTitle(ctx, world, best) {
  drawSky(ctx, world);
  drawGround(ctx, world);
  drawScenery(ctx, world);
  // The hero turkey, big, front and centre, with the farmer sneaking in behind.
  drawTurkey(ctx, 300, 330, 2.4, 0.2, false, false);
  drawFarmer(ctx, 780, GROUND_Y + 6, 1.4, 0.4, false);
  drawPumpkin(ctx, 120, GROUND_Y + 76, 1.2);
  drawPumpkin(ctx, 880, GROUND_Y + 76, 0.9);

  ctx.fillStyle = 'rgba(58, 36, 21, 0.55)';
  ctx.beginPath();
  ctx.roundRect(180, 36, 600, 150, 18);
  ctx.fill();
  ctx.fillStyle = P.gold;
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GOBBLE DASH', VIEW.width / 2, 104);
  ctx.fillStyle = P.cream;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('The Great Turkey Escape', VIEW.width / 2, 142);
  ctx.font = '16px sans-serif';
  ctx.fillText('Thanksgiving is coming. The farmer is coming faster. RUN.', VIEW.width / 2, 170);

  button(ctx, 380, 400, 200, 56, '▶  START');
  ctx.fillStyle = P.cream;
  ctx.font = '15px sans-serif';
  ctx.fillText('← → move   •   SPACE / ↑ jump   •   ↓ hide in haystacks', VIEW.width / 2, 486);
  ctx.fillText('Mouse: click START, or click the game to jump   •   P pause   •   M mute', VIEW.width / 2, 508);
  if (best > 0) {
    ctx.fillStyle = P.gold;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`Best score this session: ${Math.floor(best)}`, VIEW.width / 2, 376);
  }
}

function drawOver(ctx, world, best) {
  drawSky(ctx, world);
  drawGround(ctx, world);
  drawScenery(ctx, world);
  drawEntities(ctx, world);

  ctx.fillStyle = 'rgba(30, 16, 8, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  const escaped = world.escaped;
  ctx.fillStyle = escaped ? P.gold : P.red;
  ctx.font = 'bold 58px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', VIEW.width / 2, 150);
  ctx.fillStyle = P.cream;
  ctx.font = '22px sans-serif';
  ctx.fillText(
    escaped
      ? 'Out the kitchen window and into the woods — free for another year!'
      : 'The farmer got you… but every turkey deserves a rematch.',
    VIEW.width / 2, 192,
  );
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`Score ${Math.floor(world.score)}    •    Distance ${Math.floor(world.distance)} m`, VIEW.width / 2, 250);
  ctx.font = '18px sans-serif';
  ctx.fillText(`Lives left: ${world.lives}    •    Best this session: ${Math.floor(best)}`, VIEW.width / 2, 282);
  ctx.fillText(escaped ? 'You dodged the oven, the knife and the farmer. Gobble on!' : 'Tip: hide in haystacks when the SPOTTED meter climbs.', VIEW.width / 2, 312);

  button(ctx, 380, 420, 200, 56, '↻  PLAY AGAIN');
  ctx.fillStyle = P.cream;
  ctx.font = '15px sans-serif';
  ctx.fillText('Press R or click PLAY AGAIN to run again', VIEW.width / 2, 506);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(30, 16, 8, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = P.cream;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', VIEW.width / 2, 250);
  ctx.font = '18px sans-serif';
  ctx.fillText('Press P to keep running', VIEW.width / 2, 286);
}

// One call draws the whole frame for the given screen.
export function render(ctx, world, screen, best) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (screen === SCREEN_TITLE) {
    drawTitle(ctx, world, best);
    return;
  }
  if (screen === SCREEN_OVER) {
    drawOver(ctx, world, best);
    return;
  }
  drawSky(ctx, world);
  drawGround(ctx, world);
  drawScenery(ctx, world);
  drawEntities(ctx, world);
  drawHud(ctx, world);
  if (world.paused) drawPaused(ctx);
}
