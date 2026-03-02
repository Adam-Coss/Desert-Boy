export type ShopFlowStep = {
  id: string;
  npc: string;
  expected: string;
};

export function getShopFlow(langBcp47: string): { steps: ShopFlowStep[] } {
  const base = langBcp47.split('-')[0]?.toLowerCase() ?? 'en';

  const byLang: Record<string, { steps: ShopFlowStep[] }> = {
    en: {
      steps: [
        { id: 'shop.excuse_me', npc: 'Hello! What would you like?', expected: 'Excuse me' },
        { id: 'shop.do_you_have_cat_food', npc: 'Sure. What do you need?', expected: 'Do you have cat food?' },
        { id: 'shop.no_thanks', npc: 'Anything else?', expected: 'No, thank you' }
      ]
    },
    ru: {
      steps: [
        { id: 'shop.excuse_me', npc: 'Здравствуйте! Что вам нужно?', expected: 'Извините' },
        { id: 'shop.do_you_have_cat_food', npc: 'Конечно. Что вам нужно?', expected: 'У вас есть корм для кошки?' },
        { id: 'shop.no_thanks', npc: 'Что-нибудь ещё?', expected: 'Нет, спасибо' }
      ]
    },
    fr: {
      steps: [
        { id: 'shop.excuse_me', npc: 'Bonjour ! Que voulez-vous ?', expected: 'Excusez-moi' },
        { id: 'shop.do_you_have_cat_food', npc: 'Oui. De quoi avez-vous besoin ?', expected: 'Avez-vous de la nourriture pour chat ?' },
        { id: 'shop.no_thanks', npc: 'Autre chose ?', expected: 'Non, merci' }
      ]
    },
    de: {
      steps: [
        { id: 'shop.excuse_me', npc: 'Hallo! Was möchten Sie?', expected: 'Entschuldigung' },
        { id: 'shop.do_you_have_cat_food', npc: 'Klar. Was brauchen Sie?', expected: 'Haben Sie Katzenfutter?' },
        { id: 'shop.no_thanks', npc: 'Sonst noch etwas?', expected: 'Nein, danke' }
      ]
    },
    ar: {
      steps: [
        { id: 'shop.excuse_me', npc: 'مرحباً! ماذا تريد؟', expected: 'عفواً' },
        { id: 'shop.do_you_have_cat_food', npc: 'أكيد. ماذا تحتاج؟', expected: 'هل لديكم طعام للقطط؟' },
        { id: 'shop.no_thanks', npc: 'أي شيء آخر؟', expected: 'لا، شكراً' }
      ]
    },
    zh: {
      steps: [
        { id: 'shop.excuse_me', npc: '你好！你想要什么？', expected: '打扰一下' },
        { id: 'shop.do_you_have_cat_food', npc: '好的。你需要什么？', expected: '你们有猫粮吗？' },
        { id: 'shop.no_thanks', npc: '还需要别的吗？', expected: '不用了，谢谢' }
      ]
    },
    ja: {
      steps: [
        { id: 'shop.excuse_me', npc: 'こんにちは！ご用件は？', expected: 'すみません' },
        { id: 'shop.do_you_have_cat_food', npc: 'はい。何が必要ですか？', expected: '猫の餌はありますか？' },
        { id: 'shop.no_thanks', npc: '他に何かありますか？', expected: 'いいえ、結構です' }
      ]
    },
    ko: {
      steps: [
        { id: 'shop.excuse_me', npc: '안녕하세요! 무엇을 원하세요?', expected: '실례합니다' },
        { id: 'shop.do_you_have_cat_food', npc: '네. 무엇이 필요하세요?', expected: '고양이 사료 있나요?' },
        { id: 'shop.no_thanks', npc: '또 필요한 게 있나요?', expected: '아니요, 괜찮아요' }
      ]
    }
  };

  return byLang[base] ?? byLang.en;
}
