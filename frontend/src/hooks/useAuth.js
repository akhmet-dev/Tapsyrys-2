import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// AuthContext-ті оңай пайдалану үшін арнайы хук
// Барлық компоненттерде useAuth() арқылы auth күйіне қол жеткізуге болады
const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth хуки AuthProvider ішінде пайдаланылуы керек.');
  }

  return context;
};

export default useAuth;
