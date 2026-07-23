import { useState } from 'react';
import { Link } from 'react-router';
import { PlusCircle, FlaskConical } from 'lucide-react';
import { useQuizStorage } from '../../hooks/useQuizStorage';
import { useFavoritesStorage } from '../../hooks/useFavoritesStorage';
import { QuizCard } from '../../components/QuizCard/QuizCard';
import { ImportButton } from '../../components/ImportExport/ImportButton';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { deleteResultsForQuiz } from '../../services/firestoreSync';
import { validateQuiz } from '../../utils/quizValidator';
import { generateId } from '../../utils/generateId';
import { sampleQuizData } from '../../data/sampleQuiz';
import type { Quiz } from '../../types/quiz';
import styles from './HomePage.module.css';

export function HomePage() {
  const { quizzes, addQuiz, deleteQuiz } = useQuizStorage();
  const { clearFavoritesForQuiz } = useFavoritesStorage();
  const { user } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleImport = (imported: Quiz[]) => {
    // Avoid id collisions (re-importing an exported quiz, or two files that
    // share an id): a clash would break React keys and make delete remove both
    // copies. Dedup against existing quizzes AND within this batch.
    const usedIds = new Set(quizzes.map((q) => q.id));
    imported.forEach((quiz) => {
      const finalQuiz = usedIds.has(quiz.id) ? { ...quiz, id: generateId() } : quiz;
      usedIds.add(finalQuiz.id);
      addQuiz(finalQuiz);
    });
  };

  const handleLoadSample = () => {
    const result = validateQuiz(sampleQuizData);
    if (result.valid && result.quiz) {
      addQuiz(result.quiz);
    }
  };

  const hasSample = quizzes.some((q) => q.title === sampleQuizData.title);

  const handleDelete = () => {
    if (deleteId) {
      deleteQuiz(deleteId);
      clearFavoritesForQuiz(deleteId);
      if (user) {
        deleteResultsForQuiz(user.uid, deleteId).catch((err) => {
          console.warn('[Questify] Falha ao excluir resultados do quiz na nuvem:', err);
        });
      }
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Meus Bancos de Questões</h1>
        <div className={styles.headerActions}>
          {!hasSample && (
            <button className={styles.sampleBtn} onClick={handleLoadSample}>
              <FlaskConical size={18} />
              Banco Teste
            </button>
          )}
          <ImportButton onImport={handleImport} />
          <Link to="/create" className={styles.createBtn}>
            <PlusCircle size={18} />
            Criar Novo
          </Link>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState
          title="Nenhum banco de questões"
          description="Crie um novo banco de questões ou importe um arquivo JSON para começar a treinar."
        />
      ) : (
        <div className={styles.grid}>
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Excluir banco"
          message="Tem certeza que deseja excluir este banco de questões? Essa ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
