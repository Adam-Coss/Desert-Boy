import { getHud } from '../ui/hud';
import { createRecognizer } from './speechRecognition';

export async function listenOnce(lang: string, timeoutMs = 8000): Promise<{ finalText: string }> {
  const hud = getHud();

  return new Promise((resolve, reject) => {
    let done = false;
    let timeoutId: number | undefined;

    const recognizer = createRecognizer(lang, {
      onStart: () => undefined,
      onInterim: (text) => {
        hud.setRecognized(text);
      },
      onFinal: (text) => {
        if (done) return;
        done = true;
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        recognizer.stop();
        resolve({ finalText: text });
      },
      onError: (message) => {
        if (done) return;
        done = true;
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        recognizer.stop();
        reject(new Error(message));
      },
      onEnd: () => undefined
    });

    timeoutId = window.setTimeout(() => {
      if (done) return;
      done = true;
      recognizer.stop();
      reject(new Error('timeout'));
    }, timeoutMs);

    try {
      recognizer.start();
    } catch (error) {
      if (done) return;
      done = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
