import type { DayPeriod } from '../state/time';

export type ShopFlowStep = {
  id: string;
  npc: string;
  expected: string;
};

type GreetingMap = Record<DayPeriod, string>;

function getGreetingExpected(base: string, period: DayPeriod): string {
  const byLang: Record<string, GreetingMap> = {
    en: { morning: 'Good morning', day: 'Hello', evening: 'Good evening', night: 'Good night' },
    ru: { morning: 'Доброе утро', day: 'Добрый день', evening: 'Добрый вечер', night: 'Спокойной ночи' },
    fr: { morning: 'Bonjour', day: 'Bonjour', evening: 'Bonsoir', night: 'Bonne nuit' },
    de: { morning: 'Guten Morgen', day: 'Guten Tag', evening: 'Guten Abend', night: 'Gute Nacht' },
    ar: { morning: 'صباح الخير', day: 'مرحباً', evening: 'مساء الخير', night: 'تصبح على خير' },
    zh: { morning: '早上好', day: '你好', evening: '晚上好', night: '晚安' },
    ja: { morning: 'おはようございます', day: 'こんにちは', evening: 'こんばんは', night: 'おやすみなさい' },
    ko: { morning: '좋은 아침입니다', day: '안녕하세요', evening: '좋은 저녁입니다', night: '안녕히 주무세요' }
  };

  return (byLang[base] ?? byLang.en)[period];
}

function getGreetingNpc(base: string): string {
  const byLang: Record<string, string> = {
    en: 'Please greet me for this time of day.',
    ru: 'Поприветствуйте меня по времени суток.',
    fr: 'Saluez-moi selon le moment de la journée.',
    de: 'Begrüßen Sie mich passend zur Tageszeit.',
    ar: 'حيّني حسب وقت اليوم.',
    zh: '请根据一天中的时间向我问好。',
    ja: '時間帯に合わせて挨拶してください。',
    ko: '시간대에 맞게 인사해 주세요.'
  };

  return byLang[base] ?? byLang.en;
}

export function getShopFlow(langBcp47: string, period: DayPeriod): { steps: ShopFlowStep[] } {
  const base = langBcp47.split('-')[0]?.toLowerCase() ?? 'en';

  const byLang: Record<string, { steps: ShopFlowStep[] }> = {
    en: {
      steps: [
        { id: 'core.greeting_time', npc: getGreetingNpc(base), expected: getGreetingExpected(base, period) },
        { id: 'shop.do_you_have_cat_food', npc: 'Sure. What do you need?', expected: 'Do you have cat food?' },
        { id: 'shop.no_thanks', npc: 'Anything else?', expected: 'No, thank you' }
      ]
    },
    ru: {
      steps: [
        { id: 'core.greeting_time', npc: getGreetingNpc(base), expected: getGreetingExpected(base, period) },
        { id: 'shop.do_you_have_cat_food', npc: 'Конечно. Что вам нужно?', expected: 'У вас есть корм для кошки?' },
        { id: 'shop.no_thanks', npc: 'Что-нибудь ещё?', expected: 'Нет, спасибо' }
      ]
    },
    fr: {
      steps: [
        { id: 'core.greeting_time', npc: getGreetingNpc(base), expected: getGreetingExpected(base, period) },
        { id: 'shop.do_you_have_cat_food', npc: 'Oui. De quoi avez-vous besoin ?', expected: 'Avez-vous de la nourriture pour chat ?' },
        { id: 'shop.no_thanks', npc: 'Autre chose ?', expected: 'Non, merci' }
      ]
    },
    de: {
      steps: [
        { id: 'core.greeting_time', npc: getGreetingNpc(base), expected: getGreetingExpected(base, period) },
        { id: 'shop.do_you_have_cat_food', npc: 'Klar. Was brauchen Sie?', expected: 'Haben Sie Katzenfutter?' },
        { id: 'shop.no_thanks', npc: 'Sonst noch etwas?', expected: 'Nein, danke' }
      ]
    },
    ar: {
      steps: [
        { id: 'core.greeting_time', npc: getGreetingNpc(base), expected: getGreetingExpected(base, period) },
        { id: 'shop.do_you_have_cat_food', npc: 'أكيد. ماذا تحتاج؟', expected: 'هل لديكم طعام للقطط؟' },
        { id: 'shop.no_thanks', npc: 'أي شيء آخر؟', expected: 'لا، شكراً' }
      ]
    },
    zh: {
      steps: [
        { id: 'core.greeting_time', npc: getGreetingNpc(base), expected: getGreetingExpected(base, period) },
        { id: 'shop.do_you_have_cat_food', npc: '好的。你需要什么？', expected: '你们有猫粮吗？' },
        { id: 'shop.no_thanks', npc: '还需要别的吗？', expected: '不用了，谢谢' }
      ]
    },
    ja: {
      steps: [
        { id: 'core.greeting_time', npc: getGreetingNpc(base), expected: getGreetingExpected(base, period) },
        { id: 'shop.do_you_have_cat_food', npc: 'はい。何が必要ですか？', expected: '猫の餌はありますか？' },
        { id: 'shop.no_thanks', npc: '他に何かありますか？', expected: 'いいえ、結構です' }
      ]
    },
    ko: {
      steps: [
        { id: 'core.greeting_time', npc: getGreetingNpc(base), expected: getGreetingExpected(base, period) },
        { id: 'shop.do_you_have_cat_food', npc: '네. 무엇이 필요하세요?', expected: '고양이 사료 있나요?' },
        { id: 'shop.no_thanks', npc: '또 필요한 게 있나요?', expected: '아니요, 괜찮아요' }
      ]
    }
  };

  return byLang[base] ?? byLang.en;
}
