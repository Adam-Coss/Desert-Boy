import Phaser from 'phaser';

export type LabelHandle = { setVisible(v: boolean): void; destroy(): void };

export function attachLabel(
  scene: Phaser.Scene,
  target: { x: number; y: number },
  text: string
): { textObj: Phaser.GameObjects.Text; update(): void } {
  const textObj = scene.add.text(target.x, target.y - 24, text, { fontSize: '14px', color: '#ffffff' });
  textObj.setPadding(4, 2, 4, 2);
  textObj.setBackgroundColor('rgba(0,0,0,0.6)');
  textObj.setOrigin(0.5, 1);

  const update = (): void => {
    textObj.setPosition(target.x, target.y - 18);
  };

  return { textObj, update };
}
