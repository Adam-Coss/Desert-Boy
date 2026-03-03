export function getFeedCatPhrase(langBcp47: string): { id: string; expected: string } {
  const base = langBcp47.split('-')[0]?.toLowerCase() ?? 'en';

  const byLang: Record<string, string> = {
    en: 'Here you go',
    ru: 'Вот, кушай',
    fr: 'Tiens, mange',
    de: 'Hier, bitte',
    ar: 'تفضل، كُل',
    zh: '给你，吃吧',
    ja: 'はい、どうぞ',
    ko: '자, 먹어'
  };

  return {
    id: 'cat.feed_here_you_go',
    expected: byLang[base] ?? byLang.en
  };
}
