import type { GameTime } from '../state/time';

function requireElement<T extends Element>(el: T | null, name: string): T {
  if (!el) {
    throw new Error(`HUD element not found: ${name}`);
  }
  return el;
}

function toClock(minutesOfDay: number): string {
  const totalMinutes = Math.floor(minutesOfDay);
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function periodLabel(period: GameTime['period']): string {
  if (period === 'morning') return 'Утро';
  if (period === 'day') return 'День';
  if (period === 'evening') return 'Вечер';
  return 'Ночь';
}

export interface HudController {
  setExpected: (text: string) => void;
  setRecognized: (text: string) => void;
  setResult: (text: string) => void;
  setCatFood: (count: number) => void;
  setTime: (time: GameTime) => void;
}

let currentHud: HudController | null = null;

export function mountHud(root: ParentNode): HudController {
  const expectedLabel = requireElement(root.querySelector<HTMLDivElement>('.hud-expected'), 'expectedLabel');
  const recognizedLabel = requireElement(root.querySelector<HTMLDivElement>('.hud-recognized'), 'recognizedLabel');
  const resultLabel = requireElement(root.querySelector<HTMLDivElement>('.hud-result'), 'resultLabel');
  const inventoryLabel = requireElement(root.querySelector<HTMLDivElement>('.hud-inventory'), 'inventoryLabel');
  const timeLabel = requireElement(root.querySelector<HTMLDivElement>('.hud-time'), 'timeLabel');

  const hud: HudController = {
    setExpected(text: string): void {
      expectedLabel.innerHTML = `<strong>Нужно сказать:</strong> ${text || '…'}`;
    },
    setRecognized(text: string): void {
      recognizedLabel.innerHTML = `<strong>Вы сказали:</strong> ${text || '…'}`;
    },
    setResult(text: string): void {
      resultLabel.innerHTML = `<strong>Статус:</strong> ${text || '…'}`;
    },
    setCatFood(count: number): void {
      inventoryLabel.innerHTML = `<strong>Cat food:</strong> ${count}`;
    },
    setTime(time: GameTime): void {
      timeLabel.innerHTML = `<strong>День:</strong> ${time.dayIndex}, <strong>Время:</strong> ${toClock(time.minutesOfDay)}, <strong>Период:</strong> ${periodLabel(time.period)} (${time.period})`;
    }
  };

  currentHud = hud;
  return hud;
}

export function getHud(): HudController {
  if (!currentHud) {
    throw new Error('HUD is not mounted');
  }
  return currentHud;
}
