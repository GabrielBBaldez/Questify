import type { Quiz, Question } from '../types/quiz';
import { generateId } from './generateId';
import { parseAnswerSet } from './answerSet';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  quiz?: Quiz;
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function validateQuestion(q: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Questão ${index + 1}`;

  if (!isObject(q)) {
    errors.push(`${prefix}: deve ser um objeto`);
    return errors;
  }

  if (!q.text || typeof q.text !== 'string') {
    errors.push(`${prefix}: texto obrigatório`);
  }

  const type = q.type || 'multiple_choice';
  if (!['multiple_choice', 'true_false', 'assertion', 'multiple_answer'].includes(type as string)) {
    errors.push(`${prefix}: tipo inválido "${type}"`);
  }

  if (!Array.isArray(q.alternatives) || q.alternatives.length < 2) {
    errors.push(`${prefix}: precisa de pelo menos 2 alternativas`);
  } else {
    for (let i = 0; i < q.alternatives.length; i++) {
      const alt = q.alternatives[i];
      if (!isObject(alt) || !alt.id || !alt.text) {
        errors.push(`${prefix}, alternativa ${i + 1}: precisa de id e texto`);
      }
    }
  }

  if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
    errors.push(`${prefix}: resposta correta obrigatória`);
  } else if (Array.isArray(q.alternatives)) {
    // Every id referenced by correctAnswer must exist among the alternatives,
    // otherwise the question can never be scored correct.
    const altIds = new Set(
      q.alternatives.filter(isObject).map((alt) => alt.id),
    );
    const missing = parseAnswerSet(q.correctAnswer as string).filter((id) => !altIds.has(id));
    if (missing.length > 0) {
      errors.push(`${prefix}: resposta correta "${missing.join(', ')}" não corresponde a nenhuma alternativa`);
    }
  }

  if (type === 'assertion') {
    if (!Array.isArray(q.assertions) || q.assertions.length === 0) {
      errors.push(`${prefix}: questão de assertiva precisa de assertivas`);
    }
  }

  return errors;
}

export function validateQuiz(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isObject(data)) {
    return { valid: false, errors: ['O arquivo não contém um objeto JSON válido'] };
  }

  if (!data.title || typeof data.title !== 'string') {
    errors.push('Título obrigatório');
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push('Precisa ter pelo menos 1 questão');
    return { valid: false, errors };
  }

  for (let i = 0; i < data.questions.length; i++) {
    errors.push(...validateQuestion(data.questions[i], i));
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const quiz: Quiz = {
    id: (data.id as string) || generateId(),
    title: data.title as string,
    description: (data.description as string) || '',
    subject: (data.subject as string) || 'Outro',
    createdAt: (data.createdAt as string) || new Date().toISOString(),
    questions: (data.questions as unknown[]).map((q) => {
      const qObj = q as Record<string, unknown>;
      const type = (qObj.type as string) || 'multiple_choice';
      const base = {
        id: (qObj.id as string) || generateId(),
        type: type as Question['type'],
        text: qObj.text as string,
        image: (qObj.image as string) || null,
        alternatives: qObj.alternatives as Question['alternatives'],
        correctAnswer: qObj.correctAnswer as string,
        explanation: (qObj.explanation as string) || undefined,
        tags: Array.isArray(qObj.tags) ? (qObj.tags as string[]) : undefined,
      };
      if (type === 'assertion') {
        return { ...base, type: 'assertion' as const, assertions: qObj.assertions as { id: string; text: string; correct: boolean }[] };
      }
      if (type === 'true_false') {
        return { ...base, type: 'true_false' as const };
      }
      if (type === 'multiple_answer') {
        return { ...base, type: 'multiple_answer' as const };
      }
      return { ...base, type: 'multiple_choice' as const };
    }),
  };

  return { valid: true, errors: [], quiz };
}
