import React, { useState, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { type Inscripcion } from '../services/inscripciones';

interface Props {
  initial?: Partial<Inscripcion>;
  onCancel: () => void;
  onSave: (data: Inscripcion) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const empty: Inscripcion = {
  numeroInscripcion: '',
  cliente: '',
  nombreCurso: '',
  modalidad: 'E-Learning',
  inicio: '',
  termino: '',
  ejecutivo: '',
  numAlumnosInscritos: 0,
  valorInicial: 0,
  valorFinal: 0,
  statusAlumnos: 'Pendiente',
  comentarios: ''
};

const InscripcionForm: React.FC<Props> = ({ initial, onCancel, onSave, onDelete }) => {
  const [form, setForm] = useState<Inscripcion>({ ...empty, ...(initial as any) });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = Boolean(initial && initial._id);

  useEffect(() => {
    setForm({ ...empty, ...(initial as any) });
  }, [initial]);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name.includes('valor') || name === 'numAlumnosInscritos' ? Number(value) : value }));
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

  const handleDelete = async () => {
    if (!form._id || !onDelete) return;
    
    if (!window.confirm('¿Está seguro de que desea eliminar esta inscripción? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(form._id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">N° Inscripción</label>
          <input name="numeroInscripcion" value={form.numeroInscripcion} onChange={change} required className="mt-1 w-full border rounded px-3 py-2" />
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
          <label className="block text-sm font-medium text-gray-700">ID Moodle</label>
          <input name="idMoodle" value={form.idMoodle || ''} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cliente</label>
          <input name="cliente" value={form.cliente} onChange={change} required className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre Curso</label>
          <input name="nombreCurso" value={form.nombreCurso} onChange={change} required className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Modalidad</label>
          <select name="modalidad" value={form.modalidad} onChange={change} className="mt-1 w-full border rounded px-3 py-2">
            <option value="E-Learning">E-Learning</option>
            <option value="Sincrónico">Sincrónico</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Inicio</label>
          <input type="date" name="inicio" value={form.inicio ? form.inicio.substring(0,10) : ''} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Termino</label>
          <input type="date" name="termino" value={form.termino ? form.termino.substring(0,10) : ''} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ejecutivo</label>
          <input name="ejecutivo" value={form.ejecutivo} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Num Alumnos Inscritos</label>
          <input type="number" name="numAlumnosInscritos" value={form.numAlumnosInscritos} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor INICIAL</label>
          <input type="number" name="valorInicial" value={form.valorInicial} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor FINAL</label>
          <input type="number" name="valorFinal" value={form.valorFinal} onChange={change} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status de Alumnos</label>
          <select name="statusAlumnos" value={form.statusAlumnos} onChange={change} className="mt-1 w-full border rounded px-3 py-2">
            <option>Pendiente</option>
            <option>En curso</option>
            <option>Finalizado</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Comentarios</label>
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
