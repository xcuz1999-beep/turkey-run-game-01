// Keyboard and mouse input, kept in one place. Keys are tracked by code so the layout
// does not matter; clicks are reported in canvas coordinates so the menus and the
// turkey share the same pointer. Edge-triggered "pressed" flags are consumed by the
// game each frame, so a tap never fires twice.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.clicks = [];
    this.pointer = { x: 0, y: 0, down: false };
    this.onFirstGesture = null;
    this.gestureSeen = false;

    window.addEventListener('keydown', (event) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
      this.noteGesture();
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });

    const toCanvas = (event) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * canvas.width,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      };
    };
    canvas.addEventListener('pointerdown', (event) => {
      const point = toCanvas(event);
      this.pointer = { x: point.x, y: point.y, down: true };
      this.clicks.push(point);
      this.noteGesture();
    });
    canvas.addEventListener('pointerup', () => {
      this.pointer.down = false;
    });
    canvas.addEventListener('pointermove', (event) => {
      const point = toCanvas(event);
      this.pointer.x = point.x;
      this.pointer.y = point.y;
    });
  }

  noteGesture() {
    if (!this.gestureSeen) {
      this.gestureSeen = true;
      if (this.onFirstGesture) this.onFirstGesture();
    }
  }

  down(...codes) {
    return codes.some((code) => this.keys.has(code));
  }

  wasPressed(...codes) {
    return codes.some((code) => this.pressed.has(code));
  }

  left() {
    return this.down('ArrowLeft', 'KeyA');
  }

  right() {
    return this.down('ArrowRight', 'KeyD');
  }

  jumpPressed() {
    return this.wasPressed('Space', 'ArrowUp', 'KeyW');
  }

  hideHeld() {
    return this.down('ArrowDown', 'KeyS');
  }

  confirmPressed() {
    return this.wasPressed('Enter', 'Space');
  }

  restartPressed() {
    return this.wasPressed('KeyR');
  }

  pausePressed() {
    return this.wasPressed('KeyP', 'Escape');
  }

  mutePressed() {
    return this.wasPressed('KeyM');
  }

  // Take and clear this frame's clicks (each {x, y} in canvas pixels).
  takeClicks() {
    const clicks = this.clicks;
    this.clicks = [];
    return clicks;
  }

  // Take and clear this frame's pressed keys.
  endFrame() {
    this.pressed.clear();
  }
}
