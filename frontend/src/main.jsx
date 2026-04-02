import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import './index.css';

// React қосымшасын DOM-ға орнату
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter — маршруттауды қамтамасыз етеді */}
    <BrowserRouter>
      {/* LanguageProvider — тіл контекстін барлық компоненттерге береді */}
      <LanguageProvider>
        {/* AuthProvider — барлық компоненттерге auth күйін береді */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
