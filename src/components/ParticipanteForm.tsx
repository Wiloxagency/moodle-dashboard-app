import React, { useState, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { type Participante } from '../services/participantes';

interface Props {
  initial?: Partial<Participante>;
  numeroInscripcion: string;
  onCancel: () => void;
  onSave: (data: Participante) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const empty: Omit<Participante, '_id'> = {
  numeroInscripcion: '',
  nombres: '',
  apellidos: '',
  rut: '',
  mail: '',
  telefono: '',
  franquiciaPorcentaje: undefined,
  costoOtic: undefined,
  costoEmpresa: undefined,
  estadoInscripcion: '',
  observacion: ''
};

const ParticipanteForm: React.FC<Props> = ({ initial, numeroInscripcion, onCancel, onSave, onDelete }) => {
  const [form, setForm] = useState<Participante>({ 
    ...empty, 
    numeroInscripcion,
    ...(initial as any) 
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = Boolean(initial && initial._id);

  useEffect(() => {
    setForm({ 
      ...empty, 
      numeroInscripcion,
      ...(initial as any) 
    });
  }, [initial, numeroInscripcion]);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ 
      ...f, 
      [name]: name === 'franquiciaPorcentaje' || name === 'costoOtic' || name === 'costoEmpresa'
        ? (value === '' ? undefined : Number(value))
        : value 
    }));
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
    
    if (!window.confirm('¿Está seguro de que desea eliminar este participante? Esta acción no se puede deshacer.')) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombres *</label>
          <input 
            name="nombres" 
            value={form.nombres} 
            onChange={change} 
            required 
            className="mt-1 w-full border rounded px-3 py-2" 
            placeholder="Ingrese los nombres"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Apellidos *</label>
          <input 
            name="apellidos" 
            value={form.apellidos} 
            onChange={change} 
            required 
            className="mt-1 w-full border rounded px-3 py-2" 
            placeholder="Ingrese los apellidos"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">RUT *</label>
          <input 
            name="rut" 
            value={form.rut} 
            onChange={change} 
            required 
            className="mt-1 w-full border rounded px-3 py-2" 
            placeholder="12.345.678-9"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email *</label>
          <input 
            type="email"
            name="mail" 
            value={form.mail} 
            onChange={change} 
            required 
            className="mt-1 w-full border rounded px-3 py-2" 
            placeholder="correo@ejemplo.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input 
            name="telefono" 
            value={form.telefono || ''} 
            onChange={change} 
            className="mt-1 w-full border rounded px-3 py-2" 
            placeholder="+56 9 1234 5678"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">% Franquicia</label>
          <input 
            type="number"
            name="franquiciaPorcentaje" 
            value={form.franquiciaPorcentaje ?? ''} 
            onChange={change} 
            min="0"
            max="100"
            className="mt-1 w-full border rounded px-3 py-2" 
            placeholder="0-100"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Costo OTIC</label>
          <input 
            type="number"
            name="costoOtic" 
            value={form.costoOtic ?? ''} 
            onChange={change} 
            min="0"
            className="mt-1 w-full border rounded px-3 py-2" 
            placeholder="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Costo Empresa</label>
          <input 
            type="number"
            name="costoEmpresa" 
            value={form.costoEmpresa ?? ''} 
            onChange={change} 
            min="0"
            className="mt-1 w-full border rounded px-3 py-2" 
            placeholder="0"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Estado Inscripción</label>
          <select 
            name="estadoInscripcion" 
            value={form.estadoInscripcion || ''} 
            onChange={change} 
            className="mt-1 w-full border rounded px-3 py-2"
          >
            <option value="">Seleccionar estado</option>
            <option value="Inscrito">Inscrito</option>
            <option value="En curso">En curso</option>
            <option value="Finalizado">Finalizado</option>
            <option value="Abandonado">Abandonado</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Observación</label>
        <textarea 
          name="observacion" 
          value={form.observacion || ''} 
          onChange={change} 
          className="mt-1 w-full border rounded px-3 py-2" 
          rows={3}
          placeholder="Comentarios o notas adicionales..."
        />
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
            {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Participante')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ParticipanteForm;
