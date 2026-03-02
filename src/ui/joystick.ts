import { InputState } from '../game/input/inputState';

type JoystickHandle = {
  root: HTMLDivElement;
  destroy: () => void;
};

export const createJoystick = (mount: HTMLElement, inputState: InputState): JoystickHandle => {
  const base = document.createElement('div');
  base.id = 'joystick-base';
  base.setAttribute('aria-hidden', 'true');

  const knob = document.createElement('div');
  knob.id = 'joystick-knob';
  base.append(knob);
  mount.append(base);

  const radius = 44;
  let activePointerId: number | null = null;

  const reset = (): void => {
    activePointerId = null;
    knob.style.transform = 'translate(-50%, -50%)';
    inputState.setJoystick(0, 0);
  };

  const update = (clientX: number, clientY: number): void => {
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const length = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(length, radius);
    const scale = length > 0 ? clamped / length : 0;
    const px = dx * scale;
    const py = dy * scale;

    knob.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
    inputState.setJoystick(dx / radius, dy / radius);
  };

  const onPointerDown = (event: PointerEvent): void => {
    activePointerId = event.pointerId;
    base.setPointerCapture(event.pointerId);
    update(event.clientX, event.clientY);
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId) return;
    update(event.clientX, event.clientY);
  };

  const onPointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId) return;
    reset();
  };

  base.addEventListener('pointerdown', onPointerDown);
  base.addEventListener('pointermove', onPointerMove);
  base.addEventListener('pointerup', onPointerEnd);
  base.addEventListener('pointercancel', onPointerEnd);

  return {
    root: base,
    destroy: () => {
      base.removeEventListener('pointerdown', onPointerDown);
      base.removeEventListener('pointermove', onPointerMove);
      base.removeEventListener('pointerup', onPointerEnd);
      base.removeEventListener('pointercancel', onPointerEnd);
      reset();
      base.remove();
    },
  };
};
