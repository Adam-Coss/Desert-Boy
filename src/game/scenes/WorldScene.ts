import Phaser from 'phaser';
import { writeLog } from '../../logging';
import { isMatch } from '../../learn/compare';
import { getDemoPhrase } from '../../learn/demoPhrases';
import { getShopFlow } from '../../learn/shopPhrases';
import { getSettings } from '../../state/settings';
import { listenOnce } from '../../speech/oneShotListen';
import { getHud } from '../../ui/hud';
import { InputState } from '../input/inputState';

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
const GRID_SIZE = 80;
const PLAYER_SPEED = 200;
const INTERACT_DISTANCE = 120;
const MAX_ATTEMPTS = 3;

type Interactable = 'none' | 'terminal' | 'shop';

export class WorldScene extends Phaser.Scene {
  private readonly inputState: InputState;
  private player!: Phaser.GameObjects.Rectangle;
  private terminal!: Phaser.GameObjects.Rectangle;
  private shop!: Phaser.GameObjects.Rectangle;
  private interactHint!: Phaser.GameObjects.Text;
  private npcPrompt!: Phaser.GameObjects.Text;
  private talkButton?: HTMLButtonElement;
  private activeInteractable: Interactable = 'none';
  private isDialogueActive = false;

  constructor(
    inputState: InputState,
    private readonly onDemoPhraseMatched: () => void,
    private readonly onShopCompleted: () => void
  ) {
    super('world');
    this.inputState = inputState;
  }

  create(): void {
    this.drawWorld();

    this.player = this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 36, 36, 0xf5c044).setOrigin(0.5);
    this.terminal = this.add.rectangle(this.player.x + 180, this.player.y, 48, 56, 0x67b7ff).setOrigin(0.5);
    this.shop = this.add.rectangle(this.player.x, this.player.y + 220, 64, 48, 0x8fdd7b).setOrigin(0.5);

    this.interactHint = this.add
      .text(0, 0, 'Нажмите E / Tap', {
        color: '#ffffff',
        fontSize: '18px',
        backgroundColor: '#00000099',
        padding: { x: 10, y: 6 }
      })
      .setScrollFactor(0)
      .setDepth(10)
      .setVisible(false);

    this.npcPrompt = this.add
      .text(0, 0, '', {
        color: '#d3edff',
        fontSize: '18px',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.input.keyboard?.on('keydown-E', () => {
      void this.startInteraction();
    });

    this.createTalkButton();

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBackgroundColor(0x1e2436);
  }

  update(_: number, delta: number): void {
    const direction = this.isDialogueActive ? { x: 0, y: 0 } : this.inputState.getDirection();
    const seconds = delta / 1000;

    const nextX = this.player.x + direction.x * PLAYER_SPEED * seconds;
    const nextY = this.player.y + direction.y * PLAYER_SPEED * seconds;

    this.player.setPosition(
      Phaser.Math.Clamp(nextX, this.player.width / 2, WORLD_WIDTH - this.player.width / 2),
      Phaser.Math.Clamp(nextY, this.player.height / 2, WORLD_HEIGHT - this.player.height / 2)
    );

    this.updateInteractionAvailability();
  }

  private updateInteractionAvailability(): void {
    const terminalDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.terminal.x, this.terminal.y);
    const shopDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shop.x, this.shop.y);

    const nearTerminal = terminalDistance < INTERACT_DISTANCE;
    const nearShop = shopDistance < INTERACT_DISTANCE;

    if (nearTerminal && nearShop) {
      this.activeInteractable = terminalDistance <= shopDistance ? 'terminal' : 'shop';
    } else if (nearTerminal) {
      this.activeInteractable = 'terminal';
    } else if (nearShop) {
      this.activeInteractable = 'shop';
    } else {
      this.activeInteractable = 'none';
    }

    this.interactHint
      .setPosition(this.cameras.main.width / 2, this.cameras.main.height - 36)
      .setVisible(this.activeInteractable !== 'none' && !this.isDialogueActive);

    if (this.talkButton) {
      this.talkButton.style.display = this.activeInteractable !== 'none' && !this.isDialogueActive ? 'block' : 'none';
    }
  }

  private async startInteraction(): Promise<void> {
    if (this.isDialogueActive || this.activeInteractable === 'none') {
      return;
    }

    if (this.activeInteractable === 'terminal') {
      await this.startTerminalDialogue();
      return;
    }

    await this.startShopDialogue();
  }

  private async startTerminalDialogue(): Promise<void> {
    const language = getSettings().learningLanguage?.bcp47 ?? 'en-US';
    const demoPhrase = getDemoPhrase(language);
    const hud = getHud();

    this.lockInteraction();
    this.npcPrompt.setPosition(this.terminal.x, this.terminal.y - 60).setText(`${demoPhrase.npcPrompt} ${demoPhrase.expected}`).setVisible(true);
    hud.setExpected(demoPhrase.expected);
    hud.setRecognized('…');

    try {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        hud.setResult('Слушаю...');

        try {
          const { finalText } = await listenOnce(language);
          hud.setRecognized(finalText);

          if (isMatch(demoPhrase.expected, finalText)) {
            hud.setResult('✅ Засчитано');
            writeLog('INFO', 'Phrase matched');
            this.onDemoPhraseMatched();
            return;
          }

          hud.setResult('Повторите, пожалуйста');
          writeLog('WARN', 'Phrase mismatch');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          hud.setResult('Не получилось распознать. Повторите, пожалуйста.');
          writeLog('ERROR', `Phrase recognition failed: ${errorMessage}`);
        }
      }

      hud.setResult('Пока пропустим');
    } finally {
      this.unlockInteraction();
    }
  }

  private async startShopDialogue(): Promise<void> {
    const language = getSettings().learningLanguage?.bcp47 ?? 'en-US';
    const flow = getShopFlow(language);
    const hud = getHud();

    this.lockInteraction();

    try {
      for (const step of flow.steps) {
        let matched = false;

        this.npcPrompt.setPosition(this.shop.x, this.shop.y - 60).setText(step.npc).setVisible(true);
        hud.setExpected(step.expected);
        hud.setRecognized('…');

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
          hud.setResult('Слушаю...');

          try {
            const { finalText } = await listenOnce(language);
            hud.setRecognized(finalText);

            if (isMatch(step.expected, finalText)) {
              hud.setResult('✅');
              matched = true;
              break;
            }

            hud.setResult('Повторите, пожалуйста');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            hud.setResult('Не получилось распознать. Повторите, пожалуйста.');
            writeLog('ERROR', `Shop recognition failed: ${errorMessage}`);
          }
        }

        if (!matched) {
          hud.setResult('Пока пропустим');
          return;
        }
      }

      this.onShopCompleted();
      hud.setResult('✅ Покупка завершена');
    } finally {
      this.unlockInteraction();
    }
  }

  private lockInteraction(): void {
    this.isDialogueActive = true;
    this.inputState.setKeyboard(0, 0);
    this.inputState.setJoystick(0, 0);
    this.interactHint.setVisible(false);
    if (this.talkButton) {
      this.talkButton.style.display = 'none';
    }
  }

  private unlockInteraction(): void {
    this.npcPrompt.setVisible(false);
    this.isDialogueActive = false;
    this.updateInteractionAvailability();
  }

  private createTalkButton(): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'talk-button';
    button.textContent = 'Talk';
    button.style.display = 'none';
    button.addEventListener('click', () => {
      void this.startInteraction();
    });

    document.body.append(button);
    this.talkButton = button;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      button.remove();
      this.talkButton = undefined;
    });
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
