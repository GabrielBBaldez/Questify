import { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Plus, X, Hash } from 'lucide-react';
import type { Question, QuestionType, Alternative, Assertion } from '../../types/quiz';
import { parseAnswerSet, joinAnswerSet } from '../../utils/answerSet';
import { ImageUpload } from '../ImageUpload/ImageUpload';
import styles from './QuestionForm.module.css';

interface QuestionFormProps {
  question: Question;
  index: number;
  total: number;
  onChange: (updated: Question) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function createDefaultAlternatives(type: QuestionType): Alternative[] {
  if (type === 'true_false') {
    return [
      { id: 'V', text: 'Verdadeiro' },
      { id: 'F', text: 'Falso' },
    ];
  }
  return [
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ];
}

export function QuestionForm({ question, index, total, onChange, onRemove, onMoveUp, onMoveDown }: QuestionFormProps) {
  const [tagInput, setTagInput] = useState('');

  const handleTypeChange = (type: QuestionType) => {
    const base = {
      id: question.id,
      text: question.text,
      image: question.image,
      explanation: question.explanation,
      tags: question.tags,
    };

    if (type === 'assertion') {
      onChange({
        ...base,
        type: 'assertion',
        assertions: [
          { id: 'I', text: '', correct: true },
          { id: 'II', text: '', correct: false },
        ],
        alternatives: createDefaultAlternatives('multiple_choice'),
        correctAnswer: 'A',
      } as Question);
    } else {
      onChange({
        ...base,
        type,
        alternatives: createDefaultAlternatives(type),
        correctAnswer: type === 'true_false' ? 'V' : 'A',
      } as Question);
    }
  };

  const updateField = (field: string, value: unknown) => {
    onChange({ ...question, [field]: value } as Question);
  };

  const updateAlternative = (altIndex: number, field: string, value: string) => {
    const alts = [...question.alternatives];
    alts[altIndex] = { ...alts[altIndex], [field]: value };
    onChange({ ...question, alternatives: alts } as Question);
  };

  const addAlternative = () => {
    const letters = 'ABCDEFGHIJ';
    const nextId = letters[question.alternatives.length] || `ALT${question.alternatives.length}`;
    onChange({
      ...question,
      alternatives: [...question.alternatives, { id: nextId, text: '' }],
    } as Question);
  };

  const removeAlternative = (altIndex: number) => {
    if (question.alternatives.length <= 2) return;
    const alts = question.alternatives.filter((_, i) => i !== altIndex);
    const removed = question.alternatives[altIndex];
    let correctAnswer = question.correctAnswer;
    if (question.type === 'multiple_answer') {
      const set = parseAnswerSet(correctAnswer).filter((id) => id !== removed.id);
      correctAnswer = joinAnswerSet(set.length ? set : [alts[0].id]);
    } else if (correctAnswer === removed.id) {
      correctAnswer = alts[0].id;
    }
    onChange({ ...question, alternatives: alts, correctAnswer } as Question);
  };

  // Multiple-answer: toggle an alternative in/out of the correct set (keeps at least one)
  const isCorrectAlt = (altId: string) => parseAnswerSet(question.correctAnswer).includes(altId);

  const toggleCorrectAlt = (altId: string) => {
    const set = new Set(parseAnswerSet(question.correctAnswer));
    if (set.has(altId)) {
      if (set.size <= 1) return;
      set.delete(altId);
    } else {
      set.add(altId);
    }
    updateField('correctAnswer', joinAnswerSet([...set]));
  };

  // Tags
  const tags = question.tags || [];

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (!tag || tags.includes(tag)) return;
    updateField('tags', [...tags, tag]);
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    updateField('tags', tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // Assertion helpers
  const assertions = question.type === 'assertion' ? (question as any).assertions as Assertion[] : [];

  const updateAssertion = (aIndex: number, field: string, value: unknown) => {
    const updated = assertions.map((a, i) => (i === aIndex ? { ...a, [field]: value } : a));
    onChange({ ...question, assertions: updated } as Question);
  };

  const addAssertion = () => {
    const nextId = ROMAN[assertions.length] || `${assertions.length + 1}`;
    onChange({
      ...question,
      assertions: [...assertions, { id: nextId, text: '', correct: false }],
    } as Question);
  };

  const removeAssertion = (aIndex: number) => {
    if (assertions.length <= 2) return;
    const updated = assertions.filter((_, i) => i !== aIndex);
    onChange({ ...question, assertions: updated } as Question);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.questionNumber}>Questão {index + 1}</span>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={onMoveUp} disabled={index === 0} aria-label="Mover para cima">
            <ChevronUp size={18} />
          </button>
          <button className={styles.iconBtn} onClick={onMoveDown} disabled={index === total - 1} aria-label="Mover para baixo">
            <ChevronDown size={18} />
          </button>
          <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={onRemove} disabled={total <= 1} aria-label="Remover questão">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Type selector */}
      <div className={styles.typeSelector}>
        <button
          type="button"
          className={`${styles.typeOption} ${question.type === 'multiple_choice' ? styles.typeOptionActive : ''}`}
          onClick={() => handleTypeChange('multiple_choice')}
        >
          Múltipla Escolha
        </button>
        <button
          type="button"
          className={`${styles.typeOption} ${question.type === 'multiple_answer' ? styles.typeOptionActive : ''}`}
          onClick={() => handleTypeChange('multiple_answer')}
        >
          Múltipla Resposta
        </button>
        <button
          type="button"
          className={`${styles.typeOption} ${question.type === 'true_false' ? styles.typeOptionActive : ''}`}
          onClick={() => handleTypeChange('true_false')}
        >
          V ou F
        </button>
        <button
          type="button"
          className={`${styles.typeOption} ${question.type === 'assertion' ? styles.typeOptionActive : ''}`}
          onClick={() => handleTypeChange('assertion')}
        >
          Assertivas
        </button>
      </div>

      {/* Tags */}
      <div className={styles.field}>
        <label className={styles.label}>Tópicos (opcional)</label>
        <div className={styles.tagsContainer}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              <Hash size={12} />
              {tag}
              <button className={styles.tagRemove} onClick={() => removeTag(tag)}>
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            className={styles.tagInput}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            placeholder={tags.length === 0 ? 'Ex: java, if-else, algoritmos...' : 'Adicionar...'}
          />
        </div>
      </div>

      {/* Question text */}
      <div className={styles.field}>
        <label className={styles.label}>Enunciado</label>
        <textarea
          className={styles.textarea}
          value={question.text}
          onChange={(e) => updateField('text', e.target.value)}
          placeholder="Digite o enunciado da questão..."
        />
      </div>

      {/* Image */}
      <ImageUpload image={question.image || null} onChange={(img) => updateField('image', img)} />

      {/* Assertions (if assertion type) */}
      {question.type === 'assertion' && (
        <div className={styles.field}>
          <label className={styles.label}>Assertivas</label>
          {assertions.map((assertion, aIndex) => (
            <div className={styles.assertionRow} key={aIndex}>
              <span className={styles.assertionId}>{assertion.id}</span>
              <input
                className={styles.assertionInput}
                value={assertion.text}
                onChange={(e) => updateAssertion(aIndex, 'text', e.target.value)}
                placeholder={`Assertiva ${assertion.id}...`}
              />
              <label className={styles.assertionCorrect}>
                <input
                  type="checkbox"
                  checked={assertion.correct}
                  onChange={(e) => updateAssertion(aIndex, 'correct', e.target.checked)}
                />
                Correta
              </label>
              <button className={styles.removeAltBtn} onClick={() => removeAssertion(aIndex)} disabled={assertions.length <= 2}>
                <X size={14} />
              </button>
            </div>
          ))}
          <button type="button" className={styles.addBtn} onClick={addAssertion}>
            <Plus size={16} /> Adicionar assertiva
          </button>
        </div>
      )}

      {/* Alternatives */}
      <div className={styles.field}>
        <label className={styles.label}>Alternativas</label>
        {question.alternatives.map((alt, altIndex) => (
          <div key={alt.id} className={styles.altBlock}>
            <div className={styles.alternativeRow}>
              <span className={`${styles.altLetter} ${(question.type === 'multiple_answer' ? isCorrectAlt(alt.id) : question.correctAnswer === alt.id) ? styles.altLetterCorrect : ''}`}>
                {alt.id}
              </span>
              {question.type === 'true_false' ? (
                <span style={{ flex: 1 }}>{alt.text}</span>
              ) : (
                <input
                  className={styles.altInput}
                  value={alt.text}
                  onChange={(e) => updateAlternative(altIndex, 'text', e.target.value)}
                  placeholder={`Alternativa ${alt.id}...`}
                />
              )}
              <label className={styles.radioLabel}>
                {question.type === 'multiple_answer' ? (
                  <input
                    type="checkbox"
                    checked={isCorrectAlt(alt.id)}
                    onChange={() => toggleCorrectAlt(alt.id)}
                  />
                ) : (
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.correctAnswer === alt.id}
                    onChange={() => updateField('correctAnswer', alt.id)}
                  />
                )}
                Correta
              </label>
              {question.type !== 'true_false' && question.alternatives.length > 2 && (
                <button className={styles.removeAltBtn} onClick={() => removeAlternative(altIndex)}>
                  <X size={14} />
                </button>
              )}
            </div>
            <input
              className={styles.altExplanation}
              value={alt.explanation || ''}
              onChange={(e) => updateAlternative(altIndex, 'explanation', e.target.value)}
              placeholder={`Por que ${alt.id} está ${(question.type === 'multiple_answer' ? isCorrectAlt(alt.id) : question.correctAnswer === alt.id) ? 'correta' : 'errada'}... (opcional)`}
            />
          </div>
        ))}
        {question.type !== 'true_false' && question.alternatives.length < 6 && (
          <button type="button" className={styles.addBtn} onClick={addAlternative}>
            <Plus size={16} /> Adicionar alternativa
          </button>
        )}
      </div>

      {/* General Explanation */}
      <div className={styles.explanationField}>
        <label className={styles.label}>Explicação geral (opcional)</label>
        <textarea
          className={styles.textarea}
          value={question.explanation || ''}
          onChange={(e) => updateField('explanation', e.target.value)}
          placeholder="Explicação geral da questão..."
        />
      </div>
    </div>
  );
}
