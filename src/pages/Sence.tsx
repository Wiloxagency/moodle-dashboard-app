import React, { useEffect, useState } from 'react';
import SenceForm, { type SenceFormData } from '../components/SenceForm';
import SenceTable from '../components/SenceTable';
import { senceApi, type Sence } from '../services/sence';

const SencePage: React.FC = () => {
  const [data, setData] = useState<Sence[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const items = await senceApi.list();
      setData(items);
    } catch (e) {
      console.error(e);
      setError('Error cargando registros Sence');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleNew = () => {
    setEditingIndex(null);
    setShowForm(true);
  };

  const handleEdit = (_item: Sence, index: number) => {
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleSave = async (payload: SenceFormData) => {
    if (editingIndex == null) {
      const { _id, code, ...rest } = payload;
      const created = await senceApi.create(rest);
      setData(prev => [...prev, created]);
    } else {
      const current = data[editingIndex];
      if (!current || !current._id) return;
      const { _id, code, ...rest } = payload;
      const updated = await senceApi.update(current._id, rest);
      setData(prev => {
        const copy = [...prev];
        copy[editingIndex] = updated;
        return copy;
      });
    }
    setShowForm(false);
    setEditingIndex(null);
  };

  const initial: SenceFormData | undefined =
    editingIndex == null ? undefined : (data[editingIndex] as SenceFormData);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}
          <SenceTable data={data} onNew={handleNew} onEdit={handleEdit} />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingIndex == null ? 'Nuevo Registro Sence' : 'Editar Registro Sence'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingIndex(null); }}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <SenceForm
              initial={initial}
              onClose={() => { setShowForm(false); setEditingIndex(null); }}
              onSave={handleSave}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SencePage;
