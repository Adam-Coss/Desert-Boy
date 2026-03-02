export type Inventory = { catFood: number };

const INVENTORY_KEY = 'desertBoy.inventory';

export function loadInventory(): Inventory {
  const raw = localStorage.getItem(INVENTORY_KEY);
  if (!raw) {
    return { catFood: 0 };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Inventory>;
    return {
      catFood: typeof parsed.catFood === 'number' && parsed.catFood >= 0 ? parsed.catFood : 0
    };
  } catch {
    return { catFood: 0 };
  }
}

export function saveInventory(inv: Inventory): void {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
}
