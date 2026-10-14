import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {AdminAuthProvider} from './services/AdminAuthContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AdminAuthProvider>
    <App />
  </AdminAuthProvider>
);
