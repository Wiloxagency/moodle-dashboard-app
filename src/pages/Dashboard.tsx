import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatisticsCards from '../components/StatisticsCards';
import CourseTable from '../components/CourseTable';
import { dashboardApi, type DashboardCache, type DashboardInscripcion } from '../services/dashboard';
import { modalidadesApi, type Modalidad } from '../services/modalidades';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const normalizeText = (value?: string) => (value || '').trim().toLowerCase();

const formatUpdatedAt = (value?: string) => {
  if (!value) return 'Sin actualizar';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'Sin actualizar';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

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

const isActiveCourse = (termino?: string) => {
  if (!termino) return true;
  const end = new Date(termino);
  if (isNaN(end.getTime())) return true;
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end.getTime() >= today.getTime();
};

const Dashboard: React.FC = () => {
  const [cache, setCache] = useState<DashboardCache | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalidades, setModalidades] = useState<string[]>([]);

  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedModalidades, setSelectedModalidades] = useState<string[]>([]);
  const [selectedCursos, setSelectedCursos] = useState<string[]>([]);
  const [estadoCurso, setEstadoCurso] = useState({ active: true, finalizado: false });
  const [monthsInitialized, setMonthsInitialized] = useState(false);
  const [modalidadesInitialized, setModalidadesInitialized] = useState(false);
  const [cursosInitialized, setCursosInitialized] = useState(false);

  const loadCache = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await dashboardApi.getCache(refresh);
      setCache(data);
    } catch (e: any) {
      setError(e?.message || 'Error cargando dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCache(false);
  }, []);

  useEffect(() => {
    modalidadesApi
      .list()
      .then((items) => {
        const labels = items.map(getModalidadLabel).filter((v) => v.trim() !== '');
        const unique = Array.from(new Set(labels));
        setModalidades(unique);
      })
      .catch(() => setModalidades([]));
  }, []);

  const inscripciones: DashboardInscripcion[] = cache?.inscripciones || [];

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const ins of inscripciones) {
      if (!ins.inicio) continue;
      const d = new Date(ins.inicio);
      if (isNaN(d.getTime())) continue;
      set.add(MONTHS[d.getMonth()]);
    }
    return MONTHS.filter((m) => set.has(m));
  }, [inscripciones]);

  const courseOptions = useMemo(() => {
    const set = new Set<string>();
    for (const ins of inscripciones) {
      const name = (ins.nombreCurso || '').trim();
      if (name) set.add(name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [inscripciones]);

  useEffect(() => {
    if (!monthsInitialized && monthOptions.length) {
      setSelectedMonths(monthOptions);
      setMonthsInitialized(true);
    }
  }, [monthOptions, monthsInitialized]);

  useEffect(() => {
    if (!modalidadesInitialized && modalidades.length) {
      setSelectedModalidades(modalidades);
      setModalidadesInitialized(true);
    }
  }, [modalidades, modalidadesInitialized]);

  useEffect(() => {
    if (!cursosInitialized && courseOptions.length) {
      setSelectedCursos(courseOptions);
      setCursosInitialized(true);
    }
  }, [courseOptions, cursosInitialized]);

  const filteredInscripciones = useMemo(() => {
    let rows = [...inscripciones];

    if (selectedMonths.length && monthOptions.length && selectedMonths.length < monthOptions.length) {
      rows = rows.filter((ins) => {
        if (!ins.inicio) return false;
        const d = new Date(ins.inicio);
        if (isNaN(d.getTime())) return false;
        const monthLabel = MONTHS[d.getMonth()];
        return selectedMonths.includes(monthLabel);
      });
    }

    if (selectedModalidades.length && modalidades.length && selectedModalidades.length < modalidades.length) {
      const normalizedSet = new Set(selectedModalidades.map(normalizeText));
      rows = rows.filter((ins) => normalizedSet.has(normalizeText(ins.modalidad)));
    }

    if (selectedCursos.length && courseOptions.length && selectedCursos.length < courseOptions.length) {
      const normalizedSet = new Set(selectedCursos.map(normalizeText));
      rows = rows.filter((ins) => normalizedSet.has(normalizeText(ins.nombreCurso)));
    }

    if (estadoCurso.active !== estadoCurso.finalizado) {
      rows = rows.filter((ins) => {
        const active = isActiveCourse(ins.termino);
        return estadoCurso.active ? active : !active;
      });
    }

    return rows;
  }, [inscripciones, selectedMonths, selectedModalidades, selectedCursos, monthOptions, modalidades, courseOptions, estadoCurso]);

  const toggleMonth = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const toggleAllMonths = () => {
    setSelectedMonths((prev) => (prev.length === monthOptions.length ? [] : monthOptions));
  };

  const toggleModalidad = (value: string) => {
    setSelectedModalidades((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleCurso = (value: string) => {
    setSelectedCursos((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleAllCursos = () => {
    setSelectedCursos((prev) => (prev.length === courseOptions.length ? [] : courseOptions));
  };

  const toggleEstadoCurso = (key: 'active' | 'finalizado') => {
    setEstadoCurso((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <Sidebar
        months={monthOptions}
        selectedMonths={selectedMonths}
        onToggleMonth={toggleMonth}
        onToggleAllMonths={toggleAllMonths}
        modalidades={modalidades}
        selectedModalidades={selectedModalidades}
        onToggleModalidad={toggleModalidad}
        cursos={courseOptions}
        selectedCursos={selectedCursos}
        onToggleCurso={toggleCurso}
        onToggleAllCursos={toggleAllCursos}
        estadoCurso={estadoCurso}
        onToggleEstadoCurso={toggleEstadoCurso}
      />
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-end gap-2 text-sm text-gray-600">
            <button
              onClick={() => loadCache(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar métricas"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
            <span>Última actualización: {formatUpdatedAt(cache?.updatedAt)}</span>
          </div>

          <div className="mb-8 w-full max-w-[1150px] mx-auto">
            <StatisticsCards items={filteredInscripciones} loading={loading} error={error} />
          </div>
          
          <div className="w-full max-w-[1150px] mx-auto">
            <CourseTable data={filteredInscripciones} loading={loading} error={error} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
