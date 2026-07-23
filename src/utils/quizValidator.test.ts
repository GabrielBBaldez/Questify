import { describe, it, expect } from 'vitest';
import { validateQuiz } from './quizValidator';

const validQuestion = {
  type: 'multiple_choice',
  text: 'What?',
  alternatives: [
    { id: 'A', text: 'a' },
    { id: 'B', text: 'b' },
  ],
  correctAnswer: 'A',
};

function quiz(overrides: Record<string, unknown> = {}) {
  return { title: 'T', questions: [validQuestion], ...overrides };
}

describe('validateQuiz', () => {
  it('accepts a valid quiz and fills defaults', () => {
    const r = validateQuiz(quiz());
    expect(r.valid).toBe(true);
    expect(r.quiz?.id).toBeTruthy();
    expect(r.quiz?.subject).toBe('Outro');
    expect(r.quiz?.createdAt).toBeTruthy();
  });

  it('rejects a non-object', () => {
    expect(validateQuiz(null).valid).toBe(false);
    expect(validateQuiz('nope').valid).toBe(false);
  });

  it('requires a title', () => {
    const r = validateQuiz(quiz({ title: '' }));
    expect(r.valid).toBe(false);
    expect(r.errors.join()).toMatch(/[Tt]ítulo/);
  });

  it('requires at least one question', () => {
    expect(validateQuiz(quiz({ questions: [] })).valid).toBe(false);
  });

  it('requires at least 2 alternatives', () => {
    const r = validateQuiz(quiz({ questions: [{ ...validQuestion, alternatives: [{ id: 'A', text: 'a' }] }] }));
    expect(r.valid).toBe(false);
  });

  it('rejects an invalid question type', () => {
    const r = validateQuiz(quiz({ questions: [{ ...validQuestion, type: 'bogus' }] }));
    expect(r.valid).toBe(false);
  });

  it('rejects correctAnswer that references no alternative', () => {
    const r = validateQuiz(quiz({ questions: [{ ...validQuestion, correctAnswer: 'X' }] }));
    expect(r.valid).toBe(false);
    expect(r.errors.join()).toMatch(/X/);
  });

  it('accepts a multiple_answer question with a comma-joined answer', () => {
    const r = validateQuiz(
      quiz({
        questions: [
          {
            type: 'multiple_answer',
            text: 'pick two',
            alternatives: [
              { id: 'A', text: 'a' },
              { id: 'B', text: 'b' },
              { id: 'C', text: 'c' },
            ],
            correctAnswer: 'A,C',
          },
        ],
      }),
    );
    expect(r.valid).toBe(true);
    expect(r.quiz?.questions[0].type).toBe('multiple_answer');
  });

  it('requires assertions for an assertion question', () => {
    const r = validateQuiz(
      quiz({ questions: [{ ...validQuestion, type: 'assertion', correctAnswer: 'A' }] }),
    );
    expect(r.valid).toBe(false);
  });
});
