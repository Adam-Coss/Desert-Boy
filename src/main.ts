import './style.css';

const LOGS_KEY = 'desert-boy:logs';
const RUNNING_KEY = 'desert-boy:running';
const LOG_LIMIT = 500;

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App container #app not found');
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

const loadLogs = (): string[] => {
  const raw = localStorage.getItem(LOGS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

let logs = loadLogs();

const saveLogs = (): void => {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(-LOG_LIMIT)));
};

const nowIso = (): string => new Date().toISOString();

const writeLog = (level: LogLevel, message: string): void => {
  logs.push(`[${nowIso()}] [${level}] ${message}`);
  if (logs.length > LOG_LIMIT) {
    logs = logs.slice(-LOG_LIMIT);
  }
  saveLogs();
  renderLogs();
};

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
  </main>
  <button type="button" class="log-toggle">Логи</button>
`;

app.append(screen);

const logToggle = screen.querySelector<HTMLButtonElement>('.log-toggle');
if (!logToggle) {
  throw new Error('Log toggle not found');
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
  if (!logList) return;

  logList.innerHTML = '';
  for (const entry of logs) {
    const item = document.createElement('li');
    item.className = 'log-item';
    item.textContent = entry;
    logList.append(item);
  }
}

logToggle.addEventListener('click', () => {
  overlay.hidden = false;
  renderLogs();
});

closeButton.addEventListener('click', () => {
  overlay.hidden = true;
});

clearButton.addEventListener('click', () => {
  logs = [];
  saveLogs();
  renderLogs();
  writeLog('INFO', 'Logs cleared by user');
});

copyButton.addEventListener('click', async () => {
  const payload = logs.join('\n');
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

if (crashDetected) {
  writeLog('WARN', 'Detected unclean shutdown from previous session');
}

writeLog('INFO', 'Desert Boy app started');
