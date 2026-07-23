import { createHashRouter, createRoutesFromElements, Route } from 'react-router';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/Home/HomePage';
import { CreateQuizPage } from './pages/CreateQuiz/CreateQuizPage';
import { QuizPlayerPage } from './pages/QuizPlayer/QuizPlayerPage';
import { ResultsPage } from './pages/Results/ResultsPage';
import { ConsultPage } from './pages/Consult/ConsultPage';
import { HistoryPage } from './pages/History/HistoryPage';
import HelpPage from './pages/Help/HelpPage';
import GeneratePage from './pages/Generate/GeneratePage';
import { LoginPage } from './pages/Login/LoginPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';

// Data router (createHashRouter) rather than the declarative <Routes>, so
// useBlocker works (guarding an in-progress quiz). Route tree is unchanged.
export const router = createHashRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="create" element={<CreateQuizPage />} />
      <Route path="edit/:quizId" element={<CreateQuizPage />} />
      <Route path="play/:quizId" element={<QuizPlayerPage />} />
      <Route path="results" element={<ResultsPage />} />
      <Route path="consult/:quizId" element={<ConsultPage />} />
      <Route path="history" element={<HistoryPage />} />
      <Route path="help" element={<HelpPage />} />
      <Route path="generate" element={<GeneratePage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
);
