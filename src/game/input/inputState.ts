export type InputSource = 'none' | 'keyboard' | 'joystick';

export type InputVector = {
  x: number;
  y: number;
};

export class InputState {
  private keyboard: InputVector = { x: 0, y: 0 };
  private joystick: InputVector = { x: 0, y: 0 };
  private activeSource: InputSource = 'none';

  constructor(private readonly onSourceChanged: (source: InputSource) => void) {}

  setKeyboard(x: number, y: number): void {
    this.keyboard = normalizeVector(x, y);
  }

  setJoystick(x: number, y: number): void {
    this.joystick = normalizeVector(x, y);
  }

  getDirection(): InputVector {
    const nextSource: InputSource =
      magnitude(this.joystick) > 0 ? 'joystick' : magnitude(this.keyboard) > 0 ? 'keyboard' : 'none';

    if (nextSource !== this.activeSource) {
      this.activeSource = nextSource;
      if (nextSource !== 'none') {
        this.onSourceChanged(nextSource);
      }
    }

    return nextSource === 'joystick' ? this.joystick : this.keyboard;
  }
}

const magnitude = ({ x, y }: InputVector): number => Math.sqrt(x * x + y * y);

const normalizeVector = (x: number, y: number): InputVector => {
  const len = Math.sqrt(x * x + y * y);
  if (!len) return { x: 0, y: 0 };

  const clampedLen = Math.min(len, 1);
  return {
    x: (x / len) * clampedLen,
    y: (y / len) * clampedLen,
  };
};
