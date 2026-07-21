import { useNavigate } from 'react-router';
import { Play, Pencil, Download, Trash2, FileText, Calendar, BookOpen, RotateCcw } from 'lucide-react';
import type { Quiz } from '../../types/quiz';
import { useResultsStorage } from '../../hooks/useResultsStorage';
import { SKIPPED_ANSWER } from '../../constants/quiz';
import { answersMatch } from '../../utils/answerSet';
import { exportQuizAsJson } from '../../utils/jsonExport';
import styles from './QuizCard.module.css';

interface QuizCardProps {
  quiz: Quiz;
  onDelete: (id: string) => void;
}

export function QuizCard({ quiz, onDelete }: QuizCardProps) {
  const navigate = useNavigate();
  const { getResultsForQuiz } = useResultsStorage();

  const questionCount = quiz.questions.length;
  const date = new Date(quiz.createdAt).toLocaleDateString('pt-BR');

  // Count unique wrong questions across all attempts
  const results = getResultsForQuiz(quiz.id);
  const wrongQuestionIds = new Set<string>();
  results.forEach((r) => {
    quiz.questions.forEach((q) => {
      const answer = r.answers[q.id];
      if (answer && answer !== SKIPPED_ANSWER && !answersMatch(answer, q.correctAnswer)) {
        wrongQuestionIds.add(q.id);
      }
    });
  });
  const errorCount = wrongQuestionIds.size;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{quiz.title}</h3>
        <span className={styles.subject}>{quiz.subject}</span>
      </div>

      {quiz.description && (
        <p className={styles.description}>{quiz.description}</p>
      )}

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <FileText size={14} />
          {questionCount} {questionCount === 1 ? 'questão' : 'questões'}
        </span>
        <span className={styles.metaItem}>
          <Calendar size={14} />
          {date}
        </span>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${styles.playBtn}`}
          onClick={() => navigate(`/play/${quiz.id}`)}
        >
          <Play size={16} />
          Treinar
        </button>
        <button
          className={`${styles.actionBtn} ${styles.editBtn}`}
          onClick={() => navigate(`/consult/${quiz.id}`)}
        >
          <BookOpen size={16} />
          Consultar
        </button>
        <button
          className={`${styles.actionBtn} ${styles.editBtn}`}
          onClick={() => navigate(`/edit/${quiz.id}`)}
        >
          <Pencil size={16} />
          Editar
        </button>
        {errorCount > 0 && (
          <button
            className={`${styles.actionBtn} ${styles.errorBtn}`}
            onClick={() => navigate(`/play/${quiz.id}?errorReview=true`)}
          >
            <RotateCcw size={16} />
            Revisar Erros ({errorCount})
          </button>
        )}
        <button
          className={`${styles.actionBtn} ${styles.exportBtn}`}
          onClick={() => exportQuizAsJson(quiz)}
        >
          <Download size={16} />
          Exportar
        </button>
        <button
          className={`${styles.actionBtn} ${styles.deleteBtn}`}
          onClick={() => onDelete(quiz.id)}
        >
          <Trash2 size={16} />
          Excluir
        </button>
      </div>
    </div>
  );
}
