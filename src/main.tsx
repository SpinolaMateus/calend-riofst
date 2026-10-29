import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AdminAuthProvider } from './services/AdminAuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initResilienceGuard } from './utils/resilienceLogger';
import './index.css';

// Inicializa a proteção global contra exceções não tratadas
initResilienceGuard();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AdminAuthProvider>
      <App />
    </AdminAuthProvider>
  </ErrorBoundary>
);
