import { writeLog } from '../logging';

export type DayPeriod = 'morning' | 'day' | 'evening' | 'night';

export type GameTime = {
  dayIndex: number;
  minutesOfDay: number;
  period: DayPeriod;
};

const TIME_KEY = 'desertBoy.time';
const MINUTES_IN_DAY = 24 * 60;
export const DAY_LENGTH_MS = 12 * 60 * 1000;

function normalizeMinutes(minutesOfDay: number): number {
  const wrapped = minutesOfDay % MINUTES_IN_DAY;
  return wrapped >= 0 ? wrapped : wrapped + MINUTES_IN_DAY;
}

export function getPeriod(minutesOfDay: number): DayPeriod {
  const minutes = normalizeMinutes(minutesOfDay);

  if (minutes >= 5 * 60 && minutes < 12 * 60) {
    return 'morning';
  }

  if (minutes >= 12 * 60 && minutes < 17 * 60) {
    return 'day';
  }

  if (minutes >= 17 * 60 && minutes < 21 * 60) {
    return 'evening';
  }

  return 'night';
}

export function loadTime(): GameTime {
  const raw = localStorage.getItem(TIME_KEY);

  if (!raw) {
    const initialMinutes = 8 * 60;
    return {
      dayIndex: 1,
      minutesOfDay: initialMinutes,
      period: getPeriod(initialMinutes)
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GameTime>;
    const dayIndex = typeof parsed.dayIndex === 'number' && parsed.dayIndex >= 1 ? Math.floor(parsed.dayIndex) : 1;
    const minutesOfDay = typeof parsed.minutesOfDay === 'number' ? normalizeMinutes(parsed.minutesOfDay) : 8 * 60;

    return {
      dayIndex,
      minutesOfDay,
      period: getPeriod(minutesOfDay)
    };
  } catch {
    const initialMinutes = 8 * 60;
    return {
      dayIndex: 1,
      minutesOfDay: initialMinutes,
      period: getPeriod(initialMinutes)
    };
  }
}

export function saveTime(time: GameTime): void {
  localStorage.setItem(TIME_KEY, JSON.stringify(time));
}

export function tickTime(time: GameTime, deltaMs: number): GameTime {
  if (deltaMs <= 0) {
    return time;
  }

  const minuteDelta = (deltaMs / DAY_LENGTH_MS) * MINUTES_IN_DAY;
  const totalMinutes = time.minutesOfDay + minuteDelta;
  const daysPassed = Math.floor(totalMinutes / MINUTES_IN_DAY);
  const minutesOfDay = normalizeMinutes(totalMinutes);
  const period = getPeriod(minutesOfDay);
  const next = {
    dayIndex: time.dayIndex + daysPassed,
    minutesOfDay,
    period
  };

  if (period !== time.period) {
    writeLog('INFO', `Period changed: ${period}`);
  }

  return next;
}
