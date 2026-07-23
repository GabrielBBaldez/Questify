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
import { shuffleAlternatives, toOriginalAnswer } from '../../utils/shuffleQuestion';
import type { QuizMode, TrainSettings as TrainSettingsType, Question, QuizResult } from '../../types/quiz';
import styles from './QuizPlayerPage.module.css';

type Phase = 'mode' | 'settings' | 'playing';

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

    // Persist results in the ORIGINAL alternative-id space. When alternatives
    // were shuffled, answers/ids are relabeled per run; translating back keeps
    // the saved result comparable to the original quiz (so error review and
    // wrong-counts stay correct — see utils/shuffleQuestion.toOriginalAnswer).
    const originalQuestions = preparedQuestions.map(
      (pq) => quiz.questions.find((q) => q.id === pq.id) ?? pq,
    );
    const originalAnswers: Record<string, string> = {};
    preparedQuestions.forEach((pq) => {
      const answer = answers[pq.id];
      if (answer === undefined) return;
      originalAnswers[pq.id] = answer === SKIPPED_ANSWER ? answer : toOriginalAnswer(pq, answer);
    });

    let correctCount = 0;
    let skippedCount = 0;
    originalQuestions.forEach((q) => {
      const answer = originalAnswers[q.id];
      if (answer === SKIPPED_ANSWER) {
        skippedCount++;
      } else if (answersMatch(answer, q.correctAnswer)) {
        correctCount++;
      }
    });

    const answeredCount = originalQuestions.length - skippedCount;

    const result: QuizResult = {
      id: generateId(),
      quizId: quiz.id,
      quizTitle: quiz.title,
      mode: settings.mode,
      answers: originalAnswers,
      correctCount,
      skippedCount,
      totalQuestions: originalQuestions.length,
      percentage: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
      timeTakenSeconds: seconds,
      completedAt: new Date().toISOString(),
    };

    navigate('/results', { state: { result, questions: originalQuestions } });
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
