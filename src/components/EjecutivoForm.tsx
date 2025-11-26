import React, { useState } from 'react';

export interface EjecutivoFormData {
  _id?: string;
  code?: number;
  nombres: string;
  apellidos: string;
  rut?: string;
  direccion?: string;
  telefono_1?: string;
  telefono_2?: string;
  email?: string;
  status: string;
}

interface Props {
  initial?: EjecutivoFormData;
  onClose: () => void;
  onSave: (data: EjecutivoFormData) => Promise<void>;
}

const empty: EjecutivoFormData = {
  nombres: '',
  apellidos: '',
  rut: '',
  direccion: '',
  telefono_1: '',
  telefono_2: '',
  email: '',
  status: 'Activo',
};

const EjecutivoForm: React.FC<Props> = ({ initial, onClose, onSave }) => {
  const [form, setForm] = useState<EjecutivoFormData>(initial ?? empty);
  const [saving, setSaving] = useState(false);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {form.code !== undefined && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Code</label>
            <input
              value={form.code}
              readOnly
              className="mt-1 w-full border rounded px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombres</label>
          <input
            name="nombres"
            value={form.nombres}
            onChange={change}
            required
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Apellidos</label>
          <input
            name="apellidos"
            value={form.apellidos}
            onChange={change}
            required
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">RUT</label>
          <input
            name="rut"
            value={form.rut}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Dirección</label>
          <input
            name="direccion"
            value={form.direccion}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono 1</label>
          <input
            name="telefono_1"
            value={form.telefono_1 || ''}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono 2</label>
          <input
            name="telefono_2"
            value={form.telefono_2 || ''}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cerrar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar Ejecutivo'}
        </button>
      </div>
    </form>
  );
};

export default EjecutivoForm;