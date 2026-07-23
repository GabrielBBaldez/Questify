import { describe, it, expect } from 'vitest';
import { parseAnswerSet, joinAnswerSet, answersMatch } from './answerSet';

describe('parseAnswerSet', () => {
  it('returns [] for empty/null/undefined', () => {
    expect(parseAnswerSet('')).toEqual([]);
    expect(parseAnswerSet(null)).toEqual([]);
    expect(parseAnswerSet(undefined)).toEqual([]);
  });

  it('splits a single id', () => {
    expect(parseAnswerSet('A')).toEqual(['A']);
  });

  it('splits and trims a comma-joined set', () => {
    expect(parseAnswerSet('A, C ,B')).toEqual(['A', 'C', 'B']);
  });
});

describe('joinAnswerSet', () => {
  it('sorts, de-duplicates and comma-joins', () => {
    expect(joinAnswerSet(['C', 'A', 'C', 'B'])).toBe('A,B,C');
  });

  it('returns empty string for no ids', () => {
    expect(joinAnswerSet([])).toBe('');
  });
});

describe('answersMatch', () => {
  it('matches a single correct answer', () => {
    expect(answersMatch('A', 'A')).toBe(true);
    expect(answersMatch('B', 'A')).toBe(false);
  });

  it('is order-independent for multiple answers', () => {
    expect(answersMatch('C,A', 'A,C')).toBe(true);
  });

  it('is all-or-nothing for multiple answers', () => {
    expect(answersMatch('A', 'A,C')).toBe(false);
    expect(answersMatch('A,B', 'A,C')).toBe(false);
    expect(answersMatch('A,B,C', 'A,C')).toBe(false);
  });

  it('ignores duplicates and whitespace', () => {
    expect(answersMatch('A, C, A', 'C,A')).toBe(true);
  });

  it('treats empty/null user answer as no match', () => {
    expect(answersMatch('', 'A')).toBe(false);
    expect(answersMatch(null, 'A')).toBe(false);
    expect(answersMatch(undefined, 'A,C')).toBe(false);
  });
});
