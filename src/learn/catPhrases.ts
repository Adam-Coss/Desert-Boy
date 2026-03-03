export function getFeedCatPhrase(langBcp47: string): { id: string; expected: string } {
  const normalized = langBcp47.toLowerCase();

  const byCode: Record<string, string> = {
    'en-us': 'Here you go',
    'ru-ru': 'Вот, кушай',
    'fr-fr': 'Tiens',
    'de-de': 'Bitte sehr',
    ar: 'تفضل',
    'zh-cn': '给你',
    'ja-jp': 'どうぞ',
    'ko-kr': '여기요'
  };

  const base = normalized.split('-')[0] ?? 'en';

  return {
    id: 'cat.feed_here_you_go',
    expected: byCode[normalized] ?? byCode[base] ?? byCode['en-us']
  };
}
