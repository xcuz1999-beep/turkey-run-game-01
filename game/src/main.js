// Gobble Dash — the entry point. It wires the canvas, the input, the sound and the
// world together, runs the fixed-step game loop, and owns the screen state machine:
// title → play → over, with pause and restart. With ?shot=title|play|caught|escaped
// in the URL it stages that scene deterministically instead, so the screenshots are
// real frames of the real game.
import { STEP, VIEW } from './config.js';
import { AudioEngine } from './audio.js';
import { Input } from './input.js';
import {
  EVENT_CAUGHT, EVENT_CORN, EVENT_ESCAPED, EVENT_HIDE, EVENT_LIFE_LOST,
  EVENT_SPOTTED, EVENT_STAGE, EVENT_STUMBLE, createWorld, resetWorld, stepWorld,
} from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, overButtons, render, titleButtons } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const audio = new AudioEngine();
const input = new Input(canvas);
const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed') ?? '7', 10);
const seed = Number.isFinite(seedParam) ? seedParam : 7;

const world = createWorld(seed);
let screen = SCREEN_TITLE;
let best = 0;

function announce(text) {
  if (statusLine) statusLine.textContent = text;
}

function startRun() {
  resetWorld(world, (Math.random() * 0xffffffff) >>> 0);
  screen = SCREEN_PLAY;
  audio.ensure();
  audio.gobble();
  audio.startMusic();
  announce('Run started. Escape the farmer and reach the kitchen window.');
}

function backToTitle() {
  resetWorld(world, seed);
  screen = SCREEN_TITLE;
  audio.stopMusic();
  announce('Gobble Dash title screen.');
}

function endRun() {
  screen = SCREEN_OVER;
  audio.stopMusic();
  if (world.escaped) audio.escapeFanfare();
  else audio.caught();
  if (Math.floor(world.score) > best) best = Math.floor(world.score);
  announce(world.escaped
    ? `Escaped! Final score ${Math.floor(world.score)}.`
    : `Caught! Final score ${Math.floor(world.score)}. Press R to run again.`);
}

function playEventSounds(events) {
  if (events & EVENT_CORN) audio.corn();
  if (events & EVENT_STUMBLE) audio.thud();
  if (events & EVENT_SPOTTED) audio.alarm();
  if (events & EVENT_STAGE) audio.stageClear();
  if (events & EVENT_HIDE) audio.gobble();
  if (events & EVENT_LIFE_LOST) audio.thud();
  if (events & EVENT_CAUGHT) audio.caught();
  if (events & EVENT_ESCAPED) audio.escapeFanfare();
}

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function handleClicks(clicks) {
  for (const click of clicks) {
    if (screen === SCREEN_TITLE && inside(click, titleButtons().start)) {
      audio.click();
      startRun();
      return;
    }
    if (screen === SCREEN_OVER && inside(click, overButtons().restart)) {
      audio.click();
      startRun();
      return;
    }
    if (screen === SCREEN_PLAY && !world.paused) {
      // A click on the game itself jumps, like a tap.
      input.pressed.add('Space');
    }
  }
}

function frame(dt) {
  if (input.mutePressed()) {
    audio.ensure();
    audio.setMuted(!audio.muted);
  }

  if (screen === SCREEN_TITLE) {
    handleClicks(input.takeClicks());
    if (input.confirmPressed()) startRun();
    // Let the title scene idle: only the clock moves, so leaves drift and the
    // turkey bobs without the run itself starting.
    world.time += dt;
  } else if (screen === SCREEN_OVER) {
    handleClicks(input.takeClicks());
    if (input.restartPressed() || input.confirmPressed()) startRun();
  } else if (screen === SCREEN_PLAY) {
    handleClicks(input.takeClicks());
    if (input.pausePressed()) {
      world.paused = !world.paused;
      announce(world.paused ? 'Paused.' : 'Running.');
    }
    if (!world.paused) {
      const stepInput = {
        left: input.left(),
        right: input.right(),
        jump: input.jumpPressed(),
        hide: input.hideHeld(),
      };
      const events = stepWorld(world, dt, stepInput);
      playEventSounds(events);
      if (world.over) endRun();
    }
  }
  input.endFrame();
  render(ctx, world, screen, best);
}

// Screenshot mode: stage one deterministic scene, draw it once, and tell the
// screenshot tool the frame is ready. The game keeps idling afterwards.
const shotName = params.get('shot');
if (shotName) {
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  best = staged.best;
  render(ctx, world, screen, best);
  window.__shotReady = true;
  document.title = `Gobble Dash — ${shotName}`;
} else {
  let last = performance.now();
  let accumulator = 0;
  const loop = (now) => {
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      frame(STEP);
      accumulator -= STEP;
    }
    requestAnimationFrame(loop);
  };
  input.onFirstGesture = () => audio.ensure();
  requestAnimationFrame(loop);
}
