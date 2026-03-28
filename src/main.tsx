import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import FRSAppWithProviders from './components/financial/FRSApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FRSAppWithProviders />
  </StrictMode>,
);
