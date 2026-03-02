import Phaser from 'phaser';
import { InputState } from '../input/inputState';

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
const GRID_SIZE = 80;
const PLAYER_SPEED = 200;

export class WorldScene extends Phaser.Scene {
  private readonly inputState: InputState;
  private player!: Phaser.GameObjects.Rectangle;

  constructor(inputState: InputState) {
    super('world');
    this.inputState = inputState;
  }

  create(): void {
    this.drawWorld();

    this.player = this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 36, 36, 0xf5c044).setOrigin(0.5);

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBackgroundColor(0x1e2436);
  }

  update(_: number, delta: number): void {
    const direction = this.inputState.getDirection();
    const seconds = delta / 1000;

    const nextX = this.player.x + direction.x * PLAYER_SPEED * seconds;
    const nextY = this.player.y + direction.y * PLAYER_SPEED * seconds;

    this.player.setPosition(
      Phaser.Math.Clamp(nextX, this.player.width / 2, WORLD_WIDTH - this.player.width / 2),
      Phaser.Math.Clamp(nextY, this.player.height / 2, WORLD_HEIGHT - this.player.height / 2),
    );
  }

  private drawWorld(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x2a324a, 1);
    graphics.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    graphics.lineStyle(1, 0x445072, 0.6);
    for (let x = 0; x <= WORLD_WIDTH; x += GRID_SIZE) {
      graphics.lineBetween(x, 0, x, WORLD_HEIGHT);
    }

    for (let y = 0; y <= WORLD_HEIGHT; y += GRID_SIZE) {
      graphics.lineBetween(0, y, WORLD_WIDTH, y);
    }
  }
}
