import { useState, useEffect, useCallback } from 'react';
import {
  fetchApplications,
  deleteApplication,
  updateApplicationStatus,
} from '../services/applicationService';
import { getErrorMessage } from '../services/api';

// Өтінімдерді басқаруға арналған хук
// Dashboard беттерінде қолданылады
const useApplications = () => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Өтінімдерді серверден жүктеу
  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchApplications();
      setApplications(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Компонент орнатылғанда автоматты жүктеу
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Өтінімді жою
  const removeApplication = useCallback(async (applicationId) => {
    try {
      await deleteApplication(applicationId);
      // Дерекқорға бармай-ақ жергілікті күйді жаңартамыз
      setApplications((prev) => prev.filter((app) => app._id !== applicationId));
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  }, []);

  // Өтінімнің статусын өзгерту (тек Админ)
  const changeApplicationStatus = useCallback(async (applicationId, status, adminNote) => {
    try {
      const result = await updateApplicationStatus(applicationId, status, adminNote);
      // Жергілікті тізімдегі өтінімді жаңартамыз
      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, ...result.data } : app
        )
      );
      return { success: true, data: result.data };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  }, []);

  return {
    applications,
    isLoading,
    error,
    loadApplications,
    removeApplication,
    changeApplicationStatus,
  };
};

export default useApplications;
