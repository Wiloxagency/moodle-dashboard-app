import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Trash2, Loader2, CalendarDays } from 'lucide-react';
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
  modalidadByCode?: Record<number, string>;
  ejecutivoByCode?: Record<number, string>;
}

const empty: Inscripcion = {
  numeroInscripcion: 0, // autogenerado (numeric)
  correlativo: 0,
  // Mantener campos requeridos por el tipo, aunque no se editen en UI
  codigoCurso: '',
  statusAlumnos: 'Pendiente',
  empresa: undefined as any,
  codigoSence: undefined,
  ordenCompra: undefined,
  idSence: undefined,
  idMoodle: '',
  nombreCurso: undefined,
  modalidad: '' as any,
  inicio: '',
  termino: undefined,
  ejecutivo: '' as any,
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

const toDateInputValue = (iso: string | undefined) => {
  if (!iso) return '';
  const datePart = iso.substring(0, 10);
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return '';
  return `${y}-${m}-${d}`;
};

const fromDateInputValueToDisplay = (value: string) => {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
};

const fromDateInputValueToISO = (value: string) => {
  if (!value) return undefined;
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return undefined;
  return `${y}-${m}-${d}T00:00:00.000Z`;
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
  const [empresaSearch, setEmpresaSearch] = useState('');
  const [senceSearch, setSenceSearch] = useState('');
  const [empresaOpen, setEmpresaOpen] = useState(false);
  const [senceOpen, setSenceOpen] = useState(false);
  const inicioDatePickerRef = useRef<HTMLInputElement | null>(null);
  const terminoDatePickerRef = useRef<HTMLInputElement | null>(null);

  const isEditing = Boolean(initial && (initial as any)._id);
  const isAllEmpresasMode = defaultEmpresaCode === undefined || defaultEmpresaCode === null;

  const empresaOptions = useMemo(() => {
    return Object.entries(empresaByCode || {})
      .map(([code, nombre]) => ({ code: Number(code), nombre: String(nombre || '').trim() }))
      .filter((item) => Number.isFinite(item.code) && item.nombre !== '')
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  }, [empresaByCode]);

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

  const normalizeText = (value?: string) => (value || '').trim().toLowerCase();

  const filteredEmpresaOptions = useMemo(() => {
    const query = normalizeText(empresaSearch);
    if (!query) return empresaOptions;
    return empresaOptions.filter((empresa) =>
      String(empresa.code).includes(query) || normalizeText(empresa.nombre).includes(query)
    );
  }, [empresaOptions, empresaSearch]);

  const senceOptions = useMemo(() => {
    return senceItems.map((item) => {
      const code = String(item.codigo_sence || item.code || '').trim();
      const nombre = String(item.nombre_sence || '').trim();
      const descripcion = [nombre, item.area, item.especialidad]
        .map((part) => String(part || '').trim())
        .filter((part) => part !== '')
        .join(' | ');
      return {
        key: item._id || code,
        code,
        nombre,
        descripcion,
      };
    });
  }, [senceItems]);

  const filteredSenceOptions = useMemo(() => {
    const query = normalizeText(senceSearch);
    if (!query) return senceOptions;
    return senceOptions.filter((item) =>
      normalizeText(item.code).includes(query) ||
      normalizeText(item.nombre).includes(query) ||
      normalizeText(item.descripcion).includes(query)
    );
  }, [senceOptions, senceSearch]);

  const getSenceOptionLabel = (code: string) => {
    const found = senceOptions.find((item) => item.code === code);
    if (!found) return code;
    return found.nombre ? `${found.code} - ${found.nombre}` : found.code;
  };

  const buildEjecutivoLabel = (e: Ejecutivo) => {
    const apellidos = (e as any).apellidos ?? (e as any).apellido ?? '';
    return `${e.nombres} ${apellidos}`.trim();
  };

  const modalidadByLabel = useMemo(() => {
    const map: Record<string, number> = {};
    modalidades.forEach((m) => {
      const labels: string[] = [];
      if (m.sincronico) labels.push('Sincrónico');
      if (m.asincronico) labels.push('Asincrónico');
      if (m.sincronico_online) labels.push('Sincrónico On-line');
      if (m.sincronico_presencial_moodle) labels.push('Sincrónico Presencial Moodle');
      if (m.sincronico_presencial_no_moodle) labels.push('Sincrónico Presencial No-Moodle');
      const labelBase = labels.join(' | ') || `Modalidad ${m.code}`;
      const label = m.nombre || labelBase;
      const key = normalizeText(label);
      if (key) map[key] = m.code;
    });
    return map;
  }, [modalidades]);

  const ejecutivoByLabel = useMemo(() => {
    const map: Record<string, number> = {};
    ejecutivos.forEach((e) => {
      const label = buildEjecutivoLabel(e);
      const key = normalizeText(label);
      if (key) map[key] = e.code;
    });
    return map;
  }, [ejecutivos]);

  const modalidadByCode = useMemo(() => {
    const map: Record<number, string> = {};
    modalidades.forEach((m) => {
      const labels: string[] = [];
      if (m.sincronico) labels.push('Sincrónico');
      if (m.asincronico) labels.push('Asincrónico');
      if (m.sincronico_online) labels.push('Sincrónico On-line');
      if (m.sincronico_presencial_moodle) labels.push('Sincrónico Presencial Moodle');
      if (m.sincronico_presencial_no_moodle) labels.push('Sincrónico Presencial No-Moodle');
      const labelBase = labels.join(' | ') || `Modalidad ${m.code}`;
      const label = m.nombre || labelBase;
      map[m.code] = label;
    });
    return map;
  }, [modalidades]);

  const ejecutivoByCode = useMemo(() => {
    const map: Record<number, string> = {};
    ejecutivos.forEach((e) => {
      map[e.code] = buildEjecutivoLabel(e);
    });
    return map;
  }, [ejecutivos]);

  const getModalidadLabelByCode = (value: any) => {
    if (value === undefined || value === null || value === '') return '';
    const num = Number(value);
    if (!Number.isFinite(num)) return String(value);
    return modalidadByCode[num] || `Modalidad ${value}`;
  };

  const getEjecutivoLabelByCode = (value: any) => {
    if (value === undefined || value === null || value === '') return '';
    const num = Number(value);
    if (!Number.isFinite(num)) return String(value);
    return ejecutivoByCode[num] || `Ejecutivo ${value}`;
  };

  const empresaLabel = useMemo(() => {
    const normalized = normalizeEmpresaCode(form.empresa);
    if (normalized !== undefined && empresaByCode?.[normalized]) return empresaByCode[normalized];
    if (form.empresa !== undefined && form.empresa !== null && form.empresa !== 0) return String(form.empresa);
    return '';
  }, [form.empresa, empresaByCode]);

  useEffect(() => {
    const newState = { ...empty, ...(initial as any) } as any;
    const normalizedEmpresa = normalizeEmpresaCode(newState.empresa);
    if (normalizedEmpresa !== undefined) {
      newState.empresa = normalizedEmpresa;
    } else if (defaultEmpresaCode !== undefined) {
      newState.empresa = defaultEmpresaCode;
    } else {
      newState.empresa = undefined;
    }

    const selectedEmpresaCode = normalizeEmpresaCode(newState.empresa);
    if (selectedEmpresaCode !== undefined) {
      const empresaName = empresaByCode?.[selectedEmpresaCode];
      setEmpresaSearch(empresaName ? `${selectedEmpresaCode} - ${empresaName}` : String(selectedEmpresaCode));
    } else {
      setEmpresaSearch('');
    }

    const selectedSenceCode = String(newState.codigoSence || '').trim();
    if (selectedSenceCode) {
      setSenceSearch(getSenceOptionLabel(selectedSenceCode));
    } else {
      setSenceSearch('');
    }

    setForm(newState);
    setInicioStr(toDisplayDate(newState.inicio));
    setTerminoStr(toDisplayDate(newState.termino));
  }, [initial, defaultEmpresaCode, empresaByName, empresaByCode]);

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
    const numeric = ['numAlumnosInscritos', 'valorInicial', 'correlativo', 'empresa', 'modalidad', 'ejecutivo'];
    setForm((f) => ({
      ...f,
      [name]: numeric.includes(name) ? (value === '' ? (undefined as any) : Number(value)) : value,
    }));
  };

  const handleEmpresaInputChange = (value: string) => {
    setEmpresaOpen(true);
    setEmpresaSearch(value);
    if (!value.trim()) {
      setForm((prev) => ({ ...prev, empresa: undefined as any }));
    }
  };

  const handleEmpresaPick = (code: number, nombre: string) => {
    setForm((prev) => ({ ...prev, empresa: code }));
    setEmpresaSearch(nombre);
    setEmpresaOpen(false);
  };

  const handleSenceInputChange = (value: string) => {
    setSenceOpen(true);
    setSenceSearch(value);
    if (!value.trim()) {
      setForm((prev) => ({ ...prev, codigoSence: undefined }));
    }
  };

  const handleSencePick = (code: string) => {
    setForm((prev) => ({ ...prev, codigoSence: code }));
    setSenceSearch(getSenceOptionLabel(code));
    setSenceOpen(false);
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
        setForm((prev) => ({ ...prev, [field]: iso }));
      }
    } else if (val === '') {
      setForm((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDatePickerChange = (field: 'inicio' | 'termino', value: string) => {
    const display = fromDateInputValueToDisplay(value);
    const iso = fromDateInputValueToISO(value);

    if (field === 'inicio') setInicioStr(display);
    else setTerminoStr(display);

    setForm((prev) => ({ ...prev, [field]: iso }));

    if (field === 'inicio' && inicioDatePickerRef.current) {
      inicioDatePickerRef.current.blur();
    } else if (field === 'termino' && terminoDatePickerRef.current) {
      terminoDatePickerRef.current.blur();
    }
  };

  const openDatePicker = (input: HTMLInputElement | null) => {
    if (!input) return;
    const picker = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
      return;
    }
    input.focus();
    input.click();
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
      } else {
        window.alert('Seleccione una empresa');
        return;
      }
      // Normalizar modalidad/ejecutivo a códigos si vienen como texto
      if (payload.modalidad !== undefined && payload.modalidad !== null && payload.modalidad !== '') {
        const num = Number(payload.modalidad);
        if (Number.isFinite(num)) {
          payload.modalidad = num;
        } else {
          const mapped = modalidadByLabel[normalizeText(String(payload.modalidad))];
          if (mapped !== undefined) payload.modalidad = mapped;
        }
      }
      if (payload.ejecutivo !== undefined && payload.ejecutivo !== null && payload.ejecutivo !== '') {
        const num = Number(payload.ejecutivo);
        if (Number.isFinite(num)) {
          payload.ejecutivo = num;
        } else {
          const mapped = ejecutivoByLabel[normalizeText(String(payload.ejecutivo))];
          if (mapped !== undefined) payload.ejecutivo = mapped;
        }
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
          <label className="block text-sm font-medium text-gray-700">Empresa {isAllEmpresasMode && <span className="text-red-500">*</span>}</label>
          {isAllEmpresasMode ? (
            <div className="relative">
              <input
                type="text"
                value={empresaSearch}
                onChange={(e) => handleEmpresaInputChange(e.target.value)}
                onFocus={() => { setEmpresaOpen(true); setEmpresaSearch(empresaSearch); }}
                onBlur={() => setTimeout(() => setEmpresaOpen(false), 150)}
                placeholder="Buscar por nombre..."
                className="mt-1 w-full border rounded px-3 py-2"
                autoComplete="off"
              />
              {empresaOpen && filteredEmpresaOptions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-48 overflow-auto">
                  {filteredEmpresaOptions.map((empresa) => (
                    <button
                      type="button"
                      key={empresa.code}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleEmpresaPick(empresa.code, empresa.nombre)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    >
                      {empresa.nombre}
                    </button>
                  ))}
                </div>
              )}
              {empresaOpen && filteredEmpresaOptions.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">Sin resultados para la búsqueda actual.</p>
              )}
            </div>
          ) : (
            <input
              name="empresa"
              value={empresaLabel}
              onChange={change}
              className="mt-1 w-full border rounded px-3 py-2 bg-gray-100"
              disabled
            />
          )}
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
          <div className="relative">
            <input
              type="text"
              value={senceSearch}
              onChange={(e) => handleSenceInputChange(e.target.value)}
              onFocus={() => { setSenceOpen(true); setSenceSearch(senceSearch); }}
              onBlur={() => setTimeout(() => setSenceOpen(false), 150)}
              placeholder="Buscar por código, nombre o descripción..."
              className="mt-1 w-full border rounded px-3 py-2"
              autoComplete="off"
            />
            {senceOpen && filteredSenceOptions.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-48 overflow-auto">
                {filteredSenceOptions.map((item) => {
                  const show = item.nombre.length > 60 ? `${item.nombre.slice(0, 57)}...` : item.nombre;
                  return (
                    <button
                      type="button"
                      key={item.key}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSencePick(item.code)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    >
                      {item.nombre ? `${item.code} - ${show}` : item.code}
                    </button>
                  );
                })}
              </div>
            )}
            {senceOpen && filteredSenceOptions.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">Sin resultados para la búsqueda actual.</p>
            )}
          </div>
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
                <option key={m._id || m.code} value={m.code}>
                  {label}
                </option>
              );
            })}
            {form.modalidad && !modalidades.some(m => String(m.code) === String(form.modalidad)) && (
              <option value={form.modalidad}>{getModalidadLabelByCode(form.modalidad)} (actual)</option>
            )}
          </select>
        </div>
