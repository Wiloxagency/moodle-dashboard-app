import React, { useEffect, useState } from 'react';
import { Building2, ClipboardList, Users, Waypoints, FileText } from 'lucide-react';
import InscripcionesTable from '../components/InscripcionesTable';
import InscripcionForm from '../components/InscripcionForm';
import EmpresaForm from '../components/EmpresaForm';
import SenceForm from '../components/SenceForm';
import ModalidadForm from '../components/ModalidadForm';
import EjecutivoForm from '../components/EjecutivoForm';
import { inscripcionesApi, type Inscripcion } from '../services/inscripciones';
import { participantesApi } from '../services/participantes';

type SideSection = 'inscripciones' | 'empresas' | 'sence' | 'modalidad' | 'ejecutivos';

const Inscripciones: React.FC = () => {
  const [data, setData] = useState<Inscripcion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Inscripcion | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeSection, setActiveSection] = useState<SideSection>('inscripciones');

  const load = async () => {
    const items = await inscripcionesApi.list();
    setData(items);
    try {
      const c = await participantesApi.counts(items.map(i => i.numeroInscripcion));
      setCounts(c);
    } catch (e) {
      console.warn('Failed to fetch participant counts', e);
    }
    // cache for perceived performance
    sessionStorage.setItem('inscripcionesCache', JSON.stringify(items));
  };

  useEffect(() => {
    // Use cached data for instant render
    const cached = sessionStorage.getItem('inscripcionesCache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Inscripcion[];
        setData(parsed);
        participantesApi.counts(parsed.map(i => i.numeroInscripcion)).then(setCounts).catch(() => {});
      } catch {}
    }
    load();
  }, []);

  const handleSave = async (payload: Inscripcion) => {
    if (editing && editing._id) {
      await inscripcionesApi.update(editing._id, payload);
    } else {
      await inscripcionesApi.create(payload);
    }
    setShowForm(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    await inscripcionesApi.delete(id);
    setShowForm(false);
    setEditing(null);
    await load();
  };

  const closeModal = () => {
    setShowForm(false);
    setEditing(null);
    setActiveSection('inscripciones');
  };

  const openForNew = () => {
    setEditing(null);
    setActiveSection('inscripciones');
    setShowForm(true);
  };

  const openForEdit = (item: Inscripcion) => {
    setEditing(item);
    setActiveSection('inscripciones');
    setShowForm(true);
  };

  const renderActiveForm = () => {
    switch (activeSection) {
      case 'inscripciones':
        return (
          <InscripcionForm 
            initial={editing || undefined} 
            onCancel={closeModal}
            onSave={handleSave}
            onDelete={editing && editing._id ? handleDelete : undefined}
          />
        );
      case 'empresas':
        return <EmpresaForm onClose={closeModal} />;
      case 'sence':
        return <SenceForm onClose={closeModal} />;
      case 'modalidad':
        return <ModalidadForm onClose={closeModal} />;
      case 'ejecutivos':
        return <EjecutivoForm onClose={closeModal} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <InscripcionesTable 
            data={data} 
            participantCounts={counts} 
            onNew={openForNew} 
            onEdit={openForEdit} 
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl p-0 overflow-hidden">
            <div className="flex h-[80vh]">
              {/* Menú lateral derecho dentro del modal */}
              <div className="w-64 border-r bg-gray-50 p-4 flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Inscripciones Dashboard</h3>
                <button
                  type="button"
                  onClick={() => setActiveSection('inscripciones')}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${
                    activeSection === 'inscripciones' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Inscripciones</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('empresas')}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${
                    activeSection === 'empresas' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Empresas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('sence')}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${
                    activeSection === 'sence' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Sence</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('modalidad')}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${
                    activeSection === 'modalidad' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Waypoints className="w-4 h-4" />
                  <span>Modalidad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('ejecutivos')}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${
                    activeSection === 'ejecutivos' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Ejecutivos</span>
                </button>
              </div>

              {/* Contenido del formulario seleccionado */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {activeSection === 'inscripciones' && (editing ? 'Editar Inscripción' : 'Nueva Inscripción')}
                    {activeSection === 'empresas' && 'Empresas'}
                    {activeSection === 'sence' && 'Sence'}
                    {activeSection === 'modalidad' && 'Modalidad'}
                    {activeSection === 'ejecutivos' && 'Ejecutivos'}
                  </h3>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-xl leading-none">✕</button>
                </div>
                {renderActiveForm()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inscripciones;
