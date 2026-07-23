import { Square, CheckSquare } from 'lucide-react';
import type { Alternative } from '../../types/quiz';
import styles from './AlternativeButton.module.css';

interface AlternativeButtonProps {
  alternative: Alternative;
  isSelected: boolean;
  isCorrect: boolean;
  showFeedback: boolean;
  showExplanation: boolean;
  disabled: boolean;
  onClick: () => void;
  /** Renders a checkbox indicator to signal that several answers can be picked. */
  multiSelect?: boolean;
}

export function AlternativeButton({
  alternative,
  isSelected,
  isCorrect,
  showFeedback,
  showExplanation,
  disabled,
  onClick,
  multiSelect = false,
}: AlternativeButtonProps) {
  let className = styles.button;

  if (showFeedback) {
    if (isCorrect) {
      className += ` ${styles.correct}`;
    } else if (isSelected) {
      className += ` ${styles.incorrect}`;
    }
  } else if (isSelected) {
    className += ` ${styles.selected}`;
  }

  if (disabled) {
    className += ` ${styles.disabled}`;
  }

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      role={multiSelect ? 'checkbox' : undefined}
      aria-checked={multiSelect ? isSelected : undefined}
      aria-pressed={multiSelect ? undefined : isSelected}
    >
      {multiSelect && (
        <span className={styles.checkbox} aria-hidden="true">
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </span>
      )}
      <span className={styles.letter}>{alternative.id}</span>
      <div className={styles.content}>
        <span className={styles.text}>{alternative.text}</span>
        {showExplanation && alternative.explanation && (
          <div className={styles.explanation}>{alternative.explanation}</div>
        )}
      </div>
    </button>
  );
}
