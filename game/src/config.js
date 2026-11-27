// Gobble Dash — tuning, stages and the autumn palette. One place for every number the
// rest of the game reads, so the difficulty curve and the look can be tuned without
// touching the rules, the art or the renderer.
export const VIEW = { width: 960, height: 540 };
export const GROUND_Y = 452;
export const GRAVITY = 2600;
export const JUMP_SPEED = 1050;
export const STEP = 1 / 60;

// The turkey runs this far, in metres, before it bursts out of the kitchen window.
export const ESCAPE_DISTANCE = 1200;
// 28 world pixels make one metre on the HUD.
export const PIXELS_PER_METRE = 28;

// How far the turkey may roam on screen; the farmer chases from the left edge.
export const PLAYER_MIN_X = 60;
export const PLAYER_MAX_X = 560;
export const PLAYER_START_X = 210;

// The three stages of the escape, in order, with their distance bands and mood.
export const STAGES = [
  {
    id: 'farmyard',
    name: 'THE FARMYARD',
    from: 0,
    to: 400,
    speed: 250,
    spawnGap: 1.2,
    sky: ['#f7b267', '#f4845f'],
    ground: '#8a5a2b',
    grass: '#c98f2e',
    label: 'Dawn on the farm — run!',
  },
  {
    id: 'barn',
    name: 'THE BARN',
    from: 400,
    to: 800,
    speed: 305,
    spawnGap: 1.05,
    sky: ['#e07856', '#8f4b6e'],
    ground: '#6e4520',
    grass: '#a8741f',
    label: 'Through the barn — the farmer is close!',
  },
  {
    id: 'kitchen',
    name: 'THE KITCHEN',
    from: 800,
    to: 1200,
    speed: 360,
    spawnGap: 0.9,
    sky: ['#7d3c4e', '#3f2a4d'],
    ground: '#4a2c1c',
    grass: '#7c5a24',
    label: 'The kitchen! Dodge the oven and the knife!',
  },
];

// Autumn palette, shared by the art and the menus so the whole game reads as one scene.
export const PALETTE = {
  cream: '#fff3d6',
  ink: '#3a2415',
  orange: '#e8641b',
  gold: '#f2a541',
  red: '#c0392b',
  brown: '#6b4226',
  darkBrown: '#4a2c1c',
  leafGreen: '#7a9b3a',
  turkeyBody: '#8d5a2b',
  turkeyBelly: '#d9a05b',
  feather: '#5d3a1a',
  beak: '#f2a541',
  wattle: '#c0392b',
  farmerShirt: '#4a6fa5',
  farmerHat: '#8a6d3b',
  farmerSkin: '#e8b88a',
  hay: '#e0b34c',
  oven: '#3d3d4d',
  steel: '#cfd6dd',
  corn: '#ffd94d',
};

// Points, lives and the farmer's temper.
export const SCORE = { perMetre: 1, corn: 25, stageBonus: 500, escapeBonus: 1000 };
export const LIVES = 3;
// The spotted meter only climbs when the farmer is really on the turkey's tail;
// a distant farmer is no threat, and hiding drops it fast.
export const SPOTTED_MAX = 100;
export const SPOTTED_RANGE = 170;
export const SPOTTED_RISE = 30;
export const SPOTTED_FALL = 90;
export const HIDE_FALL = 140;

// Farmer behaviour, as a lead: how far behind the turkey he is, in pixels. Clean
// running stretches the lead (he falls behind, lurking at the left edge); every
// stumble costs 150 of it at once, puddles and sprinting eat it fast, and hiding in
// a haystack rebuilds it while he searches. At a lead of 42 or less he catches you.
export const FARMER = {
  leadStart: 300,
  leadMax: 260,
  leadHideMax: 320,
  leadGain: 55,
  leadHideGain: 60,
  leadSlowLoss: 25,
  leadStumbleLoss: 25,
  stumbleLoss: 120,
  sprintLoss: 120,
  sprint: 1.45,
  sprintSeconds: 3,
  catchDistance: 42,
  searchSeconds: 2.2,
};

// Spawn table: which hazards each stage may throw at the turkey.
export const SPAWNS = {
  farmyard: ['fence', 'haybale', 'puddle', 'corn', 'haystack'],
  barn: ['fence', 'haybale', 'puddle', 'corn', 'haystack', 'knife'],
  kitchen: ['oven', 'knife', 'fence', 'corn', 'haystack', 'puddle'],
};

export function stageFor(distance) {
  for (let i = STAGES.length - 1; i >= 0; i -= 1) {
    if (distance >= STAGES[i].from) return STAGES[i];
  }
  return STAGES[0];
}

export function stageIndexFor(distance) {
  for (let i = STAGES.length - 1; i >= 0; i -= 1) {
    if (distance >= STAGES[i].from) return i;
  }
  return 0;
}
