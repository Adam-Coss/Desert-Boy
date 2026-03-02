import { getDemoPhrase } from '../learn/demoPhrases';

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
