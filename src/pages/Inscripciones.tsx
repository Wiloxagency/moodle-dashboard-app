import React, { useEffect, useMemo, useState } from 'react';
import InscripcionesTable from '../components/InscripcionesTable';
import InscripcionForm from '../components/InscripcionForm';
import { inscripcionesApi, type Inscripcion } from '../services/inscripciones';
import { participantesApi } from '../services/participantes';
import { empresasApi, type Empresa } from '../services/empresas';
import { modalidadesApi, type Modalidad } from '../services/modalidades';
import { ejecutivosApi, type Ejecutivo } from '../services/ejecutivos';
import { useAuth } from '../context/AuthContext';

const Inscripciones: React.FC = () => {
  const { user } = useAuth();
  const empresaCode = user?.empresa;

  const [allData, setAllData] = useState<Inscripcion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<Inscripcion> | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [ejecutivos, setEjecutivos] = useState<Ejecutivo[]>([]);

  const getModalidadLabel = (m: Modalidad) => {
    if (m.nombre && m.nombre.trim() !== '') return m.nombre.trim();
    const labels: string[] = [];
    if (m.sincronico) labels.push('Sincrónico');
    if (m.asincronico) labels.push('Asincrónico');
    if (m.sincronico_online) labels.push('Sincrónico On-line');
    if (m.sincronico_presencial_moodle) labels.push('Sincrónico Presencial Moodle');
    if (m.sincronico_presencial_no_moodle) labels.push('Sincrónico Presencial No-Moodle');
    return labels.join(' | ') || `Modalidad ${m.code}`;
  };

  const getEjecutivoLabel = (e: Ejecutivo) => {
    const apellidos = (e as any).apellidos ?? (e as any).apellido ?? '';
    return `${e.nombres} ${apellidos}`.trim();
  };




  const empresaByCode = useMemo(() => {
    const map: Record<number, string> = {};
    for (const e of empresas) map[e.code] = e.nombre;
    return map;
  }, [empresas]);

  const modalidadByCode = useMemo(() => {
    const map: Record<number, string> = {};
    for (const m of modalidades) map[m.code] = getModalidadLabel(m);
    return map;
  }, [modalidades]);

  const ejecutivoByCode = useMemo(() => {
    const map: Record<number, string> = {};
    for (const e of ejecutivos) map[e.code] = getEjecutivoLabel(e);
    return map;
  }, [ejecutivos]);

  const empresaByName = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of empresas) {
      const key = (e.nombre || '').trim().toLowerCase();
      if (key) map[key] = e.code;
    }
    return map;
  }, [empresas]);

  const normalizeEmpresaCode = (value: any): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const raw = String(value).trim();
    if (!raw) return undefined;
    const num = Number(raw);
    if (Number.isFinite(num)) return num;
    const mapped = empresaByName[raw.toLowerCase()];
    if (mapped !== undefined) return mapped;
    return undefined;
  };

  const data = useMemo(() => {
    const rows = [...allData];
    if (empresaCode === undefined || empresaCode === null) return rows;
    const target = Number(empresaCode);
    if (!Number.isFinite(target)) return rows;
    return rows.filter((item) => normalizeEmpresaCode(item.empresa) === target);
  }, [allData, empresaCode, empresaByName]);

  const load = async () => {
    const items = await inscripcionesApi.list();
    setAllData(items);
    // cache for perceived performance
    sessionStorage.setItem('inscripcionesCache', JSON.stringify(items));
  };

  const loadCatalogs = async () => {
    try {
      const [empresaItems, modalidadItems, ejecutivoItems] = await Promise.all([
        empresasApi.list(),
        modalidadesApi.list(),
        ejecutivosApi.list(),
      ]);
      setEmpresas(empresaItems);
      setModalidades(modalidadItems);
      setEjecutivos(ejecutivoItems);
    } catch (e) {
      console.warn('Failed to fetch catalogs', e);
    }
  };

  useEffect(() => {
    // Use cached data for instant render
    const cached = sessionStorage.getItem('inscripcionesCache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Inscripcion[];
        setAllData(parsed);
      } catch {}
    }
    load();
    loadCatalogs();
  }, []);

  useEffect(() => {
    if (!data.length) {
      setCounts({});
      return;
    }
    participantesApi.counts(data.map(i => i.numeroInscripcion))
      .then(setCounts)
      .catch((e) => console.warn('Failed to fetch participant counts', e));
  }, [data]);

  const handleSave = async (payload: Inscripcion) => {
    if (editing && editing._id) {
      await inscripcionesApi.update(editing._id, payload);
    } else {
      await inscripcionesApi.create(payload);
    }
    setShowForm(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    await inscripcionesApi.delete(id);
    setShowForm(false);
    setEditing(null);
    await load();
  };

  const openForNew = () => {
    // Calcular el número de inscripción siguiente en base a los datos actuales
    const usedNumbers = new Set<number>();
    let maxNumero = 0;

    for (const ins of data) {
      if (!ins.numeroInscripcion) continue;
      usedNumbers.add(Number(ins.numeroInscripcion));
      const n = Number(ins.numeroInscripcion);
      if (!Number.isNaN(n) && n > maxNumero) {
        maxNumero = n;
      }
    }

    // Punto de partida: 100000 si no hay registros
    let next = maxNumero > 0 ? maxNumero + 1 : 100000;

    // Evitar duplicados por seguridad
    while (usedNumbers.has(next)) {
      next++;
    }

    const nextEditing: Partial<Inscripcion> = { numeroInscripcion: next };
    if (empresaCode !== undefined && empresaCode !== null) {
      const normalized = Number(empresaCode);
      if (Number.isFinite(normalized)) nextEditing.empresa = normalized;
    }

    setEditing(nextEditing);
    setShowForm(true);
  };

  const openForEdit = (item: Inscripcion) => {
    setEditing(item);
    setShowForm(true);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <InscripcionesTable 
            data={data} 
            participantCounts={counts} 
            onNew={openForNew} 
            onEdit={openForEdit} 
            empresaByCode={empresaByCode}
            modalidadByCode={modalidadByCode}
            ejecutivoByCode={ejecutivoByCode}
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing ? 'Editar Inscripción' : 'Nueva Inscripción'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <InscripcionForm 
              initial={editing || undefined} 
              onCancel={() => { setShowForm(false); setEditing(null); }} 
              onSave={handleSave}
              onDelete={editing && editing._id ? handleDelete : undefined}
              empresaByCode={empresaByCode}
            modalidadByCode={modalidadByCode}
            ejecutivoByCode={ejecutivoByCode}
              empresaByName={empresaByName}
              defaultEmpresaCode={empresaCode}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Inscripciones;
