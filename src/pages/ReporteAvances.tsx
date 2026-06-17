import React, { useEffect, useMemo, useState } from 'react';
import { reportesApi, type ReporteAvanceRow } from '../services/reportes';
import { empresasApi, type Empresa } from '../services/empresas';
import { useAuth } from '../context/AuthContext';
import { getSessionMode, getHoldingEmpresaCodes, getUniqueHoldings } from '../utils/holding';


const formatDateInput = (date: Date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
};

const parseDateInput = (value: string): Date | null => {
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const parseISODate = (value?: string): Date | null => {
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

const formatDate = (value?: string) => {
  const d = parseISODate(value);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
};

const normalizeText = (value?: string) => (value || '').trim().toLowerCase();

const SHARED_EMPRESA_FILTER_KEY = 'sharedEmpresaFilterV1';

type SharedEmpresaFilterState = {
  search: string;
  code: number | null;
  holding: string | null;
};

const readSharedEmpresaFilter = (): SharedEmpresaFilterState => {
  if (typeof window === 'undefined') return { search: '', code: null, holding: null };
  try {
    const raw = window.localStorage.getItem(SHARED_EMPRESA_FILTER_KEY);
    if (!raw) return { search: '', code: null, holding: null };
    const parsed = JSON.parse(raw) as { search?: unknown; code?: unknown; holding?: unknown };
    const search = typeof parsed.search === 'string' ? parsed.search : '';
    const parsedCode = parsed.code;
    const numericCode = parsedCode === null || parsedCode === undefined || parsedCode === ''
      ? NaN
      : (typeof parsedCode === 'number' ? parsedCode : Number(parsedCode));
    const code = Number.isFinite(numericCode) ? numericCode : null;
    const holding = typeof parsed.holding === 'string' && parsed.holding.trim() !== '' ? parsed.holding : null;
    return { search, code, holding };
  } catch {
    return { search: '', code: null, holding: null };
  }
};

const writeSharedEmpresaFilter = (state: SharedEmpresaFilterState) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SHARED_EMPRESA_FILTER_KEY, JSON.stringify(state));
  } catch {}
};

