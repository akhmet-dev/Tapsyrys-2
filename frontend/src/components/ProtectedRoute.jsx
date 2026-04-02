import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useTranslation from '../hooks/useTranslation';
import LoadingSpinner from './LoadingSpinner';

// Қорғалған маршрут компоненті
// requiredRole берілсе — тек сол рөлге рұқсат береді
// requiredRole берілмесе — кез-келген тіркелген пайдаланушыға рұқсат береді
const ProtectedRoute = ({ requiredRole }) => {
  const { isAuthenticated, isAuthLoading, currentUser } = useAuth();
  const { t } = useTranslation();

  // Auth күйі жүктелуде — жүктелу экранын көрсетеміз
  if (isAuthLoading) {
    return <LoadingSpinner fullPage text={t('common.authChecking')} />;
  }

  // Тіркелмеген пайдаланушыны кіру бетіне бағыттаймыз
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Рөл тексеру: қажетті рөл берілген, бірақ пайдаланушының рөлі сәйкес келмесе
  if (requiredRole && currentUser?.role !== requiredRole) {
    // Абитуриентті admin бетіне кіруге тыйым саламыз
    if (requiredRole === 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    // Adminді абитуриент бетіне кіруге тыйым саламыз
    return <Navigate to="/admin" replace />;
  }

  // Барлық тексерулер өтті — балалар компоненттерін рендерлейміз
  return <Outlet />;
};

export default ProtectedRoute;
