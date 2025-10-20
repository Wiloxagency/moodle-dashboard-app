import React, { useEffect, useState } from 'react';
import InscripcionesTable from '../components/InscripcionesTable';
import InscripcionForm from '../components/InscripcionForm';
import { inscripcionesApi, type Inscripcion } from '../services/inscripciones';
import { participantesApi } from '../services/participantes';

const Inscripciones: React.FC = () => {
  const [data, setData] = useState<Inscripcion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Inscripcion | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

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

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="p-6">
          <InscripcionesTable data={data} participantCounts={counts} onNew={() => { setEditing(null); setShowForm(true); }} onEdit={(item) => { setEditing(item); setShowForm(true); }} />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing ? 'Editar Inscripción' : 'Nueva Inscripción'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <InscripcionForm 
              initial={editing || undefined} 
              onCancel={() => { setShowForm(false); setEditing(null); }} 
              onSave={handleSave}
              onDelete={editing && editing._id ? handleDelete : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Inscripciones;
