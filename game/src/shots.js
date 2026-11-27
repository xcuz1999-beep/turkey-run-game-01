// The screenshot scenes behind ?shot=title|play|caught|escaped. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a simple
// autopilot (jump when a hazard is close ahead, hide when the farmer closes in near
// a haystack), so every frame is what a short game really looks like and the same
// seed always gives the same frame.
import { STEP, stageFor } from './config.js';
import { EVENT_OVER, stepWorld } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const TITLE_SECONDS = 4;
const PLAY_SECONDS = 36;
const LIMIT_SECONDS = 900;
const LATERAL_SPEED = 240;
// Jump when the hazard is this many seconds from impact: late enough that the
// turkey is still high while the hazard passes underneath, early enough to clear
// its full width (a jump stays above a fence for ~0.7 s; the widest hazard, the
// oven, needs ~0.44 s of that at farmyard speed).
const JUMP_TRIGGER_SECONDS = 0.27;

// The autopilot's jump decision: a hazard close ahead on the ground, or a knife
// about to land on the turkey's head.
function shouldJump(world, movingRight, movingLeft) {
  const player = world.player;
  if (!player.grounded || player.hidden) return false;
  const stage = stageFor(world.distance);
  const scroll = player.slowTimer > 0 ? stage.speed * 0.55 : stage.speed;
  const closing = scroll + (movingRight ? LATERAL_SPEED : movingLeft ? -LATERAL_SPEED : 0);
  for (const obstacle of world.obstacles) {
    if (obstacle.kind === 'puddle' || obstacle.kind === 'corn') continue;
    if (obstacle.kind === 'knife' && obstacle.falling) continue;
    const gap = obstacle.x - (player.x + player.w);
    if (gap <= -10) continue;
    if (gap < 0) return true;
    const timeToImpact = gap / Math.max(60, closing);
    if (timeToImpact < JUMP_TRIGGER_SECONDS) return true;
  }
  return false;
}

function shouldHide(world) {
  const player = world.player;
  if (!player.grounded) return false;
  // Never hide into an incoming hazard: a fence arriving while tucked in the
  // hay is a stumble the turkey could have jumped.
  for (const obstacle of world.obstacles) {
    if (obstacle.kind === 'puddle') continue;
    const gap = obstacle.x - (player.x + player.w);
    if (gap > -10 && gap < 220) return false;
  }
  const nearHaystack = world.haystacks.some((stack) => Math.abs((stack.x + stack.w / 2) - (player.x + player.w / 2)) < 60);
  const farmerClose = world.lead < 260;
  return nearHaystack && (farmerClose || world.spotted > 50);
}

function autopilot(world) {
  const player = world.player;
  // Hold the middle of the roaming band: the chase is a lead, not a screen race,
  // so the turkey's job is to stay where it has room to jump either way. It stands
  // still inside the band — running right compresses the gaps between obstacles
  // until two of them arrive inside a single jump.
  let left = player.x > 420;
  let right = player.x < 280;
  // A falling knife is dodged sideways, not jumped: step clear of where it lands.
  for (const obstacle of world.obstacles) {
    if (obstacle.kind === 'knife' && obstacle.falling) {
      const knifeCentre = obstacle.x + obstacle.w / 2;
      const turkeyCentre = player.x + player.w / 2;
      if (Math.abs(knifeCentre - turkeyCentre) < 90) {
        if (knifeCentre > turkeyCentre) { left = true; right = false; }
        else { right = true; left = false; }
      }
    }
  }
  return {
    left,
    right,
    jump: shouldJump(world, right, left),
    hide: shouldHide(world),
  };
}

function idleInput() {
  return { left: false, right: false, jump: false, hide: false };
}

// Set `world` to the named scene and return the screen to draw over it and the best
// score to show. Unknown names stage the title.
export function stageShot(name, world) {
  if (name !== 'play' && name !== 'caught' && name !== 'escaped') {
    for (let index = 0; index < TITLE_SECONDS / STEP; index += 1) {
      stepWorld(world, STEP, idleInput());
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'escaped') {
    // Skip to the last stretch of the kitchen, then let the pilot finish the escape.
    world.distance = 1140;
    world.score = 1140 * 1 + 500 * 2;
  }

  const limit = name === 'caught' ? LIMIT_SECONDS : PLAY_SECONDS;
  const pilot = name === 'caught' ? idleInput : autopilot;
  for (let index = 0; index < limit / STEP; index += 1) {
    const events = stepWorld(world, STEP, typeof pilot === 'function' ? pilot(world) : pilot);
    if (events & EVENT_OVER || world.over) break;
  }
  const over = world.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: Math.floor(world.score) };
}
