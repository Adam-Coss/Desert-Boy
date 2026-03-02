function requireElement<T extends Element>(el: T | null, name: string): T {
  if (!el) {
    throw new Error(`HUD element not found: ${name}`);
  }
  return el;
}

export interface HudController {
  setExpected: (text: string) => void;
  setRecognized: (text: string) => void;
  setResult: (text: string) => void;
  setCatFood: (count: number) => void;
}

let currentHud: HudController | null = null;

export function mountHud(root: ParentNode): HudController {
  const expectedLabel = requireElement(root.querySelector<HTMLDivElement>('.hud-expected'), 'expectedLabel');
  const recognizedLabel = requireElement(root.querySelector<HTMLDivElement>('.hud-recognized'), 'recognizedLabel');
  const resultLabel = requireElement(root.querySelector<HTMLDivElement>('.hud-result'), 'resultLabel');
  const inventoryLabel = requireElement(root.querySelector<HTMLDivElement>('.hud-inventory'), 'inventoryLabel');

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
