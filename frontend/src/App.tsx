import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Feature Components
import { LandingPage } from './features/landing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { StudentDashboard } from './features/student/StudentDashboard';
import { QuizPlayerPage } from './features/student/QuizPlayerPage';
import { QuizResultPage } from './features/student/QuizResultPage';
import { AttemptHistoryPage } from './features/student/AttemptHistoryPage';
import { TeacherDashboard } from './features/teacher/TeacherDashboard';
import { QuizEditorPage } from './features/teacher/QuizEditorPage';
import { QuestionManagerPage } from './features/teacher/QuestionManagerPage';
import { QuizAnalyticsPage } from './features/teacher/QuizAnalyticsPage';
import { LeaderboardPage } from './features/leaderboard/LeaderboardPage';
import { ProfilePage } from './features/profile/ProfilePage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/quizzes" element={<StudentDashboard />} />
          <Route path="/quizzes/:quizId/leaderboard" element={<LeaderboardPage />} />

          {/* Authenticated User Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-attempts" element={<AttemptHistoryPage />} />
            <Route path="/attempts/:attemptId/play" element={<QuizPlayerPage />} />
            <Route path="/attempts/:attemptId/result" element={<QuizResultPage />} />
          </Route>

          {/* Teacher & Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/quizzes/new" element={<QuizEditorPage />} />
            <Route path="/teacher/quizzes/:quizId/edit" element={<QuizEditorPage />} />
            <Route path="/teacher/quizzes/:quizId/questions" element={<QuestionManagerPage />} />
            <Route path="/teacher/quizzes/:quizId/analytics" element={<QuizAnalyticsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
