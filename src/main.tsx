import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AdminAuthProvider } from './services/AdminAuthContext';
import { UserProfileProvider } from './services/UserProfileContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initResilienceGuard } from './utils/resilienceLogger';
import './index.css';

// Inicializa a proteção global contra exceções não tratadas
initResilienceGuard();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AdminAuthProvider>
      <UserProfileProvider>
        <App />
      </UserProfileProvider>
    </AdminAuthProvider>
  </ErrorBoundary>
);
