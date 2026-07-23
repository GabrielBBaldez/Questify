export type QuestionType = 'multiple_choice' | 'true_false' | 'assertion' | 'multiple_answer';
export type QuizMode = 'simulado' | 'estudo' | 'revisao';

export interface Alternative {
  id: string;
  text: string;
  explanation?: string;
  /**
   * Set only on alternatives that were shuffled+relabeled at play time. Holds
   * the original alternative id so a recorded answer can be mapped back to the
   * original id space (see utils/shuffleQuestion).
   */
  originalId?: string;
}

export interface Assertion {
  id: string;
  text: string;
  correct: boolean;
}

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  image?: string | null;
  alternatives: Alternative[];
  correctAnswer: string;
  explanation?: string;
  tags?: string[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
}

/**
 * A question with more than one correct alternative. `correctAnswer` holds the
 * correct ids as a sorted, comma-joined string (e.g. "A,C"). Scoring is
 * all-or-nothing: the user must select exactly the correct set.
 */
export interface MultipleAnswerQuestion extends BaseQuestion {
  type: 'multiple_answer';
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
}

export interface AssertionQuestion extends BaseQuestion {
  type: 'assertion';
  assertions: Assertion[];
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | AssertionQuestion
  | MultipleAnswerQuestion;

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  questions: Question[];
  createdAt: string;
}

export interface TrainSettings {
  mode: QuizMode;
  shuffleQuestions: boolean;
  shuffleAlternatives: boolean;
  questionLimit: number | null;
}

export interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  mode: QuizMode;
  answers: Record<string, string>;
  correctCount: number;
  skippedCount?: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  completedAt: string;
}
