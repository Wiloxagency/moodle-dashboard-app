import React, { useState } from 'react';

export interface ModalidadFormData {
  _id?: string;
  code?: number;
  nombre: string;
}

interface Props {
  initial?: ModalidadFormData;
  onClose: () => void;
  onSave: (data: ModalidadFormData) => Promise<void>;
}

const empty: ModalidadFormData = {
  nombre: '',
};

const ModalidadForm: React.FC<Props> = ({ initial, onClose, onSave }) => {
  const [form, setForm] = useState<ModalidadFormData>(initial ? { ...empty, ...initial } : empty);
  const [saving, setSaving] = useState(false);

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <div className="space-y-2">
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
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="Ingrese el nombre de la modalidad"
            required
          />
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
          {saving ? 'Guardando...' : 'Guardar Modalidades'}
        </button>
      </div>
    </form>
  );
};

export default ModalidadForm;
