import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// import App from './App.tsx'; // Original App
// import MafindaApp from './App-MAFINDA.tsx'; // MAFINDA App Basic
// import MafindaApp from './App-MAFINDA-Full.tsx'; // MAFINDA App Full
import MafindaApp from './App-MAFINDA-Complete.tsx'; // MAFINDA App Complete - All Features
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MafindaApp />
  </StrictMode>,
);
