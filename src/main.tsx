import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ManagementGate from './components/ManagementGate';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ManagementGate><App /></ManagementGate>
  </StrictMode>,
);
