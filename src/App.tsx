import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { EquityPage } from './pages/EquityPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { QuizPage } from './pages/QuizPage';
import { VestingPage } from './pages/VestingPage';

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/equity" element={<EquityPage />} />
        <Route path="/vesting" element={<VestingPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
