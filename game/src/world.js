// The game rules: the turkey's run, the farmer's chase, the hazards that spawn ahead,
// the three stages from farmyard to kitchen, and what happens when the turkey is
// caught, hides, eats corn or finally escapes. Pure logic — no drawing, no sound.
import {
  ESCAPE_DISTANCE, FARMER, GRAVITY, GROUND_Y, JUMP_SPEED, LIVES, PIXELS_PER_METRE,
  PLAYER_MAX_X, PLAYER_MIN_X, SCORE, SPAWNS, SPOTTED_FALL, SPOTTED_MAX, SPOTTED_RANGE,
  SPOTTED_RISE, HIDE_FALL, stageFor, stageIndexFor,
} from './config.js';
import { chance, makeRng, pick, range } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_CORN = 1;
export const EVENT_STUMBLE = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_ESCAPED = 8;
export const EVENT_STAGE = 16;
export const EVENT_SPOTTED = 32;
export const EVENT_HIDE = 64;
export const EVENT_LIFE_LOST = 128;
export const EVENT_OVER = 256;

const PLAYER_W = 46;
const PLAYER_H = 44;

export function createWorld(seed) {
  const world = {
    seed,
    rng: makeRng(seed),
    time: 0,
    distance: 0,
    score: 0,
    lives: LIVES,
    stageIndex: 0,
    over: false,
    escaped: false,
    paused: false,
    spotted: 0,
    sprintTimer: 0,
    message: '',
    messageTimer: 0,
    spawnTimer: 0.8,
    knifeTimer: 2.5,
    scenery: [],
    obstacles: [],
    corns: [],
    haystacks: [],
    player: {
      x: 210, y: GROUND_Y - PLAYER_H, w: PLAYER_W, h: PLAYER_H,
      vy: 0, grounded: true, hidden: false, hiding: false,
      invulnerable: 0, runPhase: 0, stumble: 0, slowTimer: 0,
    },
    farmer: {
      x: 210 - FARMER.leadStart, y: GROUND_Y - 62, w: 34, h: 62,
      stride: 0, searching: false, searchTimer: 0, sprinting: false,
    },
    // How far ahead of the farmer the turkey is, in pixels. The farmer's screen
    // position follows from this and the turkey's, so he is always chasing.
    lead: FARMER.leadStart,
  };
  seedScenery(world);
  return world;
}

function seedScenery(world) {
  world.scenery = [];
  for (let i = 0; i < 14; i += 1) {
    world.scenery.push({
      kind: pick(world.rng, ['tree', 'pumpkin', 'fence-post']),
      x: world.rng() * 1100,
      depth: 0.3 + world.rng() * 0.5,
      scale: 0.7 + world.rng() * 0.7,
    });
  }
}

export function resetWorld(world, seed) {
  const fresh = createWorld(seed === undefined ? world.seed : seed);
  Object.keys(fresh).forEach((key) => { world[key] = fresh[key]; });
}

function showMessage(world, text, seconds) {
  world.message = text;
  world.messageTimer = seconds;
}

function stageSpeed(world) {
  const stage = stageFor(world.distance);
  let speed = stage.speed;
  if (world.player.slowTimer > 0) speed *= 0.55;
  return speed;
}

