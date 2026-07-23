import { useState, useEffect } from 'react';
import type { TrainSettings as TrainSettingsType } from '../../types/quiz';
import styles from './TrainSettings.module.css';

interface TrainSettingsProps {
  settings: TrainSettingsType;
  totalQuestions: number;
  onChange: (settings: TrainSettingsType) => void;
  onStart: () => void;
}

export function TrainSettings({ settings, totalQuestions, onChange, onStart }: TrainSettingsProps) {
  const update = (partial: Partial<TrainSettingsType>) => {
    onChange({ ...settings, ...partial });
  };

  const [limitInput, setLimitInput] = useState(
    String(settings.questionLimit ?? totalQuestions)
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-sync local input when props change
    setLimitInput(String(settings.questionLimit ?? totalQuestions));
  }, [settings.questionLimit, totalQuestions]);

  const commitLimit = () => {
    const val = parseInt(limitInput);
    if (isNaN(val) || val <= 0) {
      setLimitInput(String(totalQuestions));
      update({ questionLimit: null });
    } else if (val >= totalQuestions) {
      setLimitInput(String(totalQuestions));
      update({ questionLimit: null });
    } else {
      setLimitInput(String(val));
      update({ questionLimit: val });
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Configurações do treino</h3>

      <div className={styles.option}>
        <div className={styles.optionLabel}>
          <span className={styles.optionName}>Embaralhar questões</span>
          <span className={styles.optionDesc}>Muda a ordem das questões aleatoriamente</span>
        </div>
        <button
          className={`${styles.toggle} ${settings.shuffleQuestions ? styles.toggleActive : ''}`}
          onClick={() => update({ shuffleQuestions: !settings.shuffleQuestions })}
          aria-label="Embaralhar questões"
        >
          <div className={styles.toggleKnob} />
        </button>
      </div>

      <div className={styles.option}>
        <div className={styles.optionLabel}>
          <span className={styles.optionName}>Embaralhar alternativas</span>
          <span className={styles.optionDesc}>Muda a ordem do gabarito para não viciar</span>
        </div>
        <button
          className={`${styles.toggle} ${settings.shuffleAlternatives ? styles.toggleActive : ''}`}
          onClick={() => update({ shuffleAlternatives: !settings.shuffleAlternatives })}
          aria-label="Embaralhar alternativas"
        >
          <div className={styles.toggleKnob} />
        </button>
      </div>

      <div className={styles.option}>
        <div className={styles.optionLabel}>
          <span className={styles.optionName}>Limitar questões</span>
          <span className={styles.optionDesc}>Treinar apenas uma parte do banco ({totalQuestions} total)</span>
        </div>
        <div className={styles.limitField}>
          <input
            type="number"
            className={styles.limitInput}
            value={limitInput}
            min={1}
            max={totalQuestions}
            onChange={(e) => setLimitInput(e.target.value)}
            onBlur={commitLimit}
            onKeyDown={(e) => { if (e.key === 'Enter') commitLimit(); }}
          />
          <span className={styles.limitLabel}>de {totalQuestions}</span>
        </div>
      </div>

      <button className={styles.startBtn} onClick={onStart}>
        Começar Treino
      </button>
    </div>
  );
}
