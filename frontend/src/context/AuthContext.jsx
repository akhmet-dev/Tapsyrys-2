import { createContext, useState, useEffect, useCallback } from 'react';

// Аутентификация контексті — барлық компоненттерге ортақ auth күйі
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Пайдаланушы күйі: null немесе { id, fullName, email, role }
  const [currentUser, setCurrentUser] = useState(null);

  // Бастапқы жүктелу күйі (localStorage-тен оқу кезінде)
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Компонент орнатылғанда localStorage-тен пайдаланушы деректерін қалпына келтіру
  useEffect(() => {
    const restoreSession = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
        }
      } catch {
        // Деректер бүлінген болса — тазалаймыз
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Жүйеге кіргеннен кейін шақырылатын функция
  const login = useCallback((userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentUser(userData);
  }, []);

  // Жүйеден шыққанда шақырылатын функция
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  }, []);

  // Пайдаланушы деректерін жаңарту (мысалы, профиль өзгергенде)
  const updateCurrentUser = useCallback((updatedData) => {
    setCurrentUser((prevUser) => {
      const mergedUser = { ...(prevUser || {}), ...updatedData };
      localStorage.setItem('user', JSON.stringify(mergedUser));
      return mergedUser;
    });
  }, []);

  // Рөлді тексеру көмекші функциялары
  const isAdmin = currentUser?.role === 'admin';
  const isApplicant = currentUser?.role === 'applicant';
  const isAuthenticated = currentUser !== null;

  const contextValue = {
    currentUser,
    isAuthLoading,
    isAuthenticated,
    isAdmin,
    isApplicant,
    login,
    logout,
    updateCurrentUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
