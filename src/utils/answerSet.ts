/**
 * Helpers for answer comparison that work uniformly for single-answer
 * (multiple_choice, true_false, assertion) and multiple_answer questions.
 *
 * A multiple_answer question stores its correct answer as a sorted,
 * comma-joined list of alternative ids (e.g. "A,C"). The user's selection is
 * stored the same way, so equality-based scoring keeps working unchanged.
 * Single-answer questions have no comma, so every helper degrades to the
 * previous single-id behavior.
 */

export const MULTI_SEPARATOR = ',';

/** Split a stored answer value into its list of alternative ids. */
export function parseAnswerSet(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(MULTI_SEPARATOR)
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Normalize a list of ids into a sorted, de-duplicated, comma-joined string. */
export function joinAnswerSet(ids: string[]): string {
  return [...new Set(ids)].sort().join(MULTI_SEPARATOR);
}

/**
 * True when the user's answer matches the correct answer. Handles both single
 * and multiple answers (order-independent, all-or-nothing for multi).
 */
export function answersMatch(
  userAnswer: string | null | undefined,
  correctAnswer: string,
): boolean {
  const user = joinAnswerSet(parseAnswerSet(userAnswer));
  if (!user) return false;
  return user === joinAnswerSet(parseAnswerSet(correctAnswer));
}
