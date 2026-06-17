import React, { useEffect, useState } from 'react';
import EmpresaForm, { type EmpresaFormData } from '../components/EmpresaForm';
import EmpresaTable from '../components/EmpresaTable';
import { empresasApi, type Empresa } from '../services/empresas';

const EmpresasPage: React.FC = () => {
  const [data, setData] = useState<Empresa[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const items = await empresasApi.list();
      setData(items);
    } catch (e) {
      console.error(e);
      setError('Error cargando empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleNew = () => {
    setEditingCode(null);
    setShowForm(true);
  };

  const handleEdit = (item: Empresa) => {
    setEditingCode(item.code);
    setShowForm(true);
  };

  const handleSave = async (payload: EmpresaFormData) => {
    if (editingCode == null) {
      // crear
      const { _id, code, ...rest } = payload;
      const created = await empresasApi.create(rest);
      setData(prev => [...prev, created]);
    } else {
      const current = data.find(item => item.code === editingCode);
      if (!current || !current._id) {
        setShowForm(false);
        setEditingCode(null);
        return;
      }
      const { _id, code, ...rest } = payload;
      const updated = await empresasApi.update(current._id, rest);
      setData(prev => prev.map(item => (item._id === current._id ? updated : item)));
    }
    setShowForm(false);
    setEditingCode(null);
  };

  const initial: EmpresaFormData | undefined =
    editingCode == null ? undefined : (data.find(item => item.code === editingCode) as EmpresaFormData);

  const holdings = Array.from(
    new Map(
      data
        .map(item => (item.holding || '').trim())
        .filter(Boolean)
        .map(h => [h.toLowerCase(), h] as const)
    ).values()
  );

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}
          {loading && <p className="text-gray-500 mb-2 text-sm">Cargando empresas...</p>}
          <EmpresaTable data={data as any} onNew={handleNew} onEdit={handleEdit as any} />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingCode == null ? 'Nueva Empresa' : 'Editar Empresa'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingCode(null); }}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <EmpresaForm
              initial={initial}
              holdings={holdings}
              onClose={() => { setShowForm(false); setEditingCode(null); }}
              onSave={handleSave}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpresasPage;
