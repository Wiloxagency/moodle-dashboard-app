import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { type Inscripcion } from '../services/inscripciones';
import { apiService } from '../services/api';
import { modalidadesApi, type Modalidad } from '../services/modalidades';
import { ejecutivosApi, type Ejecutivo } from '../services/ejecutivos';
import { senceApi, type Sence } from '../services/sence';

interface Props {
  initial?: Partial<Inscripcion>;
  onCancel: () => void;
  onSave: (data: Inscripcion) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  empresaByCode?: Record<number, string>;
  empresaByName?: Record<string, number>;
  defaultEmpresaCode?: number;
}

const empty: Inscripcion = {
  numeroInscripcion: 0, // autogenerado (numeric)
  correlativo: 0,
  // Mantener campos requeridos por el tipo, aunque no se editen en UI
  codigoCurso: '',
  statusAlumnos: 'Pendiente',
  empresa: 0,
  codigoSence: undefined,
  ordenCompra: undefined,
  idSence: undefined,
  idMoodle: '',
  nombreCurso: undefined,
  modalidad: 'e-learning',
  inicio: '',
  termino: undefined,
  ejecutivo: '',
  numAlumnosInscritos: 0,
  valorInicial: undefined,
  responsable: undefined,
  comentarios: undefined,
};

const toDisplayDate = (iso: string | undefined) => {
  if (!iso) return '';
  try {
      const parts = iso.substring(0, 10).split('-');
      if (parts.length < 3) return '';
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
  } catch { return ''; }
};

const toISODate = (display: string) => {
  const parts = display.split('/');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const yy = String(y);
  return `${yy}-${mm}-${dd}T00:00:00.000Z`;
};

