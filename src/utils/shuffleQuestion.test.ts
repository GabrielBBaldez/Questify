import { describe, it, expect } from 'vitest';
import { labelFor, shuffleAlternatives, toOriginalAnswer } from './shuffleQuestion';
import type { Question } from '../types/quiz';

function mcQuestion(): Question {
  return {
    id: 'q1',
    type: 'multiple_choice',
    text: 'q',
    alternatives: [
      { id: 'A', text: 'alpha' },
      { id: 'B', text: 'bravo' },
      { id: 'C', text: 'charlie' },
      { id: 'D', text: 'delta' },
    ],
    correctAnswer: 'C',
  };
}

describe('labelFor', () => {
  it('uses letters A..Z then a collision-free overflow label', () => {
    expect(labelFor(0)).toBe('A');
    expect(labelFor(25)).toBe('Z');
    expect(labelFor(26)).toBe('#27');
  });

  it('never produces a duplicate label for a large set', () => {
    const labels = Array.from({ length: 40 }, (_, i) => labelFor(i));
    expect(new Set(labels).size).toBe(40);
  });
});

describe('shuffleAlternatives', () => {
  it('keeps the correct answer pointing at the same alternative text', () => {
    const q = mcQuestion();
    const correctText = q.alternatives.find((a) => a.id === q.correctAnswer)!.text;

    for (let i = 0; i < 30; i++) {
      const s = shuffleAlternatives(mcQuestion());
      const nowCorrect = s.alternatives.find((a) => a.id === s.correctAnswer)!;
      expect(nowCorrect.text).toBe(correctText);
      expect(nowCorrect.originalId).toBe('C');
    }
  });

  it('remaps every id of a multiple_answer question', () => {
    const q: Question = { ...mcQuestion(), type: 'multiple_answer', correctAnswer: 'A,C' };
    const correctTexts = ['alpha', 'charlie'].sort();

    for (let i = 0; i < 30; i++) {
      const s = shuffleAlternatives({ ...q });
      const chosen = s.alternatives
        .filter((a) => s.correctAnswer.split(',').includes(a.id))
        .map((a) => a.text)
        .sort();
      expect(chosen).toEqual(correctTexts);
    }
  });

  it('leaves true_false questions untouched', () => {
    const tf: Question = {
      id: 'q',
      type: 'true_false',
      text: 't',
      alternatives: [
        { id: 'V', text: 'Verdadeiro' },
        { id: 'F', text: 'Falso' },
      ],
      correctAnswer: 'V',
    };
    expect(shuffleAlternatives(tf)).toBe(tf);
  });
});

describe('toOriginalAnswer', () => {
  it('translates a shuffled answer back to the original id space', () => {
    const shuffled = shuffleAlternatives(mcQuestion());
    // Pick the display id that now holds original alternative "A" (alpha)
    const displayIdForAlpha = shuffled.alternatives.find((a) => a.originalId === 'A')!.id;
    expect(toOriginalAnswer(shuffled, displayIdForAlpha)).toBe('A');
  });

  it('round-trips a multiple_answer selection', () => {
    const q: Question = { ...mcQuestion(), type: 'multiple_answer', correctAnswer: 'A,C' };
    const shuffled = shuffleAlternatives(q);
    // The user selecting the correct display ids should map back to "A,C"
    expect(toOriginalAnswer(shuffled, shuffled.correctAnswer)).toBe('A,C');
  });

  it('is a no-op when the question was not shuffled', () => {
    expect(toOriginalAnswer(mcQuestion(), 'C')).toBe('C');
  });
});
