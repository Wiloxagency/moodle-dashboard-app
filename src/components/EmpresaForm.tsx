import React, { useState } from 'react';

export interface EmpresaFormData {
  nombre: string;
  holding: string;
  rut: string;
  nombreResponsable: string;
  emailResponsable: string;
  telefono1: string;
  telefono2: string;
  emailEmpresa: string;
  status: string;
}

interface Props {
  onClose: () => void;
  // Dejamos preparado por si luego se conecta a API
  onSave?: (data: EmpresaFormData) => Promise<void> | void;
}

const empty: EmpresaFormData = {
  nombre: '',
  holding: '',
  rut: '',
  nombreResponsable: '',
  emailResponsable: '',
  telefono1: '',
  telefono2: '',
  emailEmpresa: '',
  status: 'Activo',
};

const EmpresaForm: React.FC<Props> = ({ onClose, onSave }) => {
  const [form, setForm] = useState<EmpresaFormData>(empty);
  const [saving, setSaving] = useState(false);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) {
      // Por ahora solo mostramos en consola para pruebas
      console.log('EmpresaForm submit', form);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={change}
            required
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Holding</label>
          <input
            name="holding"
            value={form.holding}
            onChange={change}
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
          <label className="block text-sm font-medium text-gray-700">Nombre del Responsable</label>
          <input
            name="nombreResponsable"
            value={form.nombreResponsable}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email del Responsable</label>
          <input
            type="email"
            name="emailResponsable"
            value={form.emailResponsable}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono 1</label>
          <input
            name="telefono1"
            value={form.telefono1}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono 2</label>
          <input
            name="telefono2"
            value={form.telefono2}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email de la Empresa</label>
          <input
            type="email"
            name="emailEmpresa"
            value={form.emailEmpresa}
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
          {saving ? 'Guardando...' : 'Guardar Empresa'}
        </button>
      </div>
    </form>
  );
};

export default EmpresaForm;