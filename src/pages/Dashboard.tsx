import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatisticsCards from '../components/StatisticsCards';
import CourseTable from '../components/CourseTable';
import { dashboardApi, type DashboardCache, type DashboardInscripcion } from '../services/dashboard';
import { inscripcionesApi } from '../services/inscripciones';
import config from '../config/environment';
import { modalidadesApi, type Modalidad } from '../services/modalidades';
import { empresasApi } from '../services/empresas';
import { useAuth } from '../context/AuthContext';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const normalizeText = (value?: string) => (value || '').trim().toLowerCase();

const SHARED_EMPRESA_FILTER_KEY = 'sharedEmpresaFilterV1';

type SharedEmpresaFilterState = {
  search: string;
  code: number | null;
};

const readSharedEmpresaFilter = (): SharedEmpresaFilterState => {
  if (typeof window === 'undefined') return { search: '', code: null };
  try {
    const raw = window.localStorage.getItem(SHARED_EMPRESA_FILTER_KEY);
    if (!raw) return { search: '', code: null };
    const parsed = JSON.parse(raw) as { search?: unknown; code?: unknown };
    const search = typeof parsed.search === 'string' ? parsed.search : '';
    const parsedCode = parsed.code;
    const numericCode = parsedCode === null || parsedCode === undefined || parsedCode === ''
      ? NaN
      : (typeof parsedCode === 'number' ? parsedCode : Number(parsedCode));
    const code = Number.isFinite(numericCode) ? numericCode : null;
    return { search, code };
  } catch {
    return { search: '', code: null };
  }
};

const writeSharedEmpresaFilter = (state: SharedEmpresaFilterState) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SHARED_EMPRESA_FILTER_KEY, JSON.stringify(state));
  } catch {}
};

