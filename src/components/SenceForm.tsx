import React, { useState } from 'react';

export interface SenceFormData {
  codigoSence: string;
  idSence: string;
  idMoodle: string;
}

interface Props {
  onClose: () => void;
  onSave?: (data: SenceFormData) => Promise<void> | void;
}

const empty: SenceFormData = {
  codigoSence: '',
  idSence: '',
  idMoodle: '',
};

const SenceForm: React.FC<Props> = ({ onClose, onSave }) => {
  const [form, setForm] = useState<SenceFormData>(empty);
  const [saving, setSaving] = useState(false);

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) {
      console.log('SenceForm submit', form);
      onClose();
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Código Sence</label>
          <input
            name="codigoSence"
            value={form.codigoSence}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">ID Sence</label>
          <input
            name="idSence"
            value={form.idSence}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">ID Moodle</label>
          <input
            name="idMoodle"
            value={form.idMoodle}
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