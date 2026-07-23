import { useEffect, useRef } from 'react';
import { CloudUpload, RefreshCw } from 'lucide-react';
import styles from './MergeDialog.module.css';

interface MergeDialogProps {
  quizCount: number;
  resultCount: number;
  onMerge: () => void;
  onSkip: () => void;
  error?: string | null;
}

export function MergeDialog({ quizCount, resultCount, onMerge, onSkip, error }: MergeDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onSkip();
    }
  };

  return (
    <div className={styles.overlay}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="merge-dialog-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <h3 id="merge-dialog-title" className={styles.title}>Dados locais encontrados</h3>
        <p className={styles.message}>
          Você possui dados salvos neste navegador. Deseja enviar para a nuvem ou começar do zero com os dados da sua conta?
        </p>
        <div className={styles.counts}>
          <span className={styles.countBadge}>{quizCount} quiz{quizCount !== 1 ? 'zes' : ''}</span>
          <span className={styles.countBadge}>{resultCount} resultado{resultCount !== 1 ? 's' : ''}</span>
        </div>
        {error && <p style={{ color: 'var(--color-danger, #e53e3e)', marginTop: '0.5rem', fontSize: '0.875rem' }}>{error}</p>}
        <div className={styles.actions}>
          <button className={styles.mergeBtn} onClick={onMerge}>
            <CloudUpload size={18} />
            Enviar para a nuvem
          </button>
          <button className={styles.skipBtn} onClick={onSkip}>
            <RefreshCw size={18} />
            Comecar do zero
          </button>
        </div>
      </div>
    </div>
  );
}