function spawnObstacle(world) {
  const stage = stageFor(world.distance);
  const kinds = SPAWNS[stage.id];
  const kind = pick(world.rng, kinds);
  const x = 1000 + world.rng() * 40;
  if (kind === 'corn') {
    for (let i = 0; i < 3; i += 1) {
      world.corns.push({ x: x + i * 34, y: GROUND_Y - 70 - (i === 1 ? 34 : 0), taken: false });
    }
    return;
  }
  if (kind === 'haystack') {
    world.haystacks.push({ x, w: 74, h: 74 });
    return;
  }
  if (kind === 'knife') {
    world.obstacles.push({ kind, x, y: -40, vy: 0, w: 16, h: 60, falling: true, stuckTimer: 0, angle: 0 });
    return;
  }
  if (kind === 'fence') {
    world.obstacles.push({ kind, x, y: GROUND_Y - 52, w: 30, h: 52 });
  } else if (kind === 'haybale') {
    world.obstacles.push({ kind, x, y: GROUND_Y - 46, w: 48, h: 46 });
  } else if (kind === 'puddle') {
    world.obstacles.push({ kind, x, y: GROUND_Y - 8, w: 96, h: 10 });
  } else if (kind === 'oven') {
    world.obstacles.push({ kind, x, y: GROUND_Y - 92, w: 64, h: 92 });
  }
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function stepPlayer(world, dt, input) {
  const player = world.player;
  const speed = stageSpeed(world);

  // Move left and right inside the roaming band; the world scrolls under the turkey.
  let move = 0;
  if (input.left) move -= 1;
  if (input.right) move += 1;
  player.x += move * 240 * dt;
  player.x = Math.max(PLAYER_MIN_X, Math.min(PLAYER_MAX_X, player.x));

  // Jump only from the ground; holding Down near a haystack hides instead.
  const nearHaystack = world.haystacks.some((stack) => Math.abs((stack.x + stack.w / 2) - (player.x + player.w / 2)) < 60);
  player.hiding = input.hide && nearHaystack && player.grounded;
  if (player.hiding) {
    player.hidden = true;
  } else if (player.hidden && !input.hide) {
    player.hidden = false;
  }
  if (input.jump && player.grounded && !player.hiding) {
    player.vy = -JUMP_SPEED;
    player.grounded = false;
  }

  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;
  if (player.y >= GROUND_Y - player.h) {
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.grounded = true;
  }
  player.runPhase += (dt * speed) / 60;
  if (player.stumble > 0) player.stumble -= dt;
  if (player.slowTimer > 0) player.slowTimer -= dt;
  if (player.invulnerable > 0) player.invulnerable -= dt;

  return speed;
}

function stepFarmer(world, dt, speed) {
  const farmer = world.farmer;
  const player = world.player;

  // The lead is the chase itself: clean running stretches it, mistakes shrink it.
  if (world.sprintTimer > 0) {
    world.lead -= FARMER.sprintLoss * dt;
    world.sprintTimer -= dt;
  } else if (player.hidden) {
    world.lead = Math.min(FARMER.leadHideMax, world.lead + FARMER.leadHideGain * dt);
  } else if (player.stumble > 0 || player.slowTimer > 0) {
    world.lead -= (player.stumble > 0 ? FARMER.leadStumbleLoss : FARMER.leadSlowLoss) * dt;
  } else {
    world.lead = Math.min(FARMER.leadMax, world.lead + FARMER.leadGain * dt);
  }

  // The lead never goes below zero: the farmer sits on the turkey's tail while
  // it is caught, he never runs ahead of it.
  world.lead = Math.max(0, world.lead);

  // The farmer's screen position follows from the lead and the turkey's.
  const centre = player.x + player.w / 2 - world.lead;
  farmer.x = centre - farmer.w / 2;
  farmer.stride += dt * (speed / 40);

  if (farmer.searching) {
    farmer.searchTimer -= dt;
    if (farmer.searchTimer <= 0) farmer.searching = false;
  }

  // Spotted meter: rises only when the farmer is really on the turkey's tail.
  if (!player.hidden && world.lead < SPOTTED_RANGE) {
    const before = world.spotted;
    world.spotted = Math.min(SPOTTED_MAX, world.spotted + SPOTTED_RISE * dt);
    if (before < SPOTTED_MAX && world.spotted >= SPOTTED_MAX && world.sprintTimer <= 0) {
      world.sprintTimer = FARMER.sprintSeconds;
      showMessage(world, 'SPOTTED! RUN!', 1.6);
      return EVENT_SPOTTED;
    }
  } else {
    const fall = player.hidden ? HIDE_FALL : SPOTTED_FALL;
    world.spotted = Math.max(0, world.spotted - fall * dt);
  }

  // Caught: the lead is gone while the turkey is visible and unprotected.
  if (!player.hidden && player.invulnerable <= 0 && world.lead <= FARMER.catchDistance) {
    return catchTurkey(world);
  }
  return EVENT_NONE;
}

function catchTurkey(world) {
  const player = world.player;
  world.lives -= 1;
  player.invulnerable = 2;
  player.stumble = 0.9;
  world.lead = FARMER.leadStart;
  world.farmer.searching = false;
  world.spotted = 0;
  world.sprintTimer = 0;
  if (world.lives <= 0) {
    world.over = true;
    world.escaped = false;
    return EVENT_CAUGHT | EVENT_LIFE_LOST | EVENT_OVER;
  }
  showMessage(world, 'CAUGHT! He let you slip away… for now.', 2);
  return EVENT_LIFE_LOST;
}

function stepObstacles(world, dt, speed) {
  const player = world.player;
  let events = EVENT_NONE;
  const scroll = speed * dt;

  for (const obstacle of world.obstacles) {
    if (obstacle.kind === 'knife' && obstacle.falling) {
      obstacle.vy += 2600 * dt;
      obstacle.y += obstacle.vy * dt;
      if (obstacle.y >= GROUND_Y - obstacle.h) {
        obstacle.y = GROUND_Y - obstacle.h;
        obstacle.falling = false;
        obstacle.stuckTimer = 1.6;
      }
    } else {
      obstacle.x -= scroll;
      if (obstacle.kind === 'knife' && !obstacle.falling) {
        obstacle.stuckTimer -= dt;
      }
    }
  }
  world.obstacles = world.obstacles.filter((o) => o.x > -160 && (o.kind !== 'knife' || o.stuckTimer > -0.5 || o.falling));

  for (const corn of world.corns) corn.x -= scroll;
  world.corns = world.corns.filter((corn) => corn.x > -40 && !corn.taken);
  for (const stack of world.haystacks) stack.x -= scroll;
  world.haystacks = world.haystacks.filter((stack) => stack.x > -120);

  // Collisions with hazards.
  for (const obstacle of world.obstacles) {
    if (obstacle.kind === 'puddle') {
      if (overlaps(player, obstacle) && player.grounded) player.slowTimer = 0.35;
      continue;
    }
    if (obstacle.kind === 'knife' && obstacle.falling) {
      // A falling knife is dodged by not standing under it; it only hurts on the way down.
      if (overlaps(player, obstacle) && player.invulnerable <= 0 && player.stumble <= 0) {
        events |= stumble(world, 'Ouch! The carving knife!');
      }
      continue;
    }
    if (overlaps(player, obstacle)) {
      if (player.invulnerable <= 0 && player.stumble <= 0) {
        if (obstacle.kind === 'oven') events |= stumble(world, 'Too hot! The oven singed your tail!');
        else if (obstacle.kind === 'knife') events |= stumble(world, 'The carving knife nicked you!');
        else events |= stumble(world, 'You tripped!');
      }
    }
  }

  // Corn: tasty, and worth points.
  for (const corn of world.corns) {
    if (!corn.taken && Math.abs((corn.x + 8) - (player.x + player.w / 2)) < 34 && Math.abs((corn.y + 13) - (player.y + player.h / 2)) < 44) {
      corn.taken = true;
      world.score += SCORE.corn;
      events |= EVENT_CORN;
    }
  }

  // Hiding: while tucked in a haystack the farmer loses the trail and starts searching.
  if (player.hidden && !world.farmer.searching && world.lead < 260) {
    world.farmer.searching = true;
    world.farmer.searchTimer = FARMER.searchSeconds;
    showMessage(world, 'Hidden in the hay… shhh!', 1.4);
    events |= EVENT_HIDE;
  }

  return events;
}

function stumble(world, text) {
  const player = world.player;
  player.stumble = 0.8;
  player.invulnerable = 1.2;
  // One fixed knock-back, so a stumble costs ground without shoving the turkey
  // across the screen while the obstacle scrolls past.
  player.x = Math.max(PLAYER_MIN_X, player.x - 24);
  // The stumble costs lead at once: the farmer is suddenly right behind you.
  world.lead -= FARMER.stumbleLoss;
  showMessage(world, text, 1.4);
  return EVENT_STUMBLE;
}

function stepScenery(world, dt, speed) {
  for (const item of world.scenery) {
    item.x -= speed * item.depth * dt;
    if (item.x < -80) {
      item.x = 1000 + world.rng() * 200;
      item.kind = pick(world.rng, ['tree', 'pumpkin', 'fence-post']);
    }
  }
}

// Advance the world one fixed step. `input` is {left, right, jump, hide} for this step.
// Returns a bitmask of EVENT_* flags for sounds and announcements.
export function stepWorld(world, dt, input) {
  if (world.over || world.paused) return EVENT_NONE;
  let events = EVENT_NONE;
  world.time += dt;

  const speed = stepPlayer(world, dt, input);
  world.distance += (speed * dt) / PIXELS_PER_METRE;
  world.score += (speed * dt) / PIXELS_PER_METRE * SCORE.perMetre;

  const newStageIndex = stageIndexFor(world.distance);
  if (newStageIndex !== world.stageIndex) {
    world.stageIndex = newStageIndex;
    world.score += SCORE.stageBonus;
    showMessage(world, `${stageFor(world.distance).name} — ${stageFor(world.distance).label}`, 2.4);
    events |= EVENT_STAGE;
  }

  // Spawn the next hazard or treat, with a gap that shrinks as the stages get harder.
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    spawnObstacle(world);
    const stage = stageFor(world.distance);
    world.spawnTimer = stage.spawnGap * range(world.rng, 0.85, 1.25);
  }

  // A knife drops from the kitchen ceiling now and then, even between spawns.
  world.knifeTimer -= dt;
  if (world.knifeTimer <= 0 && world.stageIndex >= 1) {
    const x = world.player.x + 260 + world.rng() * 260;
    world.obstacles.push({ kind: 'knife', x, y: -40, vy: 0, w: 16, h: 60, falling: true, stuckTimer: 0, angle: 0 });
    world.knifeTimer = range(world.rng, 3.2, 5.2);
  }

  events |= stepObstacles(world, dt, speed);
  events |= stepFarmer(world, dt, speed);
  stepScenery(world, dt, speed);

  if (world.messageTimer > 0) world.messageTimer -= dt;

  if (world.distance >= ESCAPE_DISTANCE) {
    world.over = true;
    world.escaped = true;
    world.score += SCORE.escapeBonus;
    events |= EVENT_ESCAPED | EVENT_OVER;
  }
  return events;
}

export function progress(world) {
  return Math.min(1, world.distance / ESCAPE_DISTANCE);
}

export function isKitchen(world) {
  return world.stageIndex >= 2;
}
