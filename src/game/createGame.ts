import Phaser from 'phaser';
import { InputState } from './input/inputState';
import { WorldScene } from './scenes/WorldScene';
import { writeLog } from '../logging';

export const createGame = (
  container: HTMLElement,
  inputState: InputState,
  onDemoPhraseMatched: () => void
): Phaser.Game => {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: container.clientWidth,
    height: container.clientHeight,
    backgroundColor: '#1e2436',
    scene: [new WorldScene(inputState, onDemoPhraseMatched)],
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });

  writeLog('INFO', 'Game started');
  return game;
};

export const bindKeyboardInput = (inputState: InputState): (() => void) => {
  const pressed = new Set<string>();

  const updateKeyboardVector = (): void => {
    const left = pressed.has('ArrowLeft') || pressed.has('KeyA');
    const right = pressed.has('ArrowRight') || pressed.has('KeyD');
    const up = pressed.has('ArrowUp') || pressed.has('KeyW');
    const down = pressed.has('ArrowDown') || pressed.has('KeyS');

    inputState.setKeyboard((right ? 1 : 0) - (left ? 1 : 0), (down ? 1 : 0) - (up ? 1 : 0));
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.code.startsWith('Arrow') || ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
      pressed.add(event.code);
      updateKeyboardVector();
    }
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    if (pressed.delete(event.code)) {
      updateKeyboardVector();
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    pressed.clear();
    inputState.setKeyboard(0, 0);
  };
};
