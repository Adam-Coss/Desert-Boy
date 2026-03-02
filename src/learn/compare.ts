const PUNCTUATION_REGEX = /[\p{P}\p{S}]/gu;

export function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(PUNCTUATION_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isMatch(expected: string, recognized: string): boolean {
  return normalize(expected) === normalize(recognized);
}
