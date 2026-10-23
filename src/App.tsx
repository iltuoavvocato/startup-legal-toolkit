import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { EquityPage } from './pages/EquityPage';
import { HomePage } from './pages/HomePage';
import { MatchInvestorPage } from './pages/MatchInvestorPage';
import { MatchLandingPage } from './pages/MatchLandingPage';
import { MatchLegalPage } from './pages/MatchLegalPage';
import { MatchOptInPage } from './pages/MatchOptInPage';
import { MatchStartupPage } from './pages/MatchStartupPage';
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
        <Route path="/match-investitori" element={<MatchLandingPage />} />
        <Route path="/match-investitori/startup" element={<MatchStartupPage />} />
        <Route path="/match-investitori/investitore" element={<MatchInvestorPage />} />
        <Route path="/match-investitori/doppio-consenso" element={<MatchOptInPage />} />
        <Route path="/match-investitori/note-legali" element={<MatchLegalPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
