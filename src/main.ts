import './style.css';
import type { LearningLanguage } from './learn/languages';
import type { Task } from './quests/tasks';
import type { Inventory } from './state/inventory';
import { showFatalError } from './ui/fatalErrorOverlay';
import { mountHud } from './ui/hud';

const RUNNING_KEY = 'desert-boy:running';

function requireEl<T extends Element>(el: T | null, name: string): T {
  if (!el) throw new Error(`${name} not found`);
  return el;
}

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

  const [
    { bindKeyboardInput, createGame },
    { InputState },
    { clearLogs, getLogs, registerLogRenderer, writeLog },
    { getLearningLanguage, setLearningLanguage },
    { loadTasks, saveTasks },
    { loadInventory, saveInventory },
    { ensureShopTasks, getInitialTasks },
    { createJoystick },
    { createLanguagePicker },
    { createJournal },
    { ensureSpeechRecognitionReady }
  ] = await Promise.all([
    import('./game/createGame'),
    import('./game/input/inputState'),
    import('./logging'),
    import('./state/settings'),
    import('./state/progress'),
    import('./state/inventory'),
    import('./quests/tasks'),
    import('./ui/joystick'),
    import('./ui/languagePicker'),
    import('./ui/journal'),
    import('./ui/sttGate')
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
        <div class="hud-expected"><strong>Нужно сказать:</strong> …</div>
        <div class="hud-buttons">
          <button type="button" class="open-journal">Дневник</button>
          <button type="button" class="change-language">Сменить язык</button>
        </div>
      </div>
      <div class="hud-recognized"><strong>Вы сказали:</strong> …</div>
      <div class="hud-result"><strong>Статус:</strong> …</div>
      <div class="hud-inventory"><strong>Cat food:</strong> 0</div>
      <div class="learning-language"><strong>Язык:</strong> Не выбран</div>
    </header>
    <main>
      <h1 class="title">Desert Boy</h1>
      <div id="game" aria-label="Game area"></div>
    </main>
    <button type="button" class="log-toggle">Логи</button>
  `;

  app.replaceChildren(screen);

  const logToggle = requireEl(screen.querySelector<HTMLButtonElement>('.log-toggle'), 'logToggle');
  const gameContainer = requireEl(screen.querySelector<HTMLDivElement>('#game'), 'gameContainer');
  const languageLabel = requireEl(screen.querySelector<HTMLDivElement>('.learning-language'), 'languageLabel');
  const changeLanguageButton = requireEl(
    screen.querySelector<HTMLButtonElement>('.change-language'),
    'changeLanguageButton'
  );
  const openJournalButton = requireEl(
    screen.querySelector<HTMLButtonElement>('.open-journal'),
    'openJournalButton'
  );

  const hud = mountHud(screen);

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

  const logList = requireEl(overlay.querySelector<HTMLUListElement>('.log-list'), 'logList');
  const copyButton = requireEl(overlay.querySelector<HTMLButtonElement>('[data-action="copy"]'), 'copyButton');
  const clearButton = requireEl(
    overlay.querySelector<HTMLButtonElement>('[data-action="clear"]'),
    'clearButton'
  );
  const closeButton = requireEl(
    overlay.querySelector<HTMLButtonElement>('[data-action="close"]'),
    'closeButton'
  );

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

  let tasks: Task[] = [];
  let inventory: Inventory = loadInventory();
  let game: ReturnType<typeof createGame> | undefined;
  let journal: ReturnType<typeof createJournal> | undefined;

  const getCurrentLang = (): string => getLearningLanguage()?.bcp47 ?? 'en-US';

  const setTasksState = (nextTasks: Task[]): void => {
    tasks = nextTasks;
    saveTasks(tasks);
  };

  const markDemoTaskCompleted = (): void => {
    let changed = false;
    tasks = tasks.map((task) => {
      if (task.id === 'demo.term_phrase' && !task.done) {
        changed = true;
        return { ...task, done: true };
      }
      return task;
    });

    if (changed) {
      saveTasks(tasks);
      journal?.render();
      writeLog('INFO', 'Task completed: demo.term_phrase');
    }
  };

  const completeShopFlow = (): void => {
    let changed = false;
    tasks = tasks.map((task) => {
      if ((task.id === 'shop.buy_cat_food' || task.id === 'shop.say_no_thanks') && !task.done) {
        changed = true;
        return { ...task, done: true };
      }
      return task;
    });

    inventory = { ...inventory, catFood: inventory.catFood + 1 };

    saveTasks(tasks);
    saveInventory(inventory);
    hud.setCatFood(inventory.catFood);
    journal?.render();

    if (changed) {
      writeLog('INFO', 'Task completed: shop.buy_cat_food');
      writeLog('INFO', 'Task completed: shop.say_no_thanks');
    }
    writeLog('INFO', 'Shop completed, catFood +1');
  };

  function ensureGameStarted(): void {
    if (!game) {
      game = createGame(gameContainer, inputState, markDemoTaskCompleted, completeShopFlow);
    }
  }

  function ensureJournalInitialized(): void {
    if (!journal) {
      journal = createJournal(getCurrentLang, () => tasks, setTasksState);
      openJournalButton.addEventListener('click', () => journal?.toggle());
      window.addEventListener('keydown', (event) => {
        if (event.code === 'KeyJ') {
          journal?.toggle();
        }
      });
    }

    journal.render();
  }

  function ensureTasksForLanguage(languageCode: string): void {
    const loaded = loadTasks();
    tasks = loaded && loaded.length > 0 ? loaded : getInitialTasks(languageCode);
    const next = ensureShopTasks(languageCode, tasks);

    if (next.length !== tasks.length) {
      tasks = next;
    }

    saveTasks(tasks);
  }

  function ensureJournalInitialized(): void {
    if (!journal) {
      journal = createJournal(getCurrentLang, () => tasks, setTasksState);
      openJournalButton.addEventListener('click', () => journal?.toggle());
      window.addEventListener('keydown', (event) => {
        if (event.code === 'KeyJ') {
          journal?.toggle();
        }
      });
    }

    journal.render();
  }

  function ensureTasksForLanguage(languageCode: string): void {
    const loaded = loadTasks();
    if (loaded && loaded.length > 0) {
      tasks = loaded;
      return;
    }

    tasks = getInitialTasks(languageCode);
    saveTasks(tasks);
  }

  async function runSpeechGateForCurrentLanguage(): Promise<void> {
    await ensureSpeechRecognitionReady(() => {
      const current = getLearningLanguage();
      return current?.bcp47 ?? 'en-US';
    }, hud.setRecognized);
  }

  function updateHudLanguage(language: LearningLanguage): void {
    languageLabel.innerHTML = `<strong>Язык:</strong> ${language.label} (${language.bcp47})`;
  }

  const languagePicker = createLanguagePicker(app, {
    onSelect: async (language) => {
      setLearningLanguage(language);
      updateHudLanguage(language);
      languagePicker.close();
      writeLog('INFO', `Learning language set: ${language.bcp47}`);
      await runSpeechGateForCurrentLanguage();
      ensureGameStarted();

      ensureTasksForLanguage(language.bcp47);
      ensureJournalInitialized();
    }
  });

  changeLanguageButton.addEventListener('click', () => {
    writeLog('INFO', 'Learning language change requested');
    languagePicker.open();
  });

  const savedLanguage = getLearningLanguage();
  if (savedLanguage) {
    updateHudLanguage(savedLanguage);
    await runSpeechGateForCurrentLanguage();
    ensureGameStarted();
    ensureTasksForLanguage(savedLanguage.bcp47);
    ensureJournalInitialized();
  } else {
    languagePicker.open();
  }

  inventory = loadInventory();
  hud.setCatFood(inventory.catFood);

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
