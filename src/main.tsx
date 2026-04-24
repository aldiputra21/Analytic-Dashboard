import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import FRSAppWithProviders from './components/financial/FRSApp';
import './index.css';

// Global error handler for debugging
window.addEventListener('error', (event) => {
  console.error('🔴 Global error:', event.error);
  console.error('Stack:', event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 Unhandled rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FRSAppWithProviders />
  </StrictMode>,
);
