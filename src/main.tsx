import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { loadWhiteLabel } from './whitelabel/whiteLabel';

// Antes de pintar nada hay que saber si el dominio es un White Label: decide
// el logo, la sesión válida y el alcance de todos los datos.
loadWhiteLabel().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  );
});
