export type LearningLanguageId =
  | 'arabic'
  | 'french'
  | 'german'
  | 'english'
  | 'chinese'
  | 'russian'
  | 'japanese'
  | 'korean';

export interface LearningLanguage {
  id: LearningLanguageId;
  label: string;
  bcp47: string;
}

export const LEARNING_LANGUAGES: LearningLanguage[] = [
  { id: 'arabic', label: 'Arabic', bcp47: 'ar' },
  { id: 'french', label: 'French', bcp47: 'fr-FR' },
  { id: 'german', label: 'German', bcp47: 'de-DE' },
  { id: 'english', label: 'English', bcp47: 'en-US' },
  { id: 'chinese', label: 'Chinese', bcp47: 'zh-CN' },
  { id: 'russian', label: 'Russian', bcp47: 'ru-RU' },
  { id: 'japanese', label: 'Japanese', bcp47: 'ja-JP' },
  { id: 'korean', label: 'Korean', bcp47: 'ko-KR' }
];

export function getLanguageByCode(code: string): LearningLanguage | undefined {
  return LEARNING_LANGUAGES.find((lang) => lang.bcp47 === code);
}
