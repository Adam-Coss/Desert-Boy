export type SpeechEvents = {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
  onStart: () => void;
  onEnd: () => void;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0?: { transcript?: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
  message?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor {
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  const SR = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
  if (!SR) {
    throw new Error('SpeechRecognition is not available');
  }
  return SR;
}

export function createRecognizer(lang: string, events: SpeechEvents): { start: () => void; stop: () => void } {
  const SR = getSpeechRecognitionCtor();
  const recognizer = new SR();

  recognizer.lang = lang;
  recognizer.continuous = false;
  recognizer.interimResults = true;
  recognizer.maxAlternatives = 1;

  recognizer.onresult = (event) => {
    let interimText = '';

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const transcript = result[0]?.transcript?.trim() ?? '';
      if (!transcript) continue;

      if (result.isFinal) {
        events.onFinal(transcript);
      } else {
        interimText = `${interimText} ${transcript}`.trim();
      }
    }

    if (interimText) {
      events.onInterim(interimText);
    }
  };

  recognizer.onerror = (event) => {
    const code = event.error ?? 'unknown';
    const message = event.message?.trim();
    events.onError(message ? `${code}: ${message}` : code);
  };

  recognizer.onstart = () => {
    events.onStart();
  };

  recognizer.onend = () => {
    events.onEnd();
  };

  return {
    start: () => recognizer.start(),
    stop: () => recognizer.stop()
  };
}
