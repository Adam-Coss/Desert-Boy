import { getLanguageByCode, LearningLanguage } from '../learn/languages';

const LEARNING_LANGUAGE_KEY = 'desertBoy.learningLang';

export interface AppSettings {
  learningLanguage?: LearningLanguage;
}

export function getLearningLanguage(): LearningLanguage | undefined {
  const raw = localStorage.getItem(LEARNING_LANGUAGE_KEY);
  if (!raw) {
    return undefined;
  }

  return getLanguageByCode(raw);
}

export function setLearningLanguage(language: LearningLanguage): void {
  localStorage.setItem(LEARNING_LANGUAGE_KEY, language.bcp47);
}

export function getSettings(): AppSettings {
  return {
    learningLanguage: getLearningLanguage()
  };
}
