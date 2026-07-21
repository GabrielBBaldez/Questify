import { useState } from 'react';
import { ChevronDown, Check, X, SkipForward, Star } from 'lucide-react';
import type { Question, AssertionQuestion } from '../../types/quiz';
import { SKIPPED_ANSWER } from '../../constants/quiz';
import { parseAnswerSet, answersMatch } from '../../utils/answerSet';
import styles from './QuestionReview.module.css';

interface QuestionReviewProps {
  question: Question;
  questionNumber: number;
  userAnswer: string | undefined;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function QuestionReview({ question, questionNumber, userAnswer, isFavorite, onToggleFavorite }: QuestionReviewProps) {
  const [open, setOpen] = useState(false);
  const isSkipped = userAnswer === SKIPPED_ANSWER;
  const isUnanswered = userAnswer === undefined;
  const isCorrect = !isSkipped && !isUnanswered && answersMatch(userAnswer, question.correctAnswer);
  const correctSet = parseAnswerSet(question.correctAnswer);
  const userSet = isSkipped || isUnanswered ? [] : parseAnswerSet(userAnswer);

  const getBadge = () => {
    if (isSkipped) {
      return (
        <span className={`${styles.badge} ${styles.badgeSkipped}`}>
          <SkipForward size={12} /> Pulada
        </span>
      );
    }
    if (isUnanswered) {
      return (
        <span className={`${styles.badge} ${styles.badgeSkipped}`}>
          <SkipForward size={12} /> Pulada
        </span>
      );
    }
    if (isCorrect) {
      return (
        <span className={`${styles.badge} ${styles.badgeCorrect}`}>
          <Check size={12} /> Correta
        </span>
      );
    }
    return (
      <span className={`${styles.badge} ${styles.badgeWrong}`}>
        <X size={12} /> Errada
      </span>
    );
  };

  return (
    <div className={styles.card}>
      <div
        className={styles.header}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); } }}
      >
        <div className={styles.headerLeft}>
          <span className={styles.questionNum}>Questão {questionNumber}</span>
          {getBadge()}
          {onToggleFavorite && (
            <button
              className={`${styles.favoriteBtn} ${isFavorite ? styles.favoriteBtnActive : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Star size={16} fill={isFavorite ? '#f5b942' : 'none'} />
            </button>
          )}
        </div>
        <ChevronDown size={18} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </div>

      {open && (
        <div className={styles.body}>
          <p className={styles.questionText}>{question.text}</p>

          {question.image && (
            <img src={question.image} alt="Imagem da questão" className={styles.questionImage} />
          )}

          {question.type === 'assertion' && (
            <div className={styles.altList} style={{ marginBottom: 'var(--spacing-md)' }}>
              {(question as AssertionQuestion).assertions.map((a) => (
                <div key={a.id} className={`${styles.altItem} ${a.correct ? styles.altCorrect : styles.altWrong}`}>
                  <span className={styles.altLetter}>{a.id}.</span>
                  <span>{a.text}</span>
                  {a.correct ? <Check size={14} /> : <X size={14} />}
                </div>
              ))}
            </div>
          )}

          <div className={styles.altList}>
            {question.alternatives.map((alt) => {
              const isAltCorrect = correctSet.includes(alt.id);
              const isUserWrongPick = userSet.includes(alt.id) && !isAltCorrect;
              let altClass = styles.altNeutral;
              if (isAltCorrect) {
                altClass = styles.altCorrect;
              } else if (isUserWrongPick) {
                altClass = styles.altWrong;
              }

              return (
                <div key={alt.id}>
                  <div className={`${styles.altItem} ${altClass}`}>
                    <span className={styles.altLetter}>{alt.id})</span>
                    <span>{alt.text}</span>
                    {isAltCorrect && <Check size={14} />}
                    {isUserWrongPick && <X size={14} />}
                  </div>
                  {alt.explanation && (
                    <div className={styles.altExplanation}>{alt.explanation}</div>
                  )}
                </div>
              );
            })}
          </div>

          {question.explanation && (
            <div className={styles.explanation}>
              <div className={styles.explanationLabel}>Explicação:</div>
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
