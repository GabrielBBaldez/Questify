import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { readJsonFile } from '../../utils/jsonImport';
import { validateQuiz } from '../../utils/quizValidator';
import type { Quiz } from '../../types/quiz';
import styles from './ImportExport.module.css';

interface ImportButtonProps {
  onImport: (quizzes: Quiz[]) => void;
}

export function ImportButton({ onImport }: ImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const imported: Quiz[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const data = await readJsonFile(file);
        const result = validateQuiz(data);
        if (result.valid && result.quiz) {
          imported.push(result.quiz);
        } else {
          errors.push(`${file.name}: ${result.errors.join(', ')}`);
        }
      } catch {
        errors.push(`${file.name}: arquivo JSON inválido`);
      }
    }

    if (imported.length > 0) {
      onImport(imported);
    }

    if (imported.length > 0) {
      const ok = `${imported.length} ${imported.length === 1 ? 'banco importado' : 'bancos importados'}`;
      setFeedback({
        type: errors.length > 0 ? 'error' : 'success',
        message: errors.length > 0 ? `${ok} · ${errors.length} com erro: ${errors.join('; ')}` : `${ok} com sucesso!`,
      });
    } else {
      setFeedback({ type: 'error', message: errors.join('; ') || 'Nenhum banco importado' });
    }

    if (inputRef.current) inputRef.current.value = '';
    setTimeout(() => setFeedback(null), 6000);
  };

  return (
    <div className={styles.importWrapper}>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        multiple
        className={styles.hidden}
        onChange={handleFileChange}
      />
      <button className={styles.importBtn} onClick={() => inputRef.current?.click()}>
        <Upload size={18} />
        Importar JSON
      </button>
      {feedback && (
        <p className={feedback.type === 'error' ? styles.error : styles.success}>
          {feedback.message}
        </p>
      )}
    </div>
  );
}
