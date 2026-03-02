import { speak } from '../speech/tts';
import type { Task } from '../quests/tasks';

function requireElement<T extends Element>(el: T | null, name: string): T {
  if (!el) {
    throw new Error(`Journal element not found: ${name}`);
  }
  return el;
}

export function createJournal(
  getLang: () => string,
  getTasks: () => Task[],
  setTasks: (tasks: Task[]) => void
): {
  open(): void;
  close(): void;
  toggle(): void;
  render(): void;
} {
  let overlay = document.querySelector<HTMLDivElement>('.journal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'journal-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <section class="journal-panel" role="dialog" aria-modal="true" aria-label="Дневник">
        <div class="journal-toolbar">
          <h2>Дневник</h2>
          <div class="journal-actions">
            <button type="button" data-action="clear-completed">Clear completed</button>
            <button type="button" data-action="close">Close</button>
          </div>
        </div>
        <ul class="journal-list"></ul>
      </section>
    `;
    document.body.append(overlay);
  }

  const list = requireElement(overlay.querySelector<HTMLUListElement>('.journal-list'), 'list');
  const closeButton = requireElement(
    overlay.querySelector<HTMLButtonElement>('[data-action="close"]'),
    'closeButton'
  );
  const clearCompletedButton = requireElement(
    overlay.querySelector<HTMLButtonElement>('[data-action="clear-completed"]'),
    'clearCompletedButton'
  );

  const render = (): void => {
    list.innerHTML = '';

    for (const task of getTasks()) {
      const item = document.createElement('li');
      item.className = 'journal-task';

      const status = document.createElement('input');
      status.type = 'checkbox';
      status.checked = task.done;
      status.disabled = true;

      const title = document.createElement('span');
      title.className = 'journal-task-title';
      title.textContent = task.title;
      if (task.done) {
        title.classList.add('done');
      }

      const speakButton = document.createElement('button');
      speakButton.type = 'button';
      speakButton.className = 'journal-task-speak';
      speakButton.textContent = '🔊';
      speakButton.title = 'Прослушать фразу';
      speakButton.disabled = !task.expected;
      speakButton.addEventListener('click', () => {
        if (task.expected) {
          speak(task.expected, getLang());
        }
      });

      item.append(status, title, speakButton);
      list.append(item);
    }
  };

  const open = (): void => {
    render();
    overlay.hidden = false;
  };

  const close = (): void => {
    overlay.hidden = true;
  };

  const toggle = (): void => {
    if (overlay.hidden) {
      open();
    } else {
      close();
    }
  };

  closeButton.addEventListener('click', close);
  clearCompletedButton.addEventListener('click', () => {
    const activeTasks = getTasks().filter((task) => !task.done);
    setTasks(activeTasks);
    render();
  });

  return { open, close, toggle, render };
}
