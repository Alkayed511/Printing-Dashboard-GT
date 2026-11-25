import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ManagementGate from './components/ManagementGate';
import WorkspaceErrorBoundary from './components/WorkspaceErrorBoundary';
import BrandingProvider from './components/BrandingProvider';
import './index.css';
import './workspace.css';
import './appearance.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrandingProvider><ManagementGate><WorkspaceErrorBoundary><App /></WorkspaceErrorBoundary></ManagementGate></BrandingProvider>
  </StrictMode>,
);
