import React, { useState, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { type Sence } from '../services/sence';

interface Props {
  initial?: Partial<Sence>;
  onCancel: () => void;
  onSave: (data: Partial<Sence>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const empty: Partial<Sence> = {
  codigo_sence: '',
  nombre_sence: '',
  horas_teoricas: undefined,
  horas_practicas: undefined,
  horas_elearning: undefined,
  horas_totales: undefined,
  numero_participantes: undefined,
  termino_vigencia: '',
  area: '',
  especialidad: '',
  modalidad_instruccion: '',
  modo: '',
  valor_efectivo_participante: undefined,
  valor_maximo_imputable: undefined,
  numero_solicitud: '',
  fecha_resolucion: '',
  numero_resolucion: '',
  valor_hora_imputable: undefined,
  exclusivo_cliente: undefined,
  dirigido_por_relator: undefined,
  incluye_tablet: undefined,
  otec: '',
};

const NUMERIC_FIELDS: Array<keyof Sence> = [
  'horas_teoricas',
  'horas_practicas',
  'horas_elearning',
  'horas_totales',
  'numero_participantes',
  'valor_efectivo_participante',
  'valor_maximo_imputable',
  'valor_hora_imputable',
];

const BOOLEAN_FIELDS: Array<keyof Sence> = [
  'exclusivo_cliente',
  'dirigido_por_relator',
  'incluye_tablet',
];

const SenceForm: React.FC<Props> = ({ initial, onCancel, onSave, onDelete }) => {
  const [form, setForm] = useState<Partial<Sence>>({ ...empty, ...(initial as any) });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = Boolean(initial && initial._id);

  useEffect(() => {
    setForm({ ...empty, ...(initial as any) });
  }, [initial]);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const key = name as keyof Sence;
    setForm((f) => {
      if (NUMERIC_FIELDS.includes(key)) {
        return { ...f, [key]: value === '' ? undefined : Number(value) };
      }
      if (BOOLEAN_FIELDS.includes(key)) {
        return { ...f, [key]: value === '' ? undefined : value === 'true' };
      }
      return { ...f, [key]: value };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<Sence> = { ...form };
      payload.codigo_sence = (payload.codigo_sence || '').toString().trim();
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form._id || !onDelete) return;
    if (!window.confirm('¿Está seguro de que desea eliminar este registro Sence? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeleting(true);
    try {
      await onDelete(form._id);
    } finally {
      setDeleting(false);
    }
  };

  const textField = (name: keyof Sence, label: string, opts?: { required?: boolean; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}{opts?.required ? ' *' : ''}</label>
      <input
        name={name}
        value={(form[name] as string) ?? ''}
        onChange={change}
        required={opts?.required}
        placeholder={opts?.placeholder}
        className="mt-1 w-full border rounded px-3 py-2"
      />
    </div>
  );

  const numberField = (name: keyof Sence, label: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        name={name}
        value={form[name] != null ? String(form[name]) : ''}
        onChange={change}
        className="mt-1 w-full border rounded px-3 py-2"
        placeholder="0"
      />
    </div>
  );

  const boolField = (name: keyof Sence, label: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        name={name}
        value={form[name] == null ? '' : String(form[name])}
        onChange={change}
        className="mt-1 w-full border rounded px-3 py-2"
      >
        <option value="">Seleccione...</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {textField('codigo_sence', 'Código Sence', { required: true, placeholder: 'Ej: 1234567890' })}
        {textField('nombre_sence', 'Nombre SENCE')}
        {numberField('horas_teoricas', 'Horas Teóricas')}
        {numberField('horas_practicas', 'Horas Prácticas')}
        {numberField('horas_elearning', 'Horas E-learning')}
        {numberField('horas_totales', 'Horas Totales')}
        {numberField('numero_participantes', 'N° Participantes')}
        {textField('termino_vigencia', 'Término Vigencia')}
        {textField('area', 'Área')}
        {textField('especialidad', 'Especialidad')}
        {textField('modalidad_instruccion', 'Modalidad de instrucción')}
        {textField('modo', 'Modo')}
        {numberField('valor_efectivo_participante', 'Valor efectivo / participante')}
        {numberField('valor_maximo_imputable', 'Valor máximo imputable')}
        {textField('numero_solicitud', 'N° Solicitud')}
        {textField('fecha_resolucion', 'Fecha Resolución')}
        {textField('numero_resolucion', 'N° Resolución')}
        {numberField('valor_hora_imputable', 'Valor Hora Imputable')}
        {boolField('exclusivo_cliente', 'Exclusivo cliente')}
        {boolField('dirigido_por_relator', 'Dirigido por relator')}
        {boolField('incluye_tablet', 'Incluye Tablet')}
        {textField('otec', 'OTEC')}
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
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
            {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Registro')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SenceForm;
