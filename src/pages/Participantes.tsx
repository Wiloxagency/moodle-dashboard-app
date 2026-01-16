import React, { useEffect, useMemo, useState } from 'react';
import config from '../config/environment';
import { useParams, Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, ArrowUpDown, Loader2, Plus, RotateCw } from 'lucide-react';
import { participantesApi, type Participante } from '../services/participantes';
import ParticipanteForm from '../components/ParticipanteForm';

type SortKey =
  | 'nombres'
  | 'apellidos'
  | 'rut'
  | 'mail'
  | 'telefono'
  | 'franquiciaPorcentaje'
  | 'costoOtic'
  | 'costoEmpresa'
  | 'estadoInscripcion'
  | 'observacion';

const ParticipantesPage: React.FC = () => {
  const { numeroInscripcion = '' } = useParams();
  const [data, setData] = useState<Participante[]>([]);
  const normalizeRut = (v?: string) => (v || "").replace(/[.\-]/g, "").toLowerCase();

  const participantesByRut = useMemo(() => {
    const m: Record<string, Participante> = {};
    for (const p of data) if (p.rut) m[normalizeRut(p.rut)] = p;
    return m;
  }, [data]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('nombres');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Participante | null>(null);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportReloading, setReportReloading] = useState(false);
  const [reportUpdatedAt, setReportUpdatedAt] = useState<string | null>(null);
  const [reportData, setReportData] = useState<{ passed: any[]; failed: any[] } | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const items = await participantesApi.listByInscripcion(numeroInscripcion);
      setData(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (numeroInscripcion) load();
  }, [numeroInscripcion]);

  const handleSave = async (participante: Participante) => {
    if (editing && editing._id) {
      await participantesApi.update(editing._id, participante);
    } else {
      await participantesApi.create(participante);
    }
    setShowForm(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    await participantesApi.delete(id);
    setShowForm(false);
    setEditing(null);
    await load();
  };

  const handleEdit = (participante: Participante) => {
    setEditing(participante);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  

  const handleImportFromMoodle = async () => {
    if (!numeroInscripcion) return;
    try {
      setImporting(true);
      setNotice(null);
      const r = await participantesApi.importFromMoodle(numeroInscripcion);
      await load();
      const msg = r.message || `Importación completa: insertados ${r.inserted}, actualizados ${r.updated}, omitidos ${r.skipped}. Total en la inscripción: ${r.total}`;
      setNotice(msg);
    } catch (e:any) {
      setNotice(e?.message || "Error importando desde Moodle");
    } finally {
      setImporting(false);
    }
  };


  const openGradesReport = async () => {
    if (!numeroInscripcion) return;
    setReportOpen(true);
    setReportLoading(true);
    setReportError(null);
    try {
      const url = `${config.apiBaseUrl}/participantes/${encodeURIComponent(numeroInscripcion)}/grades`;
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error obteniendo reporte');
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Error obteniendo reporte');
      setReportData(json.data || { passed: [], failed: [] });
      setReportUpdatedAt(json.updatedAt || null);
    } catch (e:any) {
      setReportError(e?.message || 'Error obteniendo reporte');
    } finally {
      setReportLoading(false);
    }
  };

  const reloadGradesReport = async () => {
    if (!numeroInscripcion) return;
    setReportReloading(true);
    setReportError(null);
    try {
      const url = `${config.apiBaseUrl}/participantes/${encodeURIComponent(numeroInscripcion)}/grades?reload=1`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error regenerando reporte');
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Error regenerando reporte');
      setReportData(json.data || { passed: [], failed: [] });
      setReportUpdatedAt(json.updatedAt || null);
    } catch (e:any) {
      setReportError(e?.message || 'Error regenerando reporte');
    } finally {
      setReportReloading(false);
    }
  };
const requestSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const formatCurrency = (value: number | undefined) =>
    value != null ? value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }) : '-';

  // Filtering
  const filtered = useMemo(() => {
    if (!filter.trim()) return data;
    const q = filter.toLowerCase();
    return data.filter(p =>
      (p.nombres || '').toLowerCase().includes(q) ||
      (p.apellidos || '').toLowerCase().includes(q) ||
      (p.rut || '').toLowerCase().includes(q) ||
      (p.mail || '').toLowerCase().includes(q) ||
      (p.telefono || '').toLowerCase().includes(q) ||
      (p.estadoInscripcion || '').toLowerCase().includes(q) ||
      (p.observacion || '').toLowerCase().includes(q)
    );
  }, [data, filter]);

  // Sorting
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const get = (key: SortKey) => {
        switch (key) {
          case 'franquiciaPorcentaje': return a.franquiciaPorcentaje ?? 0;
          case 'costoOtic': return a.costoOtic ?? 0;
          case 'costoEmpresa': return a.costoEmpresa ?? 0;
          default: return (a as any)[key]?.toString()?.toLowerCase?.() ?? '';
        }
      };
      const getB = (key: SortKey) => {
        switch (key) {
          case 'franquiciaPorcentaje': return b.franquiciaPorcentaje ?? 0;
          case 'costoOtic': return b.costoOtic ?? 0;
          case 'costoEmpresa': return b.costoEmpresa ?? 0;
          default: return (b as any)[key]?.toString()?.toLowerCase?.() ?? '';
        }
      };
      const va = get(sortKey);
      const vb = getB(sortKey);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageRows = sorted.slice(start, end);

  const SortIcon = ({ col }: { col: SortKey }) => (
    sortKey !== col ? <ArrowUpDown className="inline w-3.5 h-3.5 ml-1 text-gray-400" /> : (sortDir === 'asc' ? <ChevronUp className="inline w-3.5 h-3.5 ml-1 text-gray-500" /> : <ChevronDown className="inline w-3.5 h-3.5 ml-1 text-gray-500" />)
  );

  const Spinner = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <span className="ml-2 text-gray-600">Cargando participantes...</span>
    
      {reportOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reporte de notas</h3>
              <div className="flex items-center gap-3">
                {reportUpdatedAt && (
                  <span className="text-xs text-gray-500">Última actualización: {new Date(reportUpdatedAt).toLocaleString()}</span>
                )}
                <button onClick={reloadGradesReport} disabled={reportReloading} className="inline-flex items-center px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50">
                  {reportReloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                </button>
                <button onClick={() => { setReportOpen(false); }} className="text-gray-500 hover:text-gray-700 text-xl font-bold">✕</button>
              </div>
            </div>
            {reportLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-gray-600">Generando reporte...</span>
              </div>
            ) : reportError ? (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{reportError}</div>
            ) : reportData ? (
              <div className="space-y-6">
                <div className="text-sm text-gray-600">A continuación se muestran los resultados para los participantes de la inscripción {numeroInscripcion}.</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-right">No.</th>
                        <th className="px-3 py-2 text-left">Nombres</th>
                        <th className="px-3 py-2 text-left">Apellidos</th>
                        <th className="px-3 py-2 text-left">Rut Alumno</th>
                        <th className="px-3 py-2 text-right">% Avance</th>
                        <th className="px-3 py-2 text-right">% Asistencia</th>
                        <th className="px-3 py-2 text-right">Nota Final</th>
                        <th className="px-3 py-2 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.passed.map((r, i) => (
                        <tr key={`${r.RutAlumno}-${i}`}>
                          <td className="px-3 py-2 text-right">{i + 1}</td>
                          <td className="px-3 py-2">{participantesByRut[normalizeRut(r.RutAlumno)]?.nombres || r.Nombres || ""}</td>
                          <td className="px-3 py-2">{participantesByRut[normalizeRut(r.RutAlumno)]?.apellidos || r.Apellidos || ""}</td>
                          <td className="px-3 py-2">{r.RutAlumno}</td>
                          <td className="px-3 py-2 text-right">{r.PorcentajeAvance}%</td>
                          <td className="px-3 py-2 text-right">{r.PorcentajeAsistenciaAlumno}%</td>
                          <td className="px-3 py-2 text-right">{r.NotaFinal}</td>
                          <td className={`px-3 py-2 ${r.EstadoCurso === '1' ? 'text-green-600 font-semibold' : (r.EstadoCurso === '2' ? 'text-red-600 font-semibold' : 'text-gray-600')}`}>{r.EstadoCurso === '1' ? 'Aprobado' : (r.EstadoCurso === '2' ? 'Reprobado' : 'Sin nota')}</td>
                        </tr>
                      ))}
                      {reportData.passed.length === 0 && (
                        <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-500">No hay datos para mostrar</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {reportData.failed && reportData.failed.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
                    No se pudieron obtener notas para {reportData.failed.length} participante(s).
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              {notice && (
                <div className="mb-3 p-3 rounded bg-yellow-50 text-yellow-800 border border-yellow-200 text-sm">{notice}</div>
              )}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Participantes</h2>
                  <p className="text-sm text-gray-500">Inscripción: {numeroInscripcion}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input 
                    value={filter} 
                    onChange={(e) => { setFilter(e.target.value); setPage(1); }} 
                    placeholder="Filtrar participantes..." 
                    className="px-3 py-2 border rounded-md text-sm" 
                  />
                  <select 
                    value={perPage} 
                    onChange={e => { setPerPage(parseInt(e.target.value)); setPage(1); }} 
                    className="px-2 py-2 border rounded-md text-sm"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <button 
                    onClick={handleNew}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo Participante
                  </button>
                  <button 
                    onClick={openGradesReport}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    Ver reporte de notas
                  </button>
                  <button onClick={handleImportFromMoodle} disabled={importing} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Cargar desde Moodle
                  </button>
                  <Link 
                    to="/inscripciones" 
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    ← Volver a Inscripciones
                  </Link>
                </div>
              </div>
            </div>

            {loading ? (
              <Spinner />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('nombres')}>Nombres <SortIcon col="nombres" /></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('apellidos')}>Apellidos <SortIcon col="apellidos" /></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('rut')}>Rut <SortIcon col="rut" /></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('mail')}>Mail <SortIcon col="mail" /></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('telefono')}>Teléfono <SortIcon col="telefono" /></th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('franquiciaPorcentaje')}>% Franquicia <SortIcon col="franquiciaPorcentaje" /></th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('costoOtic')}>Costo OTIC <SortIcon col="costoOtic" /></th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('costoEmpresa')}>Costo Empresa <SortIcon col="costoEmpresa" /></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('estadoInscripcion')}>Estado inscripción <SortIcon col="estadoInscripcion" /></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('observacion')}>Observación <SortIcon col="observacion" /></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pageRows.map((p, idx) => {
                        const rowNumber = start + idx + 1;
                        return (
                          <tr key={`${p.rut}-${rowNumber}`} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(p)}>
                            <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500 text-center">{rowNumber}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{p.nombres}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{p.apellidos}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{p.rut}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{p.mail}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{p.telefono || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">{p.franquiciaPorcentaje != null ? `${p.franquiciaPorcentaje}%` : '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(p.costoOtic)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(p.costoEmpresa)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{p.estadoInscripcion || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 max-w-[320px] truncate" title={p.observacion}>{p.observacion || '-'}</td>
                          </tr>
                        );
                      })}
                      {!loading && pageRows.length === 0 && (
                        <tr>
                          <td className="px-4 py-6 text-sm text-gray-500 text-center" colSpan={11}>
                            {filtered.length === 0 && filter ? 'No se encontraron participantes que coincidan con el filtro' : 'Sin participantes'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{total === 0 ? 0 : start + 1}</span> a <span className="font-medium">{end}</span> de <span className="font-medium">{total}</span> participantes — Página {page} de {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Anterior</button>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editing ? 'Editar Participante' : 'Nuevo Participante'}
              </h3>
              <button 
                onClick={() => { setShowForm(false); setEditing(null); }} 
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <ParticipanteForm 
              initial={editing || undefined} 
              numeroInscripcion={numeroInscripcion}
              onCancel={() => { setShowForm(false); setEditing(null); }} 
              onSave={handleSave}
              onDelete={editing && editing._id ? handleDelete : undefined}
            />
          </div>
        </div>
      )}
    
      {reportOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reporte de notas</h3>
              <div className="flex items-center gap-3">
                {reportUpdatedAt && (
                  <span className="text-xs text-gray-500">Última actualización: {new Date(reportUpdatedAt).toLocaleString()}</span>
                )}
                <button onClick={reloadGradesReport} disabled={reportReloading} className="inline-flex items-center px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50">
                  {reportReloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                </button>
                <button onClick={() => { setReportOpen(false); }} className="text-gray-500 hover:text-gray-700 text-xl font-bold">✕</button>
              </div>
            </div>
            {reportLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-gray-600">Generando reporte...</span>
              </div>
            ) : reportError ? (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{reportError}</div>
            ) : reportData ? (
              <div className="space-y-6">
                <div className="text-sm text-gray-600">A continuación se muestran los resultados para los participantes de la inscripción {numeroInscripcion}.</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-right">No.</th>
                        <th className="px-3 py-2 text-left">Nombres</th>
                        <th className="px-3 py-2 text-left">Apellidos</th>
                        <th className="px-3 py-2 text-left">Rut Alumno</th>
                        <th className="px-3 py-2 text-right">% Avance</th>
                        <th className="px-3 py-2 text-right">% Asistencia</th>
                        <th className="px-3 py-2 text-right">Nota Final</th>
                        <th className="px-3 py-2 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.passed.map((r, i) => (
                        <tr key={`${r.RutAlumno}-${i}`}>
                          <td className="px-3 py-2 text-right">{i + 1}</td>
                          <td className="px-3 py-2">{participantesByRut[normalizeRut(r.RutAlumno)]?.nombres || r.Nombres || ""}</td>
                          <td className="px-3 py-2">{participantesByRut[normalizeRut(r.RutAlumno)]?.apellidos || r.Apellidos || ""}</td>
                          <td className="px-3 py-2">{r.RutAlumno}</td>
                          <td className="px-3 py-2 text-right">{r.PorcentajeAvance}%</td>
                          <td className="px-3 py-2 text-right">{r.PorcentajeAsistenciaAlumno}%</td>
                          <td className="px-3 py-2 text-right">{r.NotaFinal}</td>
                          <td className={`px-3 py-2 ${r.EstadoCurso === '1' ? 'text-green-600 font-semibold' : (r.EstadoCurso === '2' ? 'text-red-600 font-semibold' : 'text-gray-600')}`}>{r.EstadoCurso === '1' ? 'Aprobado' : (r.EstadoCurso === '2' ? 'Reprobado' : 'Sin nota')}</td>
                        </tr>
                      ))}
                      {reportData.passed.length === 0 && (
                        <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-500">No hay datos para mostrar</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {reportData.failed && reportData.failed.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
                    No se pudieron obtener notas para {reportData.failed.length} participante(s).
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
};

export default ParticipantesPage;
