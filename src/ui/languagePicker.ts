import { LEARNING_LANGUAGES, LearningLanguage } from '../learn/languages';

export interface LanguagePickerOptions {
  onSelect: (language: LearningLanguage) => void | Promise<void>;
}

export interface LanguagePicker {
  open: () => void;
  close: () => void;
  element: HTMLDivElement;
}

export function createLanguagePicker(parent: HTMLElement, options: LanguagePickerOptions): LanguagePicker {
  const overlay = document.createElement('div');
  overlay.className = 'language-picker-overlay';
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');

  const panel = document.createElement('section');
  panel.className = 'language-picker-panel';

  const title = document.createElement('h2');
  title.className = 'language-picker-title';
  title.textContent = 'Выберите язык для изучения';

  const grid = document.createElement('div');
  grid.className = 'language-picker-grid';

  for (const language of LEARNING_LANGUAGES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'language-picker-button';
    button.textContent = language.label;
    button.addEventListener('click', () => {
      options.onSelect(language);
    });
    grid.append(button);
  }

  panel.append(title, grid);
  overlay.append(panel);
  parent.append(overlay);

  return {
    open: () => {
      overlay.hidden = false;
      overlay.setAttribute('aria-hidden', 'false');
    },
    close: () => {
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
    },
    element: overlay
  };
}