const ReporteAvances: React.FC = () => {
  const { user } = useAuth();
  const empresaCode = user?.empresa;
  const sessionMode = getSessionMode(user);
  const isHoldingMode = sessionMode === 'holding';
  const isAllEmpresasMode = user?.role === 'superAdmin' && sessionMode === 'multi';
  const [data, setData] = useState<ReporteAvanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [mode, setMode] = useState<'active' | 'historic' | 'all'>('active');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(() => formatDateInput(new Date()));
  const [sortKey, setSortKey] = useState('');
  const [empresaSearch, setEmpresaSearch] = useState(() => (getSessionMode(user) === 'multi' ? readSharedEmpresaFilter().search : ''));
  const [empresaFilterCode, setEmpresaFilterCode] = useState<number | null>(() => (getSessionMode(user) === 'multi' ? readSharedEmpresaFilter().code : null));
  const [holdingFilter, setHoldingFilter] = useState<string | null>(() => (getSessionMode(user) === 'multi' ? readSharedEmpresaFilter().holding : null));
  const [empresaFilterOpen, setEmpresaFilterOpen] = useState(false);

  const showEmpresaFilter = isAllEmpresasMode || isHoldingMode;

  const holdingCodeSet = useMemo(
    () => (isHoldingMode ? new Set(getHoldingEmpresaCodes(empresas, user?.holding).map(Number)) : null),
    [isHoldingMode, empresas, user?.holding]
  );

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportesApi.listAvances();
      setData(res.data || []);
      setGeneratedAt(res.generatedAt);
    } catch (e: any) {
      setError(e?.message || 'Error cargando reporte');
    } finally {
      setLoading(false);
    }
  };

  const loadEmpresas = async () => {
    try {
      const items = await empresasApi.list();
      setEmpresas(items);
    } catch {
      setEmpresas([]);
    }
  };

  useEffect(() => {
    load();
    loadEmpresas();
  }, []);

  const formatPercent = (value?: number | null) => (value === null || value === undefined ? '' : `${value}%`);
  const formatNota = (value?: number | null) => (value === null || value === undefined ? '' : String(value));

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const empresaByCode = useMemo(() => {
    const map: Record<number, string> = {};
    for (const e of empresas) map[e.code] = e.nombre;
    return map;
  }, [empresas]);

  const empresaOptions = useMemo(() => {
    return empresas
      .map((empresa) => ({ code: Number(empresa.code), nombre: String(empresa.nombre || '').trim() }))
      .filter((empresa) => Number.isFinite(empresa.code) && empresa.nombre !== '')
      .filter((empresa) => !isHoldingMode || !holdingCodeSet || holdingCodeSet.has(empresa.code))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  }, [empresas, isHoldingMode, holdingCodeSet]);

  const filteredEmpresaOptions = useMemo(() => {
    const query = normalizeText(empresaSearch);
    if (!query) return empresaOptions;
    return empresaOptions.filter((empresa) =>
      String(empresa.code).includes(query) || normalizeText(empresa.nombre).includes(query)
    );
  }, [empresaOptions, empresaSearch]);

  const holdingOptions = useMemo(
    () => (isAllEmpresasMode ? getUniqueHoldings(empresas) : []),
    [isAllEmpresasMode, empresas]
  );

  const filteredHoldingOptions = useMemo(() => {
    const query = normalizeText(empresaSearch);
    if (!query) return holdingOptions;
    return holdingOptions.filter((holding) => normalizeText(holding).includes(query));
  }, [holdingOptions, empresaSearch]);

  const activeHoldingCodes = useMemo(
    () => (holdingFilter ? new Set(getHoldingEmpresaCodes(empresas, holdingFilter).map(Number)) : null),
    [holdingFilter, empresas]
  );

  useEffect(() => {
    if (!isAllEmpresasMode) return;
    writeSharedEmpresaFilter({ search: empresaSearch, code: empresaFilterCode, holding: holdingFilter });
  }, [isAllEmpresasMode, empresaSearch, empresaFilterCode, holdingFilter]);

  useEffect(() => {
    if (!isAllEmpresasMode) return;
    if (empresaSearch.trim()) return;
    if (empresaFilterCode !== null) {
      const empresaNombre = empresaByCode[empresaFilterCode];
      if (empresaNombre) setEmpresaSearch(empresaNombre);
    } else if (holdingFilter) {
      setEmpresaSearch(holdingFilter);
    }
  }, [isAllEmpresasMode, empresaFilterCode, holdingFilter, empresaSearch, empresaByCode]);

  const fromDate = useMemo(() => (dateFrom ? parseDateInput(dateFrom) : null), [dateFrom]);
  const toDate = useMemo(() => (dateTo ? parseDateInput(dateTo) : null), [dateTo]);

  const empresaFiltered = useMemo(() => {
    if (sessionMode === 'holding') {
      if (!holdingCodeSet || holdingCodeSet.size === 0) return [];
      return data.filter((row) => holdingCodeSet.has(Number(row.empresa)));
    }
    if (empresaCode === undefined || empresaCode === null) return data;
    const target = String(empresaCode);
    return data.filter((row) => String(row.empresa ?? '') === target);
  }, [data, sessionMode, empresaCode, holdingCodeSet]);

  const filteredRows = useMemo(() => {
    let rows = [...empresaFiltered];

    if (showEmpresaFilter) {
      if (empresaFilterCode !== null) {
        rows = rows.filter((row) => Number(row.empresa) === empresaFilterCode);
      } else if (holdingFilter && activeHoldingCodes) {
        rows = rows.filter((row) => activeHoldingCodes.has(Number(row.empresa)));
      } else {
        const empresaQuery = normalizeText(empresaSearch);
        if (empresaQuery) {
          rows = rows.filter((row) => {
            const code = String(row.empresa || '');
            const name = normalizeText(empresaByCode[Number(row.empresa)] || String(row.empresa || ''));
            return code.includes(empresaQuery) || name.includes(empresaQuery);
          });
        }
      }
    }

    if (mode === 'active') {
      rows = rows.filter((row) => {
        const end = parseISODate(row.fechaFinal);
        if (!end) return true;
        return end.getTime() >= today.getTime();
      });
    } else if (mode === 'historic') {
      rows = rows.filter((row) => {
        const end = parseISODate(row.fechaFinal);
        if (!end) return false;
        return end.getTime() < today.getTime();
      });
    }

    if (fromDate || toDate) {
      rows = rows.filter((row) => {
        const start = parseISODate(row.fechaInicio);
        if (!start) return false;
        if (fromDate && start.getTime() < fromDate.getTime()) return false;
        if (toDate && start.getTime() > toDate.getTime()) return false;
        return true;
      });
    }

    if (sortKey) {
      const compareText = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' });
      rows.sort((a, b) => {
        switch (sortKey) {
          case 'idSence':
            return compareText(a.idSence || '', b.idSence || '');
          case 'rut':
            return compareText(a.rut || '', b.rut || '');
          case 'nombres':
            return compareText(a.nombres || '', b.nombres || '');
          case 'apellidos':
            return compareText(a.apellidos || '', b.apellidos || '');
          case 'email':
            return compareText(a.email || '', b.email || '');
          case 'fechaInicio': {
            const da = parseISODate(a.fechaInicio);
            const db = parseISODate(b.fechaInicio);
            if (!da && !db) return 0;
            if (!da) return 1;
            if (!db) return -1;
            return da.getTime() - db.getTime();
          }
          case 'fechaFinal': {
            const da = parseISODate(a.fechaFinal);
            const db = parseISODate(b.fechaFinal);
            if (!da && !db) return 0;
            if (!da) return 1;
            if (!db) return -1;
            return da.getTime() - db.getTime();
          }
          case 'correlativo': {
            const na = a.correlativo ?? 0;
            const nb = b.correlativo ?? 0;
            return na - nb;
          }
          default:
            return 0;
        }
      });
    }

    return rows;
  }, [empresaFiltered, showEmpresaFilter, empresaFilterCode, holdingFilter, activeHoldingCodes, empresaSearch, empresaByCode, mode, fromDate, toDate, sortKey, today]);

  const showEvaluacionDiagnostica = useMemo(
    () => filteredRows.some((row) => row.notaDiagnostica !== null && row.notaDiagnostica !== undefined),
    [filteredRows]
  );

  const exportRows = useMemo(() => {
    return filteredRows.map((row) => ({
      'Empresa': (() => {
        const raw = row.empresa || '';
        const num = Number(raw);
        if (Number.isFinite(num) && empresaByCode[num]) return empresaByCode[num];
        return String(raw || '');
      })(),
      'Nombre del Curso': row.nombreCurso || '',
      'ID Sence': row.idSence || '',
      'RUT': row.rut || '',
      'Nombres': row.nombres || '',
      'Apellidos': row.apellidos || '',
      'Email': row.email || '',
      'Fecha de Inicio': formatDate(row.fechaInicio),
      'Fecha Final': formatDate(row.fechaFinal),
      'Último acceso': formatDate(row.ultimoAcceso),
      'Evaluación Diagnóstica': formatNota(row.notaDiagnostica),
      'Nota final': formatNota(row.notaFinal),
      '% Avance': formatPercent(row.porcentajeAvance),
      '% Asistencia': formatPercent(row.porcentajeAsistencia),
      'Fecha reporte': formatDate(row.fechaReporte || generatedAt),
      'N° Correlativo': row.correlativo ?? '',
      'Responsable': row.responsable || '',
    }));
  }, [filteredRows, generatedAt, empresaByCode]);

  const handleExport = async () => {
    if (!exportRows.length || exporting) return;
    setExporting(true);
    try {
      const mod = await import('exceljs');
      const workbook = new mod.Workbook();
      const worksheet = workbook.addWorksheet('Reporte');

      const columns: Array<{ header: string; key: string; width: number }> = [
        { header: 'Empresa', key: 'Empresa', width: 18 },
        { header: 'Nombre del Curso', key: 'Nombre del Curso', width: 54 },
        { header: 'ID Sence', key: 'ID Sence', width: 18 },
        { header: 'RUT', key: 'RUT', width: 16 },
        { header: 'Nombres', key: 'Nombres', width: 20 },
        { header: 'Apellidos', key: 'Apellidos', width: 20 },
        { header: 'Email', key: 'Email', width: 28 },
        { header: 'Fecha de Inicio', key: 'Fecha de Inicio', width: 18 },
        { header: 'Fecha Final', key: 'Fecha Final', width: 18 },
        { header: 'Último acceso', key: 'Último acceso', width: 18 },
      ];

      if (showEvaluacionDiagnostica) {
        columns.push({ header: 'Eval\nDiag.', key: 'Evaluación Diagnóstica', width: 9 });
      }

      columns.push(
        { header: 'Nota final', key: 'Nota final', width: 12 },
        { header: '% Avance', key: '% Avance', width: 12 },
        { header: '% Asistencia', key: '% Asistencia', width: 14 },
        { header: 'Fecha reporte', key: 'Fecha reporte', width: 18 },
        { header: 'N° Correlativo', key: 'N° Correlativo', width: 16 },
        { header: 'Responsable', key: 'Responsable', width: 20 },
      );

      worksheet.columns = columns;

      exportRows.forEach((row) => worksheet.addRow(row));

      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006400' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      });
      headerRow.height = 30;

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const todayFile = new Date();
      const slug = (value: string) =>
        value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sin-nombre';
      let suffix: string;
      if (isHoldingMode) {
        suffix = `holding-${slug(user?.holding || '')}`;
      } else if (holdingFilter) {
        suffix = `holding-${slug(holdingFilter)}`;
      } else if (empresaFilterCode != null) {
        suffix = `empresa-${empresaFilterCode}`;
      } else if (empresaCode != null) {
        suffix = `empresa-${empresaCode}`;
      } else {
        suffix = 'general';
      }
      a.download = `reporte-avance-${suffix}-${todayFile.toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleDateChange = (value: string, setter: (v: string) => void) => {
    if (!/^[\d/]*$/.test(value)) return;
    if (value.length > 10) return;
    setter(value);
  };

  const handleEmpresaInputChange = (value: string) => {
    setEmpresaFilterOpen(true);
    setEmpresaSearch(value);
    setEmpresaFilterCode(null);
    setHoldingFilter(null);
  };

  const handleEmpresaPick = (code: number, nombre: string) => {
    setEmpresaFilterCode(code);
    setHoldingFilter(null);
    setEmpresaSearch(nombre);
    setEmpresaFilterOpen(false);
  };

  const handleHoldingPick = (holding: string) => {
    setHoldingFilter(holding);
    setEmpresaFilterCode(null);
    setEmpresaSearch(holding);
    setEmpresaFilterOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Reporte de Avances</h2>
                {generatedAt && (
                  <p className="text-xs text-gray-500">Generado: {formatDate(generatedAt)}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMode('active')}
                    className={`px-3 py-2 text-sm ${mode === 'active' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  >
                    Cursos Activos
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('historic')}
                    className={`px-3 py-2 text-sm ${mode === 'historic' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  >
                    Histórico
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('all')}
                    className={`px-3 py-2 text-sm ${mode === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  >
                    Todos los Cursos
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">Desde</span>
                  <input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={dateFrom}
                    onChange={(e) => handleDateChange(e.target.value, setDateFrom)}
                    className="w-[120px] h-9 border rounded px-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">Hasta</span>
                  <input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={dateTo}
                    onChange={(e) => handleDateChange(e.target.value, setDateTo)}
                    className="w-[120px] h-9 border rounded px-2 text-sm"
                  />
                </div>

                {showEmpresaFilter && (
                  <div className="relative min-w-[260px]">
                    <input
                      type="text"
                      value={empresaSearch}
                      onChange={(e) => handleEmpresaInputChange(e.target.value)}
                      onFocus={() => setEmpresaFilterOpen(true)}
                      onBlur={() => setTimeout(() => setEmpresaFilterOpen(false), 150)}
                      placeholder={isHoldingMode ? 'Filtrar por empresa del holding...' : 'Filtrar por empresa...'}
                      className="w-full h-9 border rounded px-2 text-sm"
                      autoComplete="off"
                    />
                    {empresaFilterOpen && (filteredEmpresaOptions.length > 0 || filteredHoldingOptions.length > 0) && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-56 overflow-auto">
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
                        {filteredHoldingOptions.length > 0 && (
                          <>
                            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-t border-gray-200">
                              Holdings
                            </div>
                            {filteredHoldingOptions.map((holding) => (
                              <button
                                type="button"
                                key={`holding-${holding}`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleHoldingPick(holding)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                              >
                                {holding}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                    {empresaFilterOpen && filteredEmpresaOptions.length === 0 && filteredHoldingOptions.length === 0 && (
                      <p className="mt-1 text-xs text-gray-500">Sin resultados para la búsqueda actual.</p>
                    )}
                  </div>
                )}

                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="h-9 border rounded px-2 text-sm"
                >
                  <option value="">Ordenar por...</option>
                  <option value="idSence">ID Sence</option>
                  <option value="rut">RUT</option>
                  <option value="nombres">Nombres</option>
                  <option value="apellidos">Apellidos</option>
                  <option value="email">Emails</option>
                  <option value="fechaInicio">Fecha de Inicio</option>
                  <option value="fechaFinal">Fecha Final</option>
                  <option value="correlativo">N° Correlativo</option>
                </select>

                <button
                  onClick={handleExport}
                  disabled={!exportRows.length || exporting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? 'Exportando...' : 'Exportar Excel'}
                </button>
              </div>
            </div>

            {error && <p className="px-6 py-3 text-sm text-red-600">{error}</p>}
            {loading && (
              <div className="px-6 py-4 flex items-center gap-3 text-sm text-gray-600">
                <span className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                <span>Cargando reporte...</span>
              </div>
            )}

            <div className="overflow-auto max-h-[65vh]">
              <table className={`w-full ${showEvaluacionDiagnostica ? 'min-w-[1980px]' : 'min-w-[1940px]'}`}>
                <thead className="text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600">Empresa</th>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600 min-w-[260px]">Nombre del Curso</th>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600 min-w-[200px]">ID Sence</th>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600 min-w-[140px]">RUT</th>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600 min-w-[220px]">Nombres</th>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600 min-w-[220px]">Apellidos</th>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600 min-w-[220px]">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600 min-w-[140px]">Fecha de Inicio</th>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600 min-w-[140px]">Fecha Final</th>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600 min-w-[140px]">Último acceso</th>
                    {showEvaluacionDiagnostica && (
                      <th className="px-2 py-3 text-center text-sm font-medium sticky top-0 z-10 bg-blue-600 min-w-[84px]">
                        <span className="inline-block leading-tight">Eval.<br />Diag.</span>
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600">Nota final</th>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600">% Avance</th>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600">% Asistencia</th>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600 min-w-[140px]">N° Correlativo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium sticky top-0 z-10 bg-blue-600 min-w-[200px]">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!loading && !error && exportRows.length === 0 ? (
                    <tr>
                      <td colSpan={showEvaluacionDiagnostica ? 16 : 15} className="px-4 py-6 text-center text-gray-500">
                        No hay datos disponibles
                      </td>
                    </tr>
                  ) : (
                    exportRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{row['Empresa']}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row['Nombre del Curso']}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row['ID Sence']}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row['RUT']}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row['Nombres']}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row['Apellidos']}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row['Email']}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row['Fecha de Inicio']}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row['Fecha Final']}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row['Último acceso']}</td>
                        {showEvaluacionDiagnostica && (
                          <td className="px-2 py-3 text-sm text-gray-700 text-center whitespace-nowrap">{row['Evaluación Diagnóstica']}</td>
                        )}
                        <td className="px-4 py-3 text-sm text-gray-700">{row['Nota final']}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row['% Avance']}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row['% Asistencia']}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row['N° Correlativo']}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row['Responsable']}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReporteAvances;
