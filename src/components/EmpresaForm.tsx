import React, { useEffect, useMemo, useRef, useState } from 'react';
import { empresasApi, type MoodleTestResult } from '../services/empresas';
import { empresaLogoUrl } from '../whitelabel/whiteLabel';

const LOGO_MAX_BYTES = 512 * 1024;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

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
  // --- White Label ---
  whiteLabel?: boolean;
  /** Dominio desde el que el cliente entra al reporte (ej. reportes.cliente.cl). */
  wlDominio?: string;
  wlMoodleUrl?: string;
  /** Sólo se envía si se escribe uno nuevo; el guardado nunca llega al navegador. */
  wlMoodleToken?: string;
  wlMoodleVersion?: 4 | 5 | '';
  /** Logo nuevo como data URL; vacío = conservar el guardado. */
  wlLogo?: string;
  // Sólo lectura (vienen del backend)
  wlMoodleTokenSet?: boolean;
  wlLogoVersion?: string | null;
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<MoodleTestResult | null>(null);

  const logoPreview = form.wlLogo
    || (form.code !== undefined && form.wlLogoVersion ? empresaLogoUrl(form.code, form.wlLogoVersion) : '');

  const setField = (patch: Partial<EmpresaFormData>) => setForm(f => ({ ...f, ...patch }));

  const onLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      setLogoError('El logo debe ser PNG, JPG o WEBP');
      e.target.value = '';
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setLogoError('El logo no puede superar 512 KB');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField({ wlLogo: String(reader.result || '') });
    reader.onerror = () => setLogoError('No se pudo leer el archivo');
    reader.readAsDataURL(file);
  };

  const testConnection = async () => {
    setTestResult(null);
    if (!form.wlMoodleUrl?.trim()) {
      setTestResult({ ok: false, message: 'Indique la URL de Moodle' });
      return;
    }
    setTesting(true);
    try {
      const result = await empresasApi.testMoodle({
        url: form.wlMoodleUrl.trim(),
        token: form.wlMoodleToken?.trim() || undefined,
        empresaId: form._id,
        version: form.wlMoodleVersion ? Number(form.wlMoodleVersion) : undefined,
      });
      setTestResult(result);
      // Si no se eligió versión y el sitio es 4 o 5, se propone la detectada.
      if (!form.wlMoodleVersion && (result.major === 4 || result.major === 5)) {
        setField({ wlMoodleVersion: result.major });
      }
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'No se pudo probar la conexión' });
    } finally {
      setTesting(false);
    }
  };

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
    setSaveError(null);
    if (form.whiteLabel && !form.wlLogo && !form.wlLogoVersion) {
      setSaveError('El logo de la empresa es obligatorio para White Label');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error guardando la empresa');
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

      {/* White Label */}
      <div className="border-t pt-4 space-y-4">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.whiteLabel}
            onChange={e => { setField({ whiteLabel: e.target.checked }); setTestResult(null); }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-800">White Label</span>
        </label>
        <p className="text-xs text-gray-500 -mt-2">
          La empresa usa su propio Moodle (versión 4 o 5) y entra por su propio dominio, con su logo. Ahí sólo ve
          sus datos, no hay VMICA y no se pueden crear superusuarios.
        </p>

        {form.whiteLabel && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Dominio del reporte</label>
              <input
                name="wlDominio"
                value={form.wlDominio || ''}
                onChange={change}
                required
                placeholder="reportes.cliente.cl"
                className="mt-1 w-full border rounded px-3 py-2"
              />
              <p className="mt-1 text-xs text-gray-500">Debe apuntar (DNS) al servidor de reportes.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">URL Moodle</label>
              <input
                type="url"
                name="wlMoodleUrl"
                value={form.wlMoodleUrl || ''}
                onChange={change}
                required
                placeholder="https://campus.cliente.cl"
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Token Moodle</label>
              <input
                type="password"
                name="wlMoodleToken"
                value={form.wlMoodleToken || ''}
                onChange={change}
                required={!form.wlMoodleTokenSet}
                autoComplete="new-password"
                placeholder={form.wlMoodleTokenSet ? 'Guardado — dejar vacío para mantenerlo' : ''}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Versión Moodle</label>
              <select
                name="wlMoodleVersion"
                value={form.wlMoodleVersion ?? ''}
                onChange={e => setField({ wlMoodleVersion: e.target.value === '' ? '' : (Number(e.target.value) as 4 | 5) })}
                required
                className="mt-1 w-full border rounded px-3 py-2"
              >
                <option value="">Seleccione…</option>
                <option value="4">Moodle 4</option>
                <option value="5">Moodle 5</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Logo de la empresa</label>
              <div className="mt-1 flex items-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-14 w-auto max-w-[200px] object-contain border rounded bg-white p-1" />
                ) : (
                  <div className="h-14 w-28 border rounded bg-gray-50 text-xs text-gray-400 flex items-center justify-center">Sin logo</div>
                )}
                <input type="file" accept={LOGO_TYPES.join(',')} onChange={onLogoFile} className="text-sm" />
              </div>
              <p className="mt-1 text-xs text-gray-500">PNG, JPG o WEBP, máximo 512 KB. Se muestra en el login y en la cabecera.</p>
              {logoError && <p className="mt-1 text-xs text-red-600">{logoError}</p>}
            </div>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={testConnection}
                disabled={testing}
                className="px-3 py-2 text-sm rounded border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
              >
                {testing ? 'Probando…' : 'Probar conexión con Moodle'}
              </button>
              {testResult && (
                <div className={`mt-2 text-sm rounded px-3 py-2 border ${testResult.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <p className="font-medium">{testResult.message}</p>
                  {testResult.sitename && (
                    <p className="text-xs mt-1">Sitio: {testResult.sitename} · Moodle {testResult.release}</p>
                  )}
                  {testResult.missingFunctions && testResult.missingFunctions.length > 0 && (
                    <p className="text-xs mt-1 break-words">
                      Agregue al servicio web del token: {testResult.missingFunctions.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {saveError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{saveError}</div>
      )}

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