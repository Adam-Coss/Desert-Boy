import { getFeedCatPhrase } from '../learn/catPhrases';
import { getDemoPhrase } from '../learn/demoPhrases';
import { getShopFlow } from '../learn/shopPhrases';

export type Task = {
  id: string;
  title: string;
  phraseKey?: string;
  expected?: string;
  done: boolean;
  createdAt: number;
  repeat?: 'daily' | null;
  dayTag?: number;
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
      createdAt: Date.now(),
      repeat: null
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
      createdAt: Date.now(),
      repeat: null
    });
  }

  if (!nextTasks.some((task) => task.id === 'shop.say_no_thanks')) {
    nextTasks.push({
      id: 'shop.say_no_thanks',
      title: 'Сказать «нет, спасибо» в магазине',
      expected: noThanksStep?.expected,
      done: false,
      createdAt: Date.now(),
      repeat: null
    });
  }

  return nextTasks;
}

export function ensureDailyCatTask(langBcp47: string, dayIndex: number, tasks: Task[]): Task[] {
  const phrase = getFeedCatPhrase(langBcp47);
  const nextTasks = [...tasks];
  const idx = nextTasks.findIndex((task) => task.id === 'cat.feed');

  if (idx === -1) {
    nextTasks.push({
      id: 'cat.feed',
      title: 'Покормить кошку',
      phraseKey: phrase.id,
      expected: phrase.expected,
      done: false,
      createdAt: Date.now(),
      repeat: 'daily',
      dayTag: dayIndex
    });
    return nextTasks;
  }

  const current = nextTasks[idx];
  const next: Task = {
    ...current,
    title: 'Покормить кошку',
    phraseKey: phrase.id,
    expected: phrase.expected,
    repeat: 'daily',
    dayTag: dayIndex,
    done: current.dayTag === dayIndex ? current.done : false
  };

  nextTasks[idx] = next;
  return nextTasks;
}

export const ensureDailyCatTasks = ensureDailyCatTask;
