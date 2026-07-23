import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { Search, Home, Check, X, Hash, Star } from 'lucide-react';
import { useQuizStorage } from '../../hooks/useQuizStorage';
import { useFavoritesStorage } from '../../hooks/useFavoritesStorage';
import type { AssertionQuestion } from '../../types/quiz';
import { parseAnswerSet } from '../../utils/answerSet';
import styles from './ConsultPage.module.css';

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Múltipla Escolha',
  true_false: 'V ou F',
  assertion: 'Assertivas',
  multiple_answer: 'Múltipla Resposta',
};

export function ConsultPage() {
  const { quizId } = useParams();
  const { getQuiz } = useQuizStorage();
  const { isFavorite, toggleFavorite, getFavoriteCount } = useFavoritesStorage();
  const [search, setSearch] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const quiz = getQuiz(quizId || '');

  const filteredQuestions = useMemo(() => {
    if (!quiz) return [];
    let questions = quiz.questions;

    if (showOnlyFavorites) {
      questions = questions.filter((q) => isFavorite(quiz.id, q.id));
    }

    if (!search.trim()) return questions;

    const term = search.toLowerCase();
    return questions.filter((q) => {
      if (q.text.toLowerCase().includes(term)) return true;
      if (q.explanation?.toLowerCase().includes(term)) return true;
      if (q.alternatives.some((a) => a.text.toLowerCase().includes(term))) return true;
      if (q.alternatives.some((a) => a.explanation?.toLowerCase().includes(term))) return true;
      if (q.tags?.some((t) => t.toLowerCase().includes(term))) return true;
      if (q.type === 'assertion') {
        if ((q as AssertionQuestion).assertions.some((a) => a.text.toLowerCase().includes(term))) return true;
      }
      return false;
    });
  }, [quiz, search, showOnlyFavorites, isFavorite]);

  if (!quiz) {
    return (
      <div className={styles.notFound}>
        <p>Banco de questões não encontrado.</p>
        <Link to="/" className={styles.backLink}>
          <Home size={18} />
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>{quiz.title}</h1>
        <p className={styles.subtitle}>Modo consulta - visualize questões, respostas e explicações</p>
      </div>

      <div className={styles.searchBar}>
        <Search size={18} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar por palavra-chave (ex: cardiologia, infarto, herança)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar questões"
        />
        <button
          className={`${styles.favFilterBtn} ${showOnlyFavorites ? styles.favFilterBtnActive : ''}`}
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          title={showOnlyFavorites ? 'Mostrar todas' : 'Mostrar só favoritas'}
        >
          <Star size={16} fill={showOnlyFavorites ? '#f5b942' : 'none'} />
          {getFavoriteCount(quiz.id) > 0 && (
            <span className={styles.favCount}>{getFavoriteCount(quiz.id)}</span>
          )}
        </button>
      </div>

      <p className={styles.resultCount}>
        {filteredQuestions.length} de {quiz.questions.length} questões
        {search && ` para "${search}"`}
      </p>

      {filteredQuestions.length === 0 && (
        <p className={styles.emptyResults}>Nenhuma questão encontrada.</p>
      )}

      {filteredQuestions.map((q) => {
        const originalIndex = quiz.questions.indexOf(q);
        return (
          <div key={q.id} className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <span className={styles.questionNum}>#{originalIndex + 1}</span>
              <span className={styles.questionType}>{TYPE_LABELS[q.type] || q.type}</span>
              <button
                className={`${styles.favoriteBtn} ${isFavorite(quiz.id, q.id) ? styles.favoriteBtnActive : ''}`}
                onClick={() => toggleFavorite(quiz.id, q.id)}
                aria-label={isFavorite(quiz.id, q.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Star size={16} fill={isFavorite(quiz.id, q.id) ? '#f5b942' : 'none'} />
              </button>
              {q.tags && q.tags.length > 0 && (
                <div className={styles.tagsList}>
                  {q.tags.map((tag) => (
                    <span key={tag} className={styles.tagBadge}>
                      <Hash size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className={styles.questionText}>{q.text}</p>

            {q.image && (
              <img src={q.image} alt="Imagem da questão" className={styles.questionImage} />
            )}

            {q.type === 'assertion' && (
              <div className={styles.assertionsList}>
                {(q as AssertionQuestion).assertions.map((a) => (
                  <div className={styles.assertionItem} key={a.id}>
                    <span className={styles.assertionId}>{a.id}.</span>
                    <span>{a.text}</span>
                    {a.correct ? (
                      <Check size={14} className={styles.assertionCorrect} />
                    ) : (
                      <X size={14} className={styles.assertionWrong} />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.altList}>
              {q.alternatives.map((alt) => {
                const isAltCorrect = parseAnswerSet(q.correctAnswer).includes(alt.id);
                return (
                <div key={alt.id}>
                  <div
                    className={`${styles.altItem} ${isAltCorrect ? styles.altCorrect : styles.altNormal}`}
                  >
                    <span className={styles.altLetter}>{alt.id})</span>
                    <span>{alt.text}</span>
                    {isAltCorrect && <Check size={14} />}
                  </div>
                  {alt.explanation && (
                    <div className={styles.altExplanation}>{alt.explanation}</div>
                  )}
                </div>
                );
              })}
            </div>

            {q.explanation && (
              <div className={styles.explanation}>
                <div className={styles.explanationLabel}>Explicação:</div>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
