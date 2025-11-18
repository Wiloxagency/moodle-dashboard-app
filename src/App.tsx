import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Inscripciones from './pages/Inscripciones';
import Participantes from './pages/Participantes';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      
      {/* Routes */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inscripciones" element={<Inscripciones />} />
        <Route path="/participantes/:numeroInscripcion" element={<Participantes />} />
      </Routes>
    </div>
  );
}

export default App;
