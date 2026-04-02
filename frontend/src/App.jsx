import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import useAuth from './hooks/useAuth';
import useTranslation from './hooks/useTranslation';

// Беттер
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ApplicantDashboard from './pages/ApplicantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ApplicationForm from './pages/ApplicationForm';
import NotFoundPage from './pages/NotFoundPage';
// Жаңа беттер
import RatingPage from './pages/RatingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';

// Компоненттер
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Беттер ауысқанда жоғарыға скролл жасайды
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

// Негізгі қосымша — барлық маршруттар осы жерде анықталады
const App = () => {
  const { isAuthLoading, isAuthenticated, isAdmin } = useAuth();
  const { t } = useTranslation();

  // Auth күйі жүктелуде — толық экран спиннер
  if (isAuthLoading) {
    return <LoadingSpinner fullPage text={t('common.loading')} />;
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── Ашық маршруттар (тіркелмегендерге) ── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Рейтинг — тіркелмеген пайдаланушылар да көре алады */}
        <Route path="/rating" element={<RatingPage />} />

        {/* ── Абитуриент маршруттары ── */}
        <Route element={<ProtectedRoute requiredRole="applicant" />}>
          <Route path="/dashboard" element={<ApplicantDashboard />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/applications/new" element={<ApplicationForm />} />
          <Route path="/applications/edit/:id" element={<ApplicationForm />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* ── Админ маршруттары ── */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Аналитика беті — тек Администраторға */}
          <Route path="/admin/analytics" element={<AnalyticsPage />} />
        </Route>

        {/* ── Негізгі бет бағыттауы ── */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ── 404 беті ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

export default App;
