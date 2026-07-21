import { useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router';
import { Home } from 'lucide-react';
import { useQuizStorage } from '../../hooks/useQuizStorage';
import { useResultsStorage } from '../../hooks/useResultsStorage';
import { useFavoritesStorage } from '../../hooks/useFavoritesStorage';
import { useTimer } from '../../hooks/useTimer';
import { ModeSelector } from '../../components/ModeSelector/ModeSelector';
import { TrainSettings } from '../../components/TrainSettings/TrainSettings';
import { QuestionDisplay } from '../../components/QuestionDisplay/QuestionDisplay';
import { ProgressBar } from '../../components/ProgressBar/ProgressBar';
import { shuffle } from '../../utils/shuffle';
import { generateId } from '../../utils/generateId';
import { SKIPPED_ANSWER } from '../../constants/quiz';
import { parseAnswerSet, joinAnswerSet, answersMatch } from '../../utils/answerSet';
import type { QuizMode, TrainSettings as TrainSettingsType, Question, QuizResult } from '../../types/quiz';
import styles from './QuizPlayerPage.module.css';

type Phase = 'mode' | 'settings' | 'playing';

const LETTERS = 'ABCDEFGHIJ';

function shuffleAlternatives(question: Question): Question {
  if (question.type === 'true_false') return question;

  const shuffled = shuffle(question.alternatives);
  const correctSet = new Set(parseAnswerSet(question.correctAnswer));

  // Re-label alternatives: A, B, C, D... in the new shuffled order, and map
  // each original correct id to its new label (handles single and multi answers)
  const newCorrect: string[] = [];
  const relabeled = shuffled.map((alt, i) => {
    const newId = LETTERS[i] || alt.id;
    if (correctSet.has(alt.id)) newCorrect.push(newId);
    return { ...alt, id: newId };
  });

  return { ...question, alternatives: relabeled, correctAnswer: joinAnswerSet(newCorrect) };
}

export function QuizPlayerPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isErrorReview = searchParams.get('errorReview') === 'true';
  const { getQuiz } = useQuizStorage();
  const { getResultsForQuiz } = useResultsStorage();
  const { isFavorite, toggleFavorite } = useFavoritesStorage();
  const { seconds, start, stop } = useTimer();

  const quiz = getQuiz(quizId || '');

  const [phase, setPhase] = useState<Phase>('mode');
  const [settings, setSettings] = useState<TrainSettingsType>({
    mode: 'simulado',
    shuffleQuestions: false,
    shuffleAlternatives: false,
    questionLimit: null,
  });
  const [preparedQuestions, setPreparedQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!quiz) {
    return (
      <div className={styles.notFound}>
        <p>Banco de questões não encontrado.</p>
        <Link to="/" className={styles.notFoundLink}>
          <Home size={18} />
          Voltar ao início
        </Link>
      </div>
    );
  }

  const handleModeSelect = (mode: QuizMode) => {
    setSettings((prev) => ({ ...prev, mode }));
    setPhase('settings');
  };

  const handleStart = () => {
    let questions = [...quiz.questions];

    // Error review mode: filter only questions the user got wrong
    if (isErrorReview) {
      const results = getResultsForQuiz(quiz.id);
      const wrongIds = new Set<string>();
      results.forEach((r) => {
        quiz.questions.forEach((q) => {
          const answer = r.answers[q.id];
          if (answer && answer !== SKIPPED_ANSWER && !answersMatch(answer, q.correctAnswer)) {
            wrongIds.add(q.id);
          }
        });
      });
      questions = questions.filter((q) => wrongIds.has(q.id));

      if (questions.length === 0) {
        alert('Nenhum erro para revisar! Você acertou todas.');
        return;
      }
    }

    if (settings.shuffleQuestions) {
      questions = shuffle(questions);
    }

    if (settings.questionLimit && settings.questionLimit < questions.length) {
      questions = questions.slice(0, settings.questionLimit);
    }

    if (settings.shuffleAlternatives) {
      questions = questions.map(shuffleAlternatives);
    }

    setPreparedQuestions(questions);
    setCurrentIndex(0);
    setAnswers({});
    setPhase('playing');
    start();
  };

  const handleSelectAnswer = (altId: string) => {
    const question = preparedQuestions[currentIndex];
    const qId = question.id;

    if (question.type === 'multiple_answer') {
      setAnswers((prev) => {
        const current = prev[qId] === SKIPPED_ANSWER ? '' : prev[qId];
        const set = new Set(parseAnswerSet(current));
        if (set.has(altId)) {
          set.delete(altId);
        } else {
          set.add(altId);
        }
        const joined = joinAnswerSet([...set]);
        const next = { ...prev };
        if (joined) {
          next[qId] = joined;
        } else {
          delete next[qId];
        }
        return next;
      });
      return;
    }

    setAnswers((prev) => {
      if (prev[qId] === altId) {
        const next = { ...prev };
        delete next[qId];
        return next;
      }
      return { ...prev, [qId]: altId };
    });
  };

  const handleNext = () => {
    if (currentIndex < preparedQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleSkip = () => {
    const qId = preparedQuestions[currentIndex].id;
    setAnswers((prev) => ({ ...prev, [qId]: SKIPPED_ANSWER }));
    if (currentIndex < preparedQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleFinish = () => {
    stop();

    let correctCount = 0;
    let skippedCount = 0;
    preparedQuestions.forEach((q) => {
      if (answers[q.id] === SKIPPED_ANSWER) {
        skippedCount++;
      } else if (answersMatch(answers[q.id], q.correctAnswer)) {
        correctCount++;
      }
    });

    const answeredCount = preparedQuestions.length - skippedCount;

    const result: QuizResult = {
      id: generateId(),
      quizId: quiz.id,
      quizTitle: quiz.title,
      mode: settings.mode,
      answers,
      correctCount,
      skippedCount,
      totalQuestions: preparedQuestions.length,
      percentage: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
      timeTakenSeconds: seconds,
      completedAt: new Date().toISOString(),
    };

    navigate('/results', { state: { result, questions: preparedQuestions } });
  };

  const currentQuestion = preparedQuestions[currentIndex];
  const canGoPrev = settings.mode === 'simulado' && currentIndex > 0;

  return (
    <div>
      <h1 className={styles.quizTitle}>
        {isErrorReview ? `Revisão de Erros - ${quiz.title}` : quiz.title}
      </h1>
      <p className={styles.quizMeta}>
        {quiz.subject} - {isErrorReview ? 'Apenas questões que você errou' : `${quiz.questions.length} questões`}
      </p>

      {phase === 'mode' && (
        <ModeSelector selected={settings.mode} onSelect={handleModeSelect} />
      )}

      {phase === 'settings' && (
        <TrainSettings
          settings={settings}
          totalQuestions={quiz.questions.length}
          onChange={setSettings}
          onStart={handleStart}
        />
      )}

      {phase === 'playing' && currentQuestion && (
        <>
          <ProgressBar current={currentIndex} total={preparedQuestions.length} seconds={seconds} />
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            selectedAnswer={answers[currentQuestion.id] || null}
            mode={settings.mode}
            onSelectAnswer={handleSelectAnswer}
            onSkip={handleSkip}
            onPrev={handlePrev}
            onNext={handleNext}
            onFinish={handleFinish}
            canGoPrev={canGoPrev}
            isLast={currentIndex === preparedQuestions.length - 1}
            isFavorite={isFavorite(quiz.id, currentQuestion.id)}
            onToggleFavorite={() => toggleFavorite(quiz.id, currentQuestion.id)}
          />
        </>
      )}
    </div>
  );
}
