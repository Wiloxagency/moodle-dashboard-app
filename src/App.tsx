import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Inscripciones from './pages/Inscripciones';
import ReporteAvances from './pages/ReporteAvances';
import Participantes from './pages/Participantes';
import EmpresasPage from './pages/Empresas';
import ModalidadPage from './pages/Modalidad';
import EjecutivosPage from './pages/Ejecutivos';
import LoginPage from './pages/Login';
import UsuariosPage from './pages/Usuarios';
import SencePage from './pages/Sence';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const location = useLocation();
  const isLoginRoute = location.pathname === '/';

  const containerClass = isLoginRoute ? 'min-h-screen bg-gray-50' : 'h-screen overflow-hidden bg-gray-50';
  return (
    <div className={containerClass}>
      {/* Header: oculto en la pantalla de login */}
      {!isLoginRoute && <Header />}
      
      {/* Routes */}
      <Routes>
        {/* Login en la ruta raíz */}
        <Route path="/" element={<LoginPage />} />

        {/* Rutas protegidas solo por autenticación */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reporte-avances"
          element={
            <ProtectedRoute>
              <ReporteAvances />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inscripciones"
          element={
            <ProtectedRoute>
              <Inscripciones />
            </ProtectedRoute>
          }
        />
        <Route
          path="/modalidad"
          element={
            <ProtectedRoute>
              <ModalidadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ejecutivos"
          element={
            <ProtectedRoute>
              <EjecutivosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participantes/:numeroInscripcion"
          element={
            <ProtectedRoute>
              <Participantes />
            </ProtectedRoute>
          }
        />

        {/* Rutas protegidas por rol superAdmin (RBAC estricto) */}
        <Route
          path="/empresas"
          element={
            <ProtectedRoute requiredRole="superAdmin">
              <EmpresasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute requiredRole="superAdmin">
              <UsuariosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sence"
          element={
            <ProtectedRoute requiredRole="superAdmin">
              <SencePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
