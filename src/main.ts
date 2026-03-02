import './style.css';
import { showFatalError } from './ui/fatalErrorOverlay';

const RUNNING_KEY = 'desert-boy:running';

function setupGlobalFatalHandlers(): void {
  window.onerror = (message, source, lineno, colno, error) => {
    const text = `${String(message)} @ ${source ?? 'unknown'}:${lineno}:${colno}`;
    window.__DESERT_BOY_WRITE_LOG__?.('ERROR', `window.onerror: ${text}`);
    showFatalError(error ?? text, 'window.onerror');
    return false;
  };

  window.onunhandledrejection = (event) => {
    const reason = event.reason instanceof Error ? event.reason : String(event.reason);
    window.__DESERT_BOY_WRITE_LOG__?.('ERROR', `unhandledrejection: ${String(reason)}`);
    showFatalError(reason, 'window.onunhandledrejection');
  };
}

function renderBootScreen(app: HTMLElement): void {
  app.innerHTML = `
    <section class="boot-screen" aria-live="polite">
      <h1>Desert Boy</h1>
      <p>Booting…</p>
    </section>
  `;
}

async function bootstrap(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) {
    showFatalError(new Error('#app not found'), '#app not found');
    return;
  }

  renderBootScreen(app);
  setupGlobalFatalHandlers();

  const [{ bindKeyboardInput, createGame }, { InputState }, { clearLogs, getLogs, registerLogRenderer, writeLog }, { getLearningLanguage, setLearningLanguage }, { createJoystick }, { createLanguagePicker }] = await Promise.all([
    import('./game/createGame'),
    import('./game/input/inputState'),
    import('./logging'),
    import('./state/settings'),
    import('./ui/joystick'),
    import('./ui/languagePicker')
  ]);

  window.__DESERT_BOY_WRITE_LOG__ = writeLog;

  const crashDetected = localStorage.getItem(RUNNING_KEY) === 'true';
  localStorage.setItem(RUNNING_KEY, 'true');

  const screen = document.createElement('div');
  screen.className = 'app';
  screen.innerHTML = `
    ${crashDetected ? '<div class="crash-banner">Предыдущее завершение было некорректным</div>' : ''}
    <header id="hud" class="hud">
      <div class="hud-topline">
        <div><strong>Нужно сказать:</strong> …</div>
        <button type="button" class="change-language">Сменить язык</button>
      </div>
      <div><strong>Вы сказали:</strong> …</div>
      <div class="learning-language"><strong>Язык:</strong> Не выбран</div>
    </header>
    <main>
      <h1 class="title">Desert Boy</h1>
      <div id="game" aria-label="Game area"></div>
    </main>
    <button type="button" class="log-toggle">Логи</button>
  `;

  app.replaceChildren(screen);

  const logToggle = screen.querySelector<HTMLButtonElement>('.log-toggle');
  const gameContainer = screen.querySelector<HTMLDivElement>('#game');
  const languageLabel = screen.querySelector<HTMLDivElement>('.learning-language');
  const changeLanguageButton = screen.querySelector<HTMLButtonElement>('.change-language');
  if (!logToggle || !gameContainer || !languageLabel || !changeLanguageButton) {
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

  window.addEventListener('beforeunload', () => {
    localStorage.setItem(RUNNING_KEY, 'false');
  });

  const inputState = new InputState((source: string) => writeLog('INFO', `Input: ${source}`));
  const unbindKeyboard = bindKeyboardInput(inputState);
  const joystick = createJoystick(screen, inputState);

  let game: ReturnType<typeof createGame> | undefined;

  function ensureGameStarted(): void {
    if (!game) {
      game = createGame(gameContainer, inputState);
    }
  }

  function updateHudLanguage(language: { label: string; bcp47: string }): void {
    languageLabel.innerHTML = `<strong>Язык:</strong> ${language.label} (${language.bcp47})`;
  }

  const languagePicker = createLanguagePicker(app, {
    onSelect: (language: { label: string; bcp47: string }) => {
      setLearningLanguage(language);
      updateHudLanguage(language);
      languagePicker.close();
      ensureGameStarted();
      writeLog('INFO', `Learning language set: ${language.bcp47}`);
    }
  });

  changeLanguageButton.addEventListener('click', () => {
    writeLog('INFO', 'Learning language change requested');
    languagePicker.open();
  });

  const savedLanguage = getLearningLanguage();
  if (savedLanguage) {
    updateHudLanguage(savedLanguage);
    ensureGameStarted();
  } else {
    languagePicker.open();
  }

  if (crashDetected) {
    writeLog('WARN', 'Detected unclean shutdown from previous session');
  }

  writeLog('INFO', 'Desert Boy app started');

  window.addEventListener('beforeunload', () => {
    unbindKeyboard();
    joystick.destroy();
    game?.destroy(true);
  });
}

void bootstrap().catch((error) => {
  showFatalError(error, 'bootstrap');
});
