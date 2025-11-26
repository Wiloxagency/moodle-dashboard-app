import React, { useState } from 'react';

export interface SenceFormData {
  _id?: string;
  code?: number;
  codigo_sence?: string;
  id_sence?: string;
  id_moodle?: string;
}

interface Props {
  initial?: SenceFormData;
  onClose: () => void;
  onSave: (data: SenceFormData) => Promise<void>;
}

const empty: SenceFormData = {
  codigo_sence: '',
  id_sence: '',
  id_moodle: '',
};

const SenceForm: React.FC<Props> = ({ initial, onClose, onSave }) => {
  const [form, setForm] = useState<SenceFormData>(initial ?? empty);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <label className="block text-sm font-medium text-gray-700">Código Sence</label>
          <input
            name="codigo_sence"
            value={form.codigo_sence || ''}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">ID Sence</label>
          <input
            name="id_sence"
            value={form.id_sence || ''}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">ID Moodle</label>
          <input
            name="id_moodle"
            value={form.id_moodle || ''}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
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
          {saving ? 'Guardando...' : 'Guardar Sence'}
        </button>
      </div>
    </form>
  );
};

export default SenceForm;