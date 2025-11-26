import React, { useState } from 'react';

export interface ModalidadFormData {
  _id?: string;
  code?: number;
  sincronico: boolean;
  asincronico: boolean;
  sincronico_online: boolean;
  sincronico_presencial_moodle: boolean;
  sincronico_presencial_no_moodle: boolean;
}

interface Props {
  initial?: ModalidadFormData;
  onClose: () => void;
  onSave: (data: ModalidadFormData) => Promise<void>;
}

const empty: ModalidadFormData = {
  sincronico: false,
  asincronico: false,
  sincronico_online: false,
  sincronico_presencial_moodle: false,
  sincronico_presencial_no_moodle: false,
};

const ModalidadForm: React.FC<Props> = ({ initial, onClose, onSave }) => {
  const [form, setForm] = useState<ModalidadFormData>(initial ?? empty);
  const [saving, setSaving] = useState(false);

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(f => ({ ...f, [name]: checked }));
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
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="sincronico"
            checked={form.sincronico}
            onChange={change}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Sincrónico
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="asincronico"
            checked={form.asincronico}
            onChange={change}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Asincrónico
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="sincronico_online"
            checked={form.sincronico_online}
            onChange={change}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Sincrónico On-line
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="sincronico_presencial_moodle"
            checked={form.sincronico_presencial_moodle}
            onChange={change}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Sincrónico Presencial Moodle
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="sincronico_presencial_no_moodle"
            checked={form.sincronico_presencial_no_moodle}
            onChange={change}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Sincrónico Presencial No-Moodle
        </label>
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