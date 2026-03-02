import { writeLog } from '../logging';

export function speak(text: string, lang: string): void {
  if (!text.trim()) {
    return;
  }

  if (!('speechSynthesis' in window)) {
    writeLog('WARN', 'TTS unavailable: speechSynthesis not supported');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;

  const voices = window.speechSynthesis.getVoices();
  const langPrefix = lang.split('-')[0]?.toLowerCase() ?? '';
  const voice = voices.find((candidate) => candidate.lang.toLowerCase().startsWith(langPrefix));
  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  writeLog('INFO', `TTS speak: ${text}`);
}