<div>
          <label className="block text-sm font-medium text-gray-700">Fecha de Inicio <span className="text-red-500">*</span></label>
          <div className="mt-1 flex items-center gap-2 relative">
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              value={inicioStr}
              onChange={(e) => handleDateChange('inicio', e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
            <button
              type="button"
              onClick={() => openDatePicker(inicioDatePickerRef.current)}
              className="px-3 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              title="Abrir calendario"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <input
              ref={inicioDatePickerRef}
              type="date"
              value={toDateInputValue(form.inicio)}
              onChange={(e) => handleDatePickerChange('inicio', e.target.value)}
              className="absolute opacity-0 w-0 h-0"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        </div>
<div>
          <label className="block text-sm font-medium text-gray-700">Fecha Final <span className="text-red-500">*</span></label>
          <div className="mt-1 flex items-center gap-2 relative">
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              value={terminoStr}
              onChange={(e) => handleDateChange('termino', e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
            <button
              type="button"
              onClick={() => openDatePicker(terminoDatePickerRef.current)}
              className="px-3 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              title="Abrir calendario"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <input
              ref={terminoDatePickerRef}
              type="date"
              value={toDateInputValue(form.termino)}
              onChange={(e) => handleDatePickerChange('termino', e.target.value)}
              className="absolute opacity-0 w-0 h-0"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
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
              const label = buildEjecutivoLabel(e);
              return (
                <option key={e._id || e.code} value={e.code}>
                  {label}
                </option>
              );
            })}
            {form.ejecutivo && !ejecutivos.some(e => String(e.code) === String(form.ejecutivo)) && (
              <option value={form.ejecutivo}>{getEjecutivoLabelByCode(form.ejecutivo)} (actual)</option>
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
