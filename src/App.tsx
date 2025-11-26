import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Inscripciones from './pages/Inscripciones';
import Participantes from './pages/Participantes';
import EmpresasPage from './pages/Empresas';
import SencePage from './pages/Sence';
import ModalidadPage from './pages/Modalidad';
import EjecutivosPage from './pages/Ejecutivos';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      
      {/* Routes */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inscripciones" element={<Inscripciones />} />
        <Route path="/empresas" element={<EmpresasPage />} />
        <Route path="/sence" element={<SencePage />} />
        <Route path="/modalidad" element={<ModalidadPage />} />
        <Route path="/ejecutivos" element={<EjecutivosPage />} />
        <Route path="/participantes/:numeroInscripcion" element={<Participantes />} />
      </Routes>
    </div>
  );
}

export default App;
