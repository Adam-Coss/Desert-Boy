import { writeLog } from '../logging';
import { createRecognizer } from '../speech/speechRecognition';

type SpeechRecognitionCtor = new () => unknown;

type GateState = 'idle' | 'listening' | 'success' | 'error';

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };

  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
}

function ensureOverlay(): HTMLDivElement {
  let overlay = document.querySelector<HTMLDivElement>('.stt-gate-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'stt-gate-overlay';
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <section class="stt-gate-panel" role="dialog" aria-modal="true" aria-live="polite">
        <h2 class="stt-gate-title"></h2>
        <p class="stt-gate-message"></p>
        <p class="stt-gate-transcript" hidden></p>
        <div class="stt-gate-actions"></div>
      </section>
    `;
    document.body.append(overlay);
  }
  return overlay;
}

function setOverlayVisible(overlay: HTMLElement, visible: boolean): void {
  overlay.hidden = !visible;
  overlay.setAttribute('aria-hidden', visible ? 'false' : 'true');
}

function renderActions(container: HTMLElement, actions: Array<{ label: string; onClick: () => void }>): void {
  container.innerHTML = '';
  for (const action of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.addEventListener('click', action.onClick);
    container.append(button);
  }
}

export function ensureSpeechRecognitionReady(getLang: () => string, updateHudSpoken: (t: string) => void): Promise<void> {
  const overlay = ensureOverlay();
  const title = overlay.querySelector<HTMLHeadingElement>('.stt-gate-title');
  const message = overlay.querySelector<HTMLParagraphElement>('.stt-gate-message');
  const transcript = overlay.querySelector<HTMLParagraphElement>('.stt-gate-transcript');
  const actions = overlay.querySelector<HTMLDivElement>('.stt-gate-actions');

  if (!title || !message || !transcript || !actions) {
    throw new Error('STT gate layout is invalid');
  }

  const SR = getSpeechRecognitionCtor();
  if (!SR) {
    writeLog('ERROR', 'SpeechRecognition not available');
    title.textContent = 'Распознавание речи недоступно';
    message.textContent = 'Ваш браузер не поддерживает распознавание речи. Играть нельзя.';
    transcript.hidden = true;
    renderActions(actions, [
      {
        label: 'Логи',
        onClick: () => {
          const logToggle = document.querySelector<HTMLButtonElement>('.log-toggle');
          logToggle?.click();
        }
      }
    ]);
    setOverlayVisible(overlay, true);
    return new Promise(() => {});
  }

  writeLog('INFO', 'SpeechRecognition available');
  setOverlayVisible(overlay, true);

  return new Promise<void>((resolve) => {
    let recognizer: ReturnType<typeof createRecognizer> | undefined;
    let state: GateState = 'idle';

    const showMicTest = (): void => {
      state = 'idle';
      title.textContent = 'Проверка микрофона';
      message.textContent = 'Нажмите «Проверить», скажите фразу и дождитесь подтверждения.';
      transcript.hidden = true;
      transcript.textContent = '';
      updateHudSpoken('…');
      renderActions(actions, [{ label: 'Проверить', onClick: startTest }]);
    };

    const showError = (errorText: string): void => {
      state = 'error';
      message.textContent = errorText;
      renderActions(actions, [{ label: 'Попробовать снова', onClick: showMicTest }]);
    };

    const showSuccess = (): void => {
      state = 'success';
      message.textContent = 'Распознавание работает ✅';
      renderActions(actions, [
        {
          label: 'Продолжить',
          onClick: () => {
            recognizer?.stop();
            setOverlayVisible(overlay, false);
            resolve();
          }
        }
      ]);
      writeLog('INFO', 'Speech recognition test success');
    };

    const startTest = (): void => {
      const lang = getLang();
      recognizer?.stop();
      writeLog('INFO', `Speech recognition test started (${lang})`);
      recognizer = createRecognizer(lang, {
        onStart: () => {
          state = 'listening';
          message.textContent = 'Слушаю...';
        },
        onInterim: (text) => {
          transcript.hidden = false;
          transcript.textContent = `Распознано: ${text}`;
          updateHudSpoken(text);
        },
        onFinal: (text) => {
          transcript.hidden = false;
          transcript.textContent = `Распознано: ${text}`;
          updateHudSpoken(text);
          writeLog('INFO', `Speech recognition final: ${text}`);
          showSuccess();
        },
        onError: (errorMessage) => {
          const code = errorMessage.split(':')[0];
          const humanReadable = code === 'not-allowed' || code === 'service-not-allowed'
            ? 'Нет доступа к микрофону'
            : `Ошибка распознавания: ${errorMessage}`;
          writeLog('ERROR', `Speech recognition error: ${errorMessage}`);
          showError(humanReadable);
        },
        onEnd: () => {
          if (state === 'listening') {
            showError('Распознавание завершилось без финального результата. Попробуйте снова.');
          }
        }
      });

      try {
        recognizer.start();
      } catch (error) {
        const messageText = error instanceof Error ? error.message : String(error);
        writeLog('ERROR', `Speech recognition start failed: ${messageText}`);
        showError(`Ошибка распознавания: ${messageText}`);
      }
    };

    showMicTest();
  });
}