const InscripcionForm: React.FC<Props> = ({ initial, onCancel, onSave, onDelete, empresaByCode, empresaByName, defaultEmpresaCode }) => {
  const [form, setForm] = useState<Inscripcion>({ ...empty, ...(initial as any) });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [ejecutivos, setEjecutivos] = useState<Ejecutivo[]>([]);
  const [senceItems, setSenceItems] = useState<Sence[]>([]);

  // Local state for date inputs
  const [inicioStr, setInicioStr] = useState('');
  const [terminoStr, setTerminoStr] = useState('');

  const isEditing = Boolean(initial && (initial as any)._id);

  const normalizeEmpresaCode = (value: any): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const raw = String(value).trim();
    if (!raw) return undefined;
    const num = Number(raw);
    if (Number.isFinite(num)) return num;
    const mapped = empresaByName?.[raw.toLowerCase()];
    if (mapped !== undefined) return mapped;
    return undefined;
  };

  const empresaLabel = useMemo(() => {
    const normalized = normalizeEmpresaCode(form.empresa);
    if (normalized !== undefined && empresaByCode?.[normalized]) return empresaByCode[normalized];
    if (form.empresa !== undefined && form.empresa !== null && form.empresa !== '') return String(form.empresa);
    return '';
  }, [form.empresa, empresaByCode]);

  useEffect(() => {
    const newState = { ...empty, ...(initial as any) } as any;
    const normalizedEmpresa = normalizeEmpresaCode(newState.empresa);
    if (normalizedEmpresa !== undefined) {
      newState.empresa = normalizedEmpresa;
    } else if (newState.empresa === undefined || newState.empresa === null || newState.empresa === '') {
      if (defaultEmpresaCode !== undefined) newState.empresa = defaultEmpresaCode;
    }
    setForm(newState);
    setInicioStr(toDisplayDate(newState.inicio));
    setTerminoStr(toDisplayDate(newState.termino));
  }, [initial, defaultEmpresaCode, empresaByName]);

  useEffect(() => {
    let mounted = true;
    const loadOptions = async () => {
      try {
        const [mods, ejs, scs] = await Promise.all([
          modalidadesApi.list(),
          ejecutivosApi.list(),
          senceApi.list(),
        ]);
        if (!mounted) return;
        setModalidades(mods);
        setEjecutivos(ejs.filter(e => !e.status || e.status.toLowerCase() === 'activo'))
        setSenceItems(scs);
      } catch (err) {
        console.error('Error cargando modalidades/ejecutivos para el formulario de inscripción', err);
      }
    };
    loadOptions();
    return () => { mounted = false; };
  }, []);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numeric = ['numAlumnosInscritos', 'valorInicial', 'correlativo', 'empresa'];
    setForm((f) => ({
      ...f,
      [name]: numeric.includes(name) ? (value === '' ? (undefined as any) : Number(value)) : value,
    }));
  };

  const handleDateChange = (field: 'inicio' | 'termino', val: string) => {
      // Allow numbers and slashes only
      if (!/^[\d\/]*$/.test(val)) return;
      if (val.length > 10) return;

      if (field === 'inicio') setInicioStr(val);
      else setTerminoStr(val);

      // Validate format dd/mm/yyyy
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
          const iso = toISODate(val);
          if (iso) {
              setForm(prev => ({ ...prev, [field]: iso }));
          }
      } else if (val === '') {
          setForm(prev => ({ ...prev, [field]: undefined }));
      }
  };

  const handleVerifyMoodle = async () => {
    const id = String(form.idMoodle || '').trim();
    if (!id) {
      window.alert('Ingrese ID Moodle');
      return;
    }
    setVerifying(true);
    try {
      const res: any = await apiService.getCoursesByField('id', id);
      const courses = (res as any)?.courses || (res as any)?.data?.courses || [];
      const course = Array.isArray(courses) && courses.length ? courses[0] : null;
      const name = course?.fullname || course?.displayname || course?.shortname;
      if (name) {
        setForm((prev) => ({ ...prev, nombreCurso: String(name) }));
      } else {
        window.alert('No se encontró el curso para el ID indicado');
      }
    } catch (e) {
      console.error('Error verificando curso en Moodle', e);
      window.alert('No se pudo obtener el curso desde Moodle');
    } finally {
      setVerifying(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (payload._id) delete payload._id;
      if (!payload.numeroInscripcion) delete payload.numeroInscripcion;
      // Backend requiere codigoCurso; si no viene desde UI, usamos idMoodle como fallback
      if (!payload.codigoCurso || String(payload.codigoCurso).trim() === '') {
        if (payload.idMoodle && String(payload.idMoodle).trim() !== '') {
          payload.codigoCurso = String(payload.idMoodle).trim();
        }
      }
      // Asegurar statusAlumnos por defecto
      if (!payload.statusAlumnos || String(payload.statusAlumnos).trim() === '') {
        payload.statusAlumnos = 'Pendiente';
      }
      // Normalizar empresa a número
      const normalizedEmpresa = normalizeEmpresaCode(payload.empresa);
      if (normalizedEmpresa !== undefined) {
        payload.empresa = normalizedEmpresa;
      } else if (defaultEmpresaCode !== undefined) {
        payload.empresa = defaultEmpresaCode;
      }
      // Validar fecha de inicio provista desde el input de texto
      if (!payload.inicio && inicioStr) {
        const iso = toISODate(inicioStr);
        if (iso) payload.inicio = iso;
      }
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!(form as any)._id || !onDelete) return;
    if (!window.confirm('¿Está seguro de que desea eliminar esta inscripción? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    try {
      await onDelete((form as any)._id as string);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">N° Inscripción</label>
          <input 
            name="numeroInscripcion" 
            value={form.numeroInscripcion || ''} 
            onChange={change} 
            className="mt-1 w-full border rounded px-3 py-2" 
            placeholder="Se genera al guardar" 
            disabled 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Empresa</label>
          <input name="empresa" value={empresaLabel} onChange={change} className="mt-1 w-full border rounded px-3 py-2 bg-gray-100" disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">N° Correlativo <span className="text-red-500">*</span></label>
          <input type="number" name="correlativo" value={form.correlativo ?? ''} onChange={change} required className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Orden de Compra</label>
          <input name="ordenCompra" value={form.ordenCompra || ''} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Código Sence</label>
          <select
            name="codigoSence"
            value={form.codigoSence || ''}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          >
            <option value="">Seleccione...</option>
            {senceItems.map((s) => {
              const code = s.codigo_sence || String(s.code);
              const name = (s.nombre_sence || '').trim();
              const show = name.length > 50 ? name.slice(0, 47) + '...' : name;
              return (<option key={s._id || code} value={code}>{`${code} - ${show}`}</option>);
            })}
            {form.codigoSence && !senceItems.some((s) => (s.codigo_sence || String(s.code)) === form.codigoSence) && (
              <option value={form.codigoSence}>{form.codigoSence} (actual)</option>
            )}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">ID Sence</label>
          <input name="idSence" value={form.idSence || ''} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">ID Moodle <span className="text-red-500">*</span></label>
          <div className="mt-1 flex items-center gap-2">
            <input name="idMoodle" value={form.idMoodle || ''} onChange={change} required className="w-full border rounded px-3 py-2" />
            <button
              type="button"
              onClick={handleVerifyMoodle}
              disabled={verifying}
              className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {verifying ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre del Curso</label>
          <input name="nombreCurso" value={form.nombreCurso || ''} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
<div>
          <label className="block text-sm font-medium text-gray-700">Modalidad <span className="text-red-500">*</span></label>
          <select
            name="modalidad"
            required
            value={form.modalidad || ''}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          >
            <option value="">Seleccione modalidad...</option>
            {modalidades.map(m => {
              const labels: string[] = [];
              if (m.sincronico) labels.push('Sincrónico');
              if (m.asincronico) labels.push('Asincrónico');
              if (m.sincronico_online) labels.push('Sincrónico On-line');
              if (m.sincronico_presencial_moodle) labels.push('Sincrónico Presencial Moodle');
              if (m.sincronico_presencial_no_moodle) labels.push('Sincrónico Presencial No-Moodle');
              const labelBase = labels.join(' | ') || `Modalidad ${m.code}`;
              const label = m.nombre || labelBase;
              return (
                <option key={m._id || m.code} value={label}>
                  {label}
                </option>
              );
            })}
            {form.modalidad && !modalidades.some(m => {
              const labels: string[] = [];
              if (m.sincronico) labels.push('Sincrónico');
              if (m.asincronico) labels.push('Asincrónico');
              if (m.sincronico_online) labels.push('Sincrónico On-line');
              if (m.sincronico_presencial_moodle) labels.push('Sincrónico Presencial Moodle');
              if (m.sincronico_presencial_no_moodle) labels.push('Sincrónico Presencial No-Moodle');
              const labelBase = labels.join(' | ') || `Modalidad ${m.code}`;
              const label = m.nombre || labelBase;
              return label === form.modalidad;
            }) && (
              <option value={form.modalidad}>{form.modalidad} (actual)</option>
            )}
          </select>
        </div>
<div>
          <label className="block text-sm font-medium text-gray-700">Fecha de Inicio <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            placeholder="dd/mm/yyyy"
            value={inicioStr} 
            onChange={(e) => handleDateChange('inicio', e.target.value)} 
            required 
            className="mt-1 w-full border rounded px-3 py-2" 
          />
        </div>
<div>
          <label className="block text-sm font-medium text-gray-700">Fecha Final <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            placeholder="dd/mm/yyyy"
            value={terminoStr} 
            onChange={(e) => handleDateChange('termino', e.target.value)} 
            required 
            className="mt-1 w-full border rounded px-3 py-2" 
          />
        </div>
<div>
          <label className="block text-sm font-medium text-gray-700">Ejecutivo <span className="text-red-500">*</span></label>
          <select
            name="ejecutivo"
            required
            value={form.ejecutivo || ''}
            onChange={change}
            className="mt-1 w-full border rounded px-3 py-2"
          >
            <option value="">Seleccione ejecutivo...</option>
            {ejecutivos.map(e => {
              const label = `${e.nombres} ${e.apellidos}`.trim();
              return (
                <option key={e._id || e.code} value={label}>
                  {label}
                </option>
              );
            })}
            {form.ejecutivo && !ejecutivos.some(e => {
              const label = `${e.nombres} ${e.apellidos}`.trim();
              return label === form.ejecutivo;
            }) && (
              <option value={form.ejecutivo}>{form.ejecutivo} (actual)</option>
            )}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Num Alumnos Inscritos <span className="text-red-500">*</span></label>
          <input type="number" name="numAlumnosInscritos" value={form.numAlumnosInscritos ?? ''} onChange={change} required className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor Inicial</label>
          <input type="number" name="valorInicial" value={form.valorInicial ?? ''} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Responsable</label>
          <input name="responsable" value={form.responsable || ''} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Comentario</label>
        <textarea name="comentarios" value={form.comentarios || ''} onChange={change} className="mt-1 w-full border rounded px-3 py-2" rows={3} />
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div>
          {isEditing && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving || deleting}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || deleting}
            className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Inscripción')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default InscripcionForm;
