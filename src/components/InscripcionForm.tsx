import React, { useState, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { type Inscripcion } from '../services/inscripciones';
import { modalidadesApi, type Modalidad } from '../services/modalidades';
import { ejecutivosApi, type Ejecutivo } from '../services/ejecutivos';

interface Props {
  initial?: Partial<Inscripcion>;
  onCancel: () => void;
  onSave: (data: Inscripcion) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const empty: Inscripcion = {
  numeroInscripcion: 0, // autogenerado (numeric)
  correlativo: 0,
  codigoCurso: '',
  empresa: 'Mutual',
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
  valorFinal: undefined,
  statusAlumnos: 'Pendiente',
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

const InscripcionForm: React.FC<Props> = ({ initial, onCancel, onSave, onDelete }) => {
  const [form, setForm] = useState<Inscripcion>({ ...empty, ...(initial as any) });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [ejecutivos, setEjecutivos] = useState<Ejecutivo[]>([]);

  // Local state for date inputs
  const [inicioStr, setInicioStr] = useState('');
  const [terminoStr, setTerminoStr] = useState('');

  const isEditing = Boolean(initial && (initial as any)._id);

  useEffect(() => {
    const newState = { ...empty, ...(initial as any) };
    setForm(newState);
    setInicioStr(toDisplayDate(newState.inicio));
    setTerminoStr(toDisplayDate(newState.termino));
  }, [initial]);

  useEffect(() => {
    let mounted = true;
    const loadOptions = async () => {
      try {
        const [mods, ejs] = await Promise.all([
          modalidadesApi.list(),
          ejecutivosApi.list(),
        ]);
        if (!mounted) return;
        setModalidades(mods);
        setEjecutivos(ejs.filter(e => !e.status || e.status.toLowerCase() === 'activo'));
      } catch (err) {
        console.error('Error cargando modalidades/ejecutivos para el formulario de inscripción', err);
      }
    };
    loadOptions();
    return () => { mounted = false; };
  }, []);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numeric = ['numAlumnosInscritos', 'valorInicial', 'valorFinal', 'correlativo'];
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (payload._id) delete payload._id;
      if (!payload.numeroInscripcion) delete payload.numeroInscripcion;
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
          <label className="block text-sm font-medium text-gray-700">N° Correlativo <span className="text-red-500">*</span></label>
          <input type="number" name="correlativo" value={form.correlativo ?? ''} onChange={change} required className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Código del Curso <span className="text-red-500">*</span></label>
          <input name="codigoCurso" value={form.codigoCurso || ''} onChange={change} required className="mt-1 w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Código Sence</label>
          <input name="codigoSence" value={form.codigoSence || ''} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Orden de Compra</label>
          <input name="ordenCompra" value={form.ordenCompra || ''} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">ID Sence</label>
          <input name="idSence" value={form.idSence || ''} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">ID Moodle <span className="text-red-500">*</span></label>
          <input name="idMoodle" value={form.idMoodle || ''} onChange={change} required className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Empresa</label>
          <input name="empresa" value={form.empresa} onChange={change} className="mt-1 w-full border rounded px-3 py-2 bg-gray-100" disabled />
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
              const label = labels.join(' | ') || `Modalidad ${m.code}`;
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
              const label = labels.join(' | ') || `Modalidad ${m.code}`;
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
          <label className="block text-sm font-medium text-gray-700">Fecha Final</label>
          <input 
            type="text" 
            placeholder="dd/mm/yyyy"
            value={terminoStr} 
            onChange={(e) => handleDateChange('termino', e.target.value)} 
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
              const label = `${e.code != null ? `${e.code} - ` : ''}${e.nombres} ${e.apellidos}`.trim();
              return (
                <option key={e._id || e.code} value={label}>
                  {label}
                </option>
              );
            })}
            {form.ejecutivo && !ejecutivos.some(e => {
              const label = `${e.code != null ? `${e.code} - ` : ''}${e.nombres} ${e.apellidos}`.trim();
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
          <label className="block text-sm font-medium text-gray-700">Valor Final</label>
          <input type="number" name="valorFinal" value={form.valorFinal ?? ''} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status de Alumnos <span className="text-red-500">*</span></label>
          <select name="statusAlumnos" required value={form.statusAlumnos} onChange={change} className="mt-1 w-full border rounded px-3 py-2">
            <option value="Pendiente">Pendiente</option>
            <option value="En curso">En curso</option>
            <option value="Finalizado">Finalizado</option>
          </select>
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
