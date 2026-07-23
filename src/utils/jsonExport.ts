import type { Quiz } from '../types/quiz';

export function exportQuizAsJson(quiz: Quiz): void {
  const dataStr = JSON.stringify(quiz, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const slug = quiz.title.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase();
  link.download = `${slug || `quiz-${quiz.id}`}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
