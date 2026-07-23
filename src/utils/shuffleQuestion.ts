import { shuffle } from './shuffle';
import { parseAnswerSet, joinAnswerSet } from './answerSet';
import type { Question } from '../types/quiz';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Stable, collision-free display label for the i-th alternative. */
export function labelFor(i: number): string {
  return i < LETTERS.length ? LETTERS[i] : `#${i + 1}`;
}

/**
 * Shuffle a question's alternatives and relabel them A, B, C… in the new
 * order. Each alternative keeps its `originalId` so a played answer can be
 * mapped back to the original id space (see toOriginalAnswer). correctAnswer
 * is remapped to the new labels — works for single and multiple_answer.
 */
export function shuffleAlternatives(question: Question): Question {
  if (question.type === 'true_false') return question;

  const shuffled = shuffle(question.alternatives);
  const correctSet = new Set(parseAnswerSet(question.correctAnswer));
  const newCorrect: string[] = [];
  const relabeled = shuffled.map((alt, i) => {
    const newId = labelFor(i);
    if (correctSet.has(alt.id)) newCorrect.push(newId);
    return { ...alt, id: newId, originalId: alt.originalId ?? alt.id };
  });

  return { ...question, alternatives: relabeled, correctAnswer: joinAnswerSet(newCorrect) };
}

/**
 * Translate a stored answer value from the (possibly shuffled) display id
 * space back to the original alternative ids, so saved results always compare
 * against the original quiz. A no-op when the question was not shuffled.
 */
export function toOriginalAnswer(question: Question, answerValue: string): string {
  const map = new Map(question.alternatives.map((a) => [a.id, a.originalId ?? a.id]));
  return joinAnswerSet(parseAnswerSet(answerValue).map((id) => map.get(id) ?? id));
}
