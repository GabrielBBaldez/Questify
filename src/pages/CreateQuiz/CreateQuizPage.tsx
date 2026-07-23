import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Plus } from 'lucide-react';
import { useQuizStorage } from '../../hooks/useQuizStorage';
import { QuestionForm } from '../../components/QuestionForm/QuestionForm';
import { generateId } from '../../utils/generateId';
import type { Question, Quiz } from '../../types/quiz';
import styles from './CreateQuizPage.module.css';

function createBlankQuestion(): Question {
  return {
    id: generateId(),
    type: 'multiple_choice',
    text: '',
    image: null,
    alternatives: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ],
    correctAnswer: 'A',
  };
}

export function CreateQuizPage() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const { getQuiz, addQuiz, updateQuiz } = useQuizStorage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [questions, setQuestions] = useState<Question[]>([createBlankQuestion()]);
  const [errors, setErrors] = useState<string[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length > 0) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errors]);

  const isEditing = !!quizId;

  useEffect(() => {
    if (quizId) {
      const quiz = getQuiz(quizId);
      if (quiz) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- load existing quiz into the form on edit
        setTitle(quiz.title);
        setDescription(quiz.description);
        setSubject(quiz.subject);
        setQuestions(quiz.questions);
      } else {
        navigate('/');
      }
    }
  }, [quizId]);

  const handleQuestionChange = (index: number, updated: Question) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setQuestions((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(index, 1);
      arr.splice(index - 1, 0, item);
      return arr;
    });
  };

  const handleMoveDown = (index: number) => {
    setQuestions((prev) => {
      if (index >= prev.length - 1) return prev;
      const arr = [...prev];
      const [item] = arr.splice(index, 1);
      arr.splice(index + 1, 0, item);
      return arr;
    });
  };

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('Título obrigatório');
    if (questions.length === 0) errs.push('Adicione pelo menos 1 questão');

    questions.forEach((q, i) => {
      if (!q.text.trim()) errs.push(`Questão ${i + 1}: enunciado vazio`);
      if (q.type !== 'true_false') {
        q.alternatives.forEach((alt) => {
          if (!alt.text.trim()) errs.push(`Questão ${i + 1}: alternativa ${alt.id} vazia`);
        });
      }
      if (q.type === 'assertion') {
        q.assertions.forEach((a, ai) => {
          if (!a.text.trim()) errs.push(`Questão ${i + 1}: assertiva ${ai + 1} vazia`);
        });
      }
    });

    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const quiz: Quiz = {
      id: quizId || generateId(),
      title: title.trim(),
      description: description.trim(),
      subject,
      questions,
      createdAt: isEditing ? getQuiz(quizId!)?.createdAt || new Date().toISOString() : new Date().toISOString(),
    };

    if (isEditing) {
      updateQuiz(quiz);
    } else {
      addQuiz(quiz);
    }

    navigate('/');
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>{isEditing ? 'Editar Banco' : 'Criar Banco de Questões'}</h1>
        <p className={styles.subtitle}>Preencha os dados e adicione as questões</p>
      </div>

      {errors.length > 0 && (
        <div className={styles.errorMsg} role="alert" ref={errorRef}>
          {errors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </div>
      )}

      <div className={styles.metaSection}>
        <div className={styles.fieldFull}>
          <label htmlFor="quiz-title" className={styles.label}>Título</label>
          <input
            id="quiz-title"
            className={`${styles.input} ${errors.some((e) => e.includes('Título')) ? styles.inputError : ''}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Banco de Java - OCA/OCP"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="quiz-subject" className={styles.label}>Matéria</label>
          <input
            id="quiz-subject"
            className={styles.input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: Cardiologia, Java, Direito Civil..."
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="quiz-description" className={styles.label}>Descrição (opcional)</label>
          <textarea
            id="quiz-description"
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Uma breve descrição do banco..."
          />
        </div>
      </div>

      <div className={styles.questionsHeader}>
        <h2 className={styles.questionsTitle}>Questões ({questions.length})</h2>
      </div>

      <div className={styles.questionsList}>
        {questions.map((q, i) => (
          <QuestionForm
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            onChange={(updated) => handleQuestionChange(i, updated)}
            onRemove={() => handleRemoveQuestion(i)}
            onMoveUp={() => handleMoveUp(i)}
            onMoveDown={() => handleMoveDown(i)}
          />
        ))}
      </div>

      <button className={styles.addQuestionBtn} onClick={() => setQuestions([...questions, createBlankQuestion()])}>
        <Plus size={20} />
        Adicionar Questão
      </button>

      <div className={styles.footer}>
        <button className={styles.cancelBtn} onClick={() => navigate('/')}>Cancelar</button>
        <button className={styles.saveBtn} onClick={handleSave}>
          {isEditing ? 'Salvar Alterações' : 'Criar Banco'}
        </button>
      </div>
    </div>
  );
}