const parseDateOnly = (value?: string): Date | null => {
  if (!value) return null;
  const datePart = value.substring(0, 10);
  const [y, m, d] = datePart.split('-');
  if (y && m && d) {
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    date.setHours(0, 0, 0, 0);
    return date;
  }
  const fallback = new Date(value);
  if (isNaN(fallback.getTime())) return null;
  fallback.setHours(0, 0, 0, 0);
  return fallback;
};

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
  const end = parseDateOnly(termino);
  if (!end) return true;
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
  const [empresaByCode, setEmpresaByCode] = useState<Record<number, string>>({});

  const [reportUpdating, setReportUpdating] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportUpdateScope, setReportUpdateScope] = useState<'empresa' | 'todo' | null>(null);

  const { user } = useAuth();
  const empresaCode = user?.empresa;
  const showVimicaButton = Number(empresaCode) === 1;
  const isAllEmpresasMode = user?.role === 'superAdmin' && (empresaCode === undefined || empresaCode === null || !Number.isFinite(Number(empresaCode)));

  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedModalidades, setSelectedModalidades] = useState<string[]>([]);
  const [selectedCursos, setSelectedCursos] = useState<string[]>([]);
  const [estadoCurso, setEstadoCurso] = useState({ active: true, finalizado: false });
  const [monthsInitialized, setMonthsInitialized] = useState(false);
  const [modalidadesInitialized, setModalidadesInitialized] = useState(false);
  const [cursosInitialized, setCursosInitialized] = useState(false);
  const [empresaSearch, setEmpresaSearch] = useState(() => readSharedEmpresaFilter().search);
  const [selectedEmpresaCode, setSelectedEmpresaCode] = useState<number | null>(() => readSharedEmpresaFilter().code);
  const [empresaFilterOpen, setEmpresaFilterOpen] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    empresasApi
      .list()
      .then((items) => {
        if (!mounted) return;
        const map: Record<number, string> = {};
        items.forEach((empresa) => {
          map[empresa.code] = (empresa.nombre || '').trim();
        });
        setEmpresaByCode(map);
      })
      .catch(() => {
        if (mounted) setEmpresaByCode({});
      });

    return () => {
      mounted = false;
    };
  }, []);

  const inscripciones: DashboardInscripcion[] = useMemo(() => {
    const rows = cache?.inscripciones || [];
    if (empresaCode === undefined || empresaCode === null) return rows;
    const target = Number(empresaCode);
    if (!Number.isFinite(target)) return rows;
    return rows.filter((ins) => Number(ins.empresa) === target);
  }, [cache, empresaCode]);

  const empresaOptions = useMemo(() => {
    return Object.entries(empresaByCode)
      .map(([code, nombre]) => ({ code: Number(code), nombre: String(nombre || '').trim() }))
      .filter((empresa) => Number.isFinite(empresa.code) && empresa.nombre !== '')
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  }, [empresaByCode]);

  const filteredEmpresaOptions = useMemo(() => {
    const query = normalizeText(empresaSearch);
    if (!query) return empresaOptions;
    return empresaOptions.filter((empresa) =>
      String(empresa.code).includes(query) || normalizeText(empresa.nombre).includes(query)
    );
  }, [empresaOptions, empresaSearch]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const ins of inscripciones) {
      if (!ins.inicio) continue;
      const d = parseDateOnly(ins.inicio);
      if (!d) continue;
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

  useEffect(() => {
    if (!isAllEmpresasMode) return;
    writeSharedEmpresaFilter({ search: empresaSearch, code: selectedEmpresaCode });
  }, [isAllEmpresasMode, empresaSearch, selectedEmpresaCode]);

  useEffect(() => {
    if (!isAllEmpresasMode) return;
    if (selectedEmpresaCode === null) return;
    if (empresaSearch.trim()) return;
    const empresaNombre = empresaByCode[selectedEmpresaCode];
    if (empresaNombre) setEmpresaSearch(empresaNombre);
  }, [isAllEmpresasMode, selectedEmpresaCode, empresaSearch, empresaByCode]);

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

  const empresaFilteredInscripciones = useMemo(() => {
    if (!isAllEmpresasMode) return filteredInscripciones;

    if (selectedEmpresaCode !== null) {
      return filteredInscripciones.filter((ins) => Number(ins.empresa) === selectedEmpresaCode);
    }

    const query = normalizeText(empresaSearch);
    if (!query) return filteredInscripciones;

    return filteredInscripciones.filter((ins) => {
      const empresaNombre = normalizeText(empresaByCode[Number(ins.empresa)] || '');
      const empresaCodigo = String(ins.empresa || '');
      return empresaNombre.includes(query) || empresaCodigo.includes(query);
    });
  }, [filteredInscripciones, isAllEmpresasMode, selectedEmpresaCode, empresaSearch, empresaByCode]);

  const handleEmpresaFilterInputChange = (value: string) => {
    setEmpresaFilterOpen(true);
    setEmpresaSearch(value);
    setSelectedEmpresaCode(null);
  };

  const handleEmpresaFilterPick = (code: number, nombre: string) => {
    setSelectedEmpresaCode(code);
    setEmpresaSearch(nombre);
    setEmpresaFilterOpen(false);
  };

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

  const isClosedStatus = (value?: string) => String(value || '').trim().toLowerCase() === 'cerrada';

  const shouldCloseInscripcion = (termino?: string) => {
    if (!termino) return false;
    const end = parseDateOnly(termino);
    if (!end) return false;
    const closeDate = new Date(end);
    closeDate.setDate(closeDate.getDate() + 1);
    closeDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime() >= closeDate.getTime();
  };

  const runActualizar = async (scope: 'empresa' | 'todo') => {
    if (reportUpdating || refreshing || loading) return;
    setReportUpdating(true);
    setReportUpdateScope(scope);
    setReportError(null);
    setReportStatus(null);
    try {
      const allIns = await inscripcionesApi.list();
      const targetEmpresa = empresaCode == null ? null : Number(empresaCode);
      const filtered = scope === 'todo'
        ? allIns
        : (targetEmpresa == null || !Number.isFinite(targetEmpresa)
            ? allIns
            : allIns.filter((ins) => Number(ins.empresa) === targetEmpresa));

      const scopeLabel = scope === 'todo' ? 'todas las empresas' : 'la empresa activa';
      const openIns = filtered.filter((ins) => !isClosedStatus(ins.status));
      const total = openIns.length;
      if (!total) {
        setReportStatus(`No hay inscripciones abiertas para actualizar en ${scopeLabel}.`);
      } else {
        let current = 0;
        let failures = 0;
        for (const ins of openIns) {
          current += 1;
          setReportStatus(`Procesando ${current} de ${total} inscripciones (${scopeLabel})...`);
          const num = ins.numeroInscripcion;
          try {
            const url = `${config.apiBaseUrl}/participantes/${encodeURIComponent(String(num))}/grades-numeric`;
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) {
              const text = await res.text();
              throw new Error(text || `Error generando reporte para inscripción ${num}`);
            }
            const json = await res.json();
            if (!json.success) throw new Error(json.error?.message || `Error generando reporte para inscripción ${num}`);

            if (shouldCloseInscripcion(ins.termino) && ins._id) {
              try {
                await inscripcionesApi.update(ins._id, { status: 'cerrada' });
              } catch (e) {
                console.error('Error cerrando inscripción', ins.numeroInscripcion, e);
              }
            }
          } catch (e) {
            failures += 1;
            console.error('Error procesando inscripción', num, e);
          }
        }
        const okCount = total - failures;
        const suffix = failures ? ` (${failures} con errores)` : '';
        setReportStatus(`Reporte actualizado para ${okCount} de ${total} inscripciones en ${scopeLabel}.${suffix}`);
      }

      await loadCache(true);
    } catch (e: any) {
      setReportError(e?.message || 'Error generando reporte de avances');
    } finally {
      setReportUpdating(false);
      setReportUpdateScope(null);
    }
  };

  const handleActualizar = async () => {
    await runActualizar('empresa');
  };

  const handleActualizarTodo = async () => {
    await runActualizar('todo');
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
                title="Actualizar métricas de la empresa activa"
              >
                <RefreshCw className={`w-4 h-4 ${(reportUpdating && reportUpdateScope === 'empresa') ? 'animate-spin' : ''}`} />
                {(reportUpdating && reportUpdateScope === 'empresa') ? 'Actualizando...' : 'Actualizar'}
              </button>
              {!config.isProduction && (
                <button
                  onClick={handleActualizarTodo}
                  disabled={refreshing || loading || reportUpdating}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Actualizar métricas de todas las empresas"
                >
                  <RefreshCw className={`w-4 h-4 ${(reportUpdating && reportUpdateScope === 'todo') ? 'animate-spin' : ''}`} />
                  {(reportUpdating && reportUpdateScope === 'todo') ? 'Actualizando...' : 'Actualizar Todo'}
                </button>
              )}
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
          
          {isAllEmpresasMode && (
            <div className="mb-3 w-full max-w-[1150px] mx-auto">
              <label className="block text-sm font-medium text-gray-700">Empresa</label>
              <div className="relative mt-1 max-w-md">
                <input
                  type="text"
                  value={empresaSearch}
                  onChange={(e) => handleEmpresaFilterInputChange(e.target.value)}
                  onFocus={() => setEmpresaFilterOpen(true)}
                  onBlur={() => setTimeout(() => setEmpresaFilterOpen(false), 150)}
                  placeholder="Filtrar por código o nombre de empresa..."
                  className="w-full border rounded px-3 py-2"
                  autoComplete="off"
                />
                {empresaFilterOpen && filteredEmpresaOptions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-48 overflow-auto">
                    {filteredEmpresaOptions.map((empresa) => (
                      <button
                        type="button"
                        key={empresa.code}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleEmpresaFilterPick(empresa.code, empresa.nombre)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                      >
                        {empresa.nombre}
                      </button>
                    ))}
                  </div>
                )}
                {empresaFilterOpen && filteredEmpresaOptions.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">Sin resultados para la búsqueda actual.</p>
                )}
              </div>
            </div>
          )}

          <div className="w-full max-w-[1150px] mx-auto">
            <CourseTable
              data={empresaFilteredInscripciones}
              loading={loading}
              error={error}
              showVimicaButton={showVimicaButton}
              showEmpresaColumn={isAllEmpresasMode}
              empresaByCode={empresaByCode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
