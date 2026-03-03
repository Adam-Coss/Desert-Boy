import { getDemoPhrase } from '../learn/demoPhrases';
import { getShopFlow } from '../learn/shopPhrases';

export type Task = {
  id: string;
  title: string;
  phraseKey?: string;
  expected?: string;
  done: boolean;
  createdAt: number;
};

export function getInitialTasks(langBcp47: string): Task[] {
  const demo = getDemoPhrase(langBcp47);
  return [
    {
      id: 'demo.term_phrase',
      title: 'Скажи фразу у терминала',
      phraseKey: demo.key,
      expected: demo.expected,
      done: false,
      createdAt: Date.now()
    }
  ];
}

export function ensureShopTasks(langBcp47: string, currentTasks: Task[]): Task[] {
  const shopFlow = getShopFlow(langBcp47, 'day');
  const buyStep = shopFlow.steps.find((step) => step.id === 'shop.do_you_have_cat_food');
  const noThanksStep = shopFlow.steps.find((step) => step.id === 'shop.no_thanks');

  const nextTasks = currentTasks.map((task) => {
    if (task.id === 'shop.buy_cat_food') {
      return { ...task, expected: buyStep?.expected };
    }

    if (task.id === 'shop.say_no_thanks') {
      return { ...task, expected: noThanksStep?.expected };
    }

    return task;
  });

  if (!nextTasks.some((task) => task.id === 'shop.buy_cat_food')) {
    nextTasks.push({
      id: 'shop.buy_cat_food',
      title: 'Купить корм для кошки',
      expected: buyStep?.expected,
      done: false,
      createdAt: Date.now()
    });
  }

  if (!nextTasks.some((task) => task.id === 'shop.say_no_thanks')) {
    nextTasks.push({
      id: 'shop.say_no_thanks',
      title: 'Сказать «нет, спасибо» в магазине',
      expected: noThanksStep?.expected,
      done: false,
      createdAt: Date.now()
    });
  }

  return nextTasks;
}
