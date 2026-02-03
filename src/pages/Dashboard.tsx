import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatisticsCards from '../components/StatisticsCards';
import CourseTable from '../components/CourseTable';
import { dashboardApi, type DashboardCache, type DashboardInscripcion } from '../services/dashboard';
import { inscripcionesApi } from '../services/inscripciones';
import config from '../config/environment';
import { modalidadesApi, type Modalidad } from '../services/modalidades';
import { useAuth } from '../context/AuthContext';

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

  const [reportUpdating, setReportUpdating] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const { user } = useAuth();
  const empresaCode = user?.empresa;

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

  const inscripciones: DashboardInscripcion[] = useMemo(() => {
    const rows = cache?.inscripciones || [];
    if (empresaCode === undefined || empresaCode === null) return rows;
    const target = Number(empresaCode);
    return rows.filter((ins) => Number(ins.empresa) === target);
  }, [cache, empresaCode]);

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

  const isActiveForReport = (termino?: string) => {
    if (!termino) return true;
    const end = new Date(termino);
    if (isNaN(end.getTime())) return true;
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return end.getTime() >= today.getTime();
  };

  const handleActualizar = async () => {
    if (reportUpdating || refreshing || loading) return;
    setReportUpdating(true);
    setReportError(null);
    setReportStatus(null);
    try {
      const allIns = await inscripcionesApi.list();
      const targetEmpresa = empresaCode == null ? null : Number(empresaCode);
      const filtered = targetEmpresa == null || !Number.isFinite(targetEmpresa)
        ? allIns
        : allIns.filter((ins) => Number(ins.empresa) === targetEmpresa);

      const activeIns = filtered.filter((ins) => isActiveForReport(ins.termino));
      const total = activeIns.length;
      if (!total) {
        setReportStatus('No hay inscripciones activas para actualizar.');
      } else {
        let current = 0;
        for (const ins of activeIns) {
          current += 1;
          setReportStatus(`Procesando ${current} de ${total} inscripciones...`);
          const num = ins.numeroInscripcion;
          const url = `${config.apiBaseUrl}/participantes/${encodeURIComponent(String(num))}/grades-numeric`;
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || `Error generando reporte para inscripción ${num}`);
          }
          const json = await res.json();
          if (!json.success) throw new Error(json.error?.message || `Error generando reporte para inscripción ${num}`);
        }
        setReportStatus(`Reporte actualizado para ${total} inscripciones.`);
      }

      await loadCache(true);
    } catch (e: any) {
      setReportError(e?.message || 'Error generando reporte de avances');
    } finally {
      setReportUpdating(false);
    }
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
          <div className="mb-4 w-full max-w-[1150px] mx-auto">
            <div className="flex items-center justify-end gap-3 text-sm text-gray-600">
              <span>Última actualización: {formatUpdatedAt(cache?.updatedAt)}</span>
              <button
                onClick={handleActualizar}
                disabled={refreshing || loading || reportUpdating}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Actualizar métricas"
              >
                <RefreshCw className={`w-4 h-4 ${(refreshing || reportUpdating) ? 'animate-spin' : ''}`} />
                {(refreshing || reportUpdating) ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
          {reportError && (
            <div className="mb-4 w-full max-w-[1150px] mx-auto text-sm text-red-600">{reportError}</div>
          )}
          {reportStatus && !reportError && (
            <div className="mb-4 w-full max-w-[1150px] mx-auto text-sm text-gray-600">{reportStatus}</div>
          )}

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
