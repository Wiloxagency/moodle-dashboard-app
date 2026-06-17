import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface EmpresaFormData {
  _id?: string;
  code?: number;
  nombre: string;
  holding?: string;
  rut?: string;
  nombre_responsable?: string;
  email_responsable?: string;
  telefono_1?: string;
  telefono_2?: string;
  email_empresa?: string;
  status: string;
}

interface Props {
  initial?: EmpresaFormData;
  holdings?: string[];
  onClose: () => void;
  onSave: (data: EmpresaFormData) => Promise<void>;
}

const empty: EmpresaFormData = {
  nombre: '',
  holding: '',
  rut: '',
  nombre_responsable: '',
  email_responsable: '',
  telefono_1: '',
  telefono_2: '',
  email_empresa: '',
  status: 'Activo',
};

const EmpresaForm: React.FC<Props> = ({ initial, holdings = [], onClose, onSave }) => {
  const [form, setForm] = useState<EmpresaFormData>(initial ?? empty);
  const [saving, setSaving] = useState(false);

  // Autocompletado del campo Holding
  const [holdingOpen, setHoldingOpen] = useState(false);
  const [holdingActive, setHoldingActive] = useState(-1);
  const holdingBoxRef = useRef<HTMLDivElement>(null);

  const holdingSuggestions = useMemo(() => {
    const query = (form.holding || '').trim().toLowerCase();
    return holdings
      .filter(h => h.toLowerCase().includes(query) && h.toLowerCase() !== query)
      .slice(0, 8);
  }, [holdings, form.holding]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (holdingBoxRef.current && !holdingBoxRef.current.contains(e.target as Node)) {
        setHoldingOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selectHolding = (value: string) => {
    setForm(f => ({ ...f, holding: value }));
    setHoldingOpen(false);
    setHoldingActive(-1);
  };

  const onHoldingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!holdingOpen || holdingSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHoldingActive(i => (i + 1) % holdingSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHoldingActive(i => (i <= 0 ? holdingSuggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && holdingActive >= 0) {
      e.preventDefault();
      selectHolding(holdingSuggestions[holdingActive]);
    } else if (e.key === 'Escape') {
      setHoldingOpen(false);
    }
  };

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
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={change}
            required
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div className="relative" ref={holdingBoxRef}>
          <label className="block text-sm font-medium text-gray-700">Holding</label>
          <input
            name="holding"
            value={form.holding}
            onChange={e => { change(e); setHoldingOpen(true); setHoldingActive(-1); }}
            onFocus={() => setHoldingOpen(true)}
            onKeyDown={onHoldingKeyDown}
            autoComplete="off"
            role="combobox"
            aria-expanded={holdingOpen && holdingSuggestions.length > 0}
            aria-autocomplete="list"
            className="mt-1 w-full border rounded px-3 py-2"
          />
          {holdingOpen && holdingSuggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border rounded shadow-lg">
              {holdingSuggestions.map((h, i) => (
                <li
                  key={h}
                  onMouseDown={e => { e.preventDefault(); selectHolding(h); }}
                  onMouseEnter={() => setHoldingActive(i)}
                  className={`px-3 py-2 text-sm cursor-pointer ${i === holdingActive ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                >
                  {h}
                </li>
              ))}
            </ul>
          )}
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
            name="nombre_responsable"
            value={form.nombre_responsable || ''}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email del Responsable</label>
          <input
            type="email"
            name="email_responsable"
            value={form.email_responsable || ''}
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
          <label className="block text-sm font-medium text-gray-700">Email de la Empresa</label>
          <input
            type="email"
            name="email_empresa"
            value={form.email_empresa || ''}
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