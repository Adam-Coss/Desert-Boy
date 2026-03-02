export type DemoPhrase = {
  key: string;
  expected: string;
  npcPrompt: string;
};

const DEFAULT_PHRASE: DemoPhrase = {
  key: 'english_no_thanks',
  expected: 'No, thank you',
  npcPrompt: 'Скажите:'
};

const DEMO_PHRASES: Record<string, DemoPhrase> = {
  en: { key: 'english_no_thanks', expected: 'No, thank you', npcPrompt: 'Скажите:' },
  ru: { key: 'russian_no_thanks', expected: 'Нет, спасибо', npcPrompt: 'Скажите:' },
  fr: { key: 'french_no_thanks', expected: 'Non, merci', npcPrompt: 'Скажите:' },
  de: { key: 'german_no_thanks', expected: 'Nein, danke', npcPrompt: 'Скажите:' },
  ar: { key: 'arabic_no_thanks', expected: 'لا، شكراً', npcPrompt: 'Скажите:' },
  zh: { key: 'chinese_no_thanks', expected: '不，谢谢', npcPrompt: 'Скажите:' },
  ja: { key: 'japanese_no_thanks', expected: 'いいえ、結構です', npcPrompt: 'Скажите:' },
  ko: { key: 'korean_no_thanks', expected: '아니요, 괜찮아요', npcPrompt: 'Скажите:' }
};

export function getDemoPhrase(langBcp47: string): DemoPhrase {
  const base = langBcp47.split('-')[0]?.toLowerCase() ?? '';
  return DEMO_PHRASES[base] ?? DEFAULT_PHRASE;
}
