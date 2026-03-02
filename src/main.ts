import './style.css';
import { bindKeyboardInput, createGame } from './game/createGame';
import { InputState } from './game/input/inputState';
import { clearLogs, getLogs, registerLogRenderer, writeLog } from './logging';
import { createJoystick } from './ui/joystick';

const RUNNING_KEY = 'desert-boy:running';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App container #app not found');
}

const crashDetected = localStorage.getItem(RUNNING_KEY) === 'true';
localStorage.setItem(RUNNING_KEY, 'true');

const screen = document.createElement('div');
screen.className = 'app';
screen.innerHTML = `
  ${crashDetected ? '<div class="crash-banner">Предыдущее завершение было некорректным</div>' : ''}
  <header class="hud">
    <div><strong>Нужно сказать:</strong> …</div>
    <div><strong>Вы сказали:</strong> …</div>
  </header>
  <main>
    <h1 class="title">Desert Boy</h1>
    <div id="game" aria-label="Game area"></div>
  </main>
  <button type="button" class="log-toggle">Логи</button>
`;

app.append(screen);

const logToggle = screen.querySelector<HTMLButtonElement>('.log-toggle');
const gameContainer = screen.querySelector<HTMLDivElement>('#game');
if (!logToggle || !gameContainer) {
  throw new Error('Required controls not found');
}

const overlay = document.createElement('div');
overlay.className = 'log-overlay';
overlay.hidden = true;
overlay.innerHTML = `
  <section class="log-panel">
    <div class="log-toolbar">
      <div>
        <button type="button" data-action="copy">Copy</button>
        <button type="button" data-action="clear">Clear</button>
      </div>
      <button type="button" data-action="close">Close</button>
    </div>
    <ul class="log-list" aria-live="polite"></ul>
  </section>
`;

app.append(overlay);

const logList = overlay.querySelector<HTMLUListElement>('.log-list');
const copyButton = overlay.querySelector<HTMLButtonElement>('[data-action="copy"]');
const clearButton = overlay.querySelector<HTMLButtonElement>('[data-action="clear"]');
const closeButton = overlay.querySelector<HTMLButtonElement>('[data-action="close"]');

if (!logList || !copyButton || !clearButton || !closeButton) {
  throw new Error('Log controls missing');
}

function renderLogs(): void {
  logList.innerHTML = '';
  for (const entry of getLogs()) {
    const item = document.createElement('li');
    item.className = 'log-item';
    item.textContent = entry;
    logList.append(item);
  }
}

registerLogRenderer(renderLogs);

logToggle.addEventListener('click', () => {
  overlay.hidden = false;
  renderLogs();
});

closeButton.addEventListener('click', () => {
  overlay.hidden = true;
});

clearButton.addEventListener('click', () => {
  clearLogs();
  writeLog('INFO', 'Logs cleared by user');
});

copyButton.addEventListener('click', async () => {
  const payload = getLogs().join('\n');
  try {
    await navigator.clipboard.writeText(payload);
    writeLog('INFO', 'Logs copied to clipboard');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeLog('ERROR', `Clipboard copy failed: ${message}`);
  }
});

window.addEventListener('error', (event) => {
  writeLog('ERROR', `window.onerror: ${event.message} @ ${event.filename}:${event.lineno}:${event.colno}`);
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason instanceof Error ? `${event.reason.name}: ${event.reason.message}` : String(event.reason);
  writeLog('ERROR', `unhandledrejection: ${reason}`);
});

window.addEventListener('beforeunload', () => {
  localStorage.setItem(RUNNING_KEY, 'false');
});

const inputState = new InputState((source) => writeLog('INFO', `Input: ${source}`));
const unbindKeyboard = bindKeyboardInput(inputState);
const joystick = createJoystick(screen, inputState);
const game = createGame(gameContainer, inputState);

if (crashDetected) {
  writeLog('WARN', 'Detected unclean shutdown from previous session');
}

writeLog('INFO', 'Desert Boy app started');

window.addEventListener('beforeunload', () => {
  unbindKeyboard();
  joystick.destroy();
  game.destroy(true);
});
