import React, { useState } from 'react';

export interface ModalidadFormData {
  sincronico: boolean;
  asincronico: boolean;
  sincronicoOnline: boolean;
  sincronicoPresencialMoodle: boolean;
  sincronicoPresencialNoMoodle: boolean;
}

interface Props {
  onClose: () => void;
  onSave?: (data: ModalidadFormData) => Promise<void> | void;
}

const empty: ModalidadFormData = {
  sincronico: false,
  asincronico: false,
  sincronicoOnline: false,
  sincronicoPresencialMoodle: false,
  sincronicoPresencialNoMoodle: false,
};

const ModalidadForm: React.FC<Props> = ({ onClose, onSave }) => {
  const [form, setForm] = useState<ModalidadFormData>(empty);
  const [saving, setSaving] = useState(false);

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(f => ({ ...f, [name]: checked }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) {
      console.log('ModalidadForm submit', form);
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
      <div className="space-y-2">
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
            name="sincronicoOnline"
            checked={form.sincronicoOnline}
            onChange={change}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Sincrónico On-line
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="sincronicoPresencialMoodle"
            checked={form.sincronicoPresencialMoodle}
            onChange={change}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Sincrónico Presencial Moodle
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="sincronicoPresencialNoMoodle"
            checked={form.sincronicoPresencialNoMoodle}
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