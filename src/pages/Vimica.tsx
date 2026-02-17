import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import reportesApi from '../services/reportes';
import config from '../config/environment';
import type { VimicaHistorialRow } from '../services/reportes';

const PAGE_SIZE = 10;

const Vimica: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState<VimicaHistorialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<VimicaHistorialRow | null>(null);

  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(10);

  const isAllowed = Number(user?.empresa) === 1;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportesApi.listVimicaHistorial();
      setRows(data);
      setPage(1);
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar el historial de VMICA');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAllowed) {
      navigate('/dashboard', { replace: true });
      return;
    }
    load();
  }, [isAllowed, load, navigate]);

  useEffect(() => {
    setModalPage(1);
  }, [selected, modalPageSize]);

  const toTimestamp = (value?: string) => {
    if (!value) return 0;
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const diff = toTimestamp(b.Fecha) - toTimestamp(a.Fecha);
      if (diff !== 0) return diff;
      return String(b._id || '').localeCompare(String(a._id || ''));
    });
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [sortedRows, page]);

  const formatFechaCorta = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value).slice(0, 10) || '-';
    return d.toLocaleDateString('es-CL');
  };

  const formatHora = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      const m = String(value).match(/\d{2}:\d{2}(:\d{2})?/);
      return m ? m[0] : '-';
    }
    return d.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const getRechazados = (row: VimicaHistorialRow) => {
    const val = (row as any).RegistrosRechazado ?? row.RegistrosRechazados;
    return val ?? 0;
  };

  const selectedAvanceCursos = useMemo(() => {
    const payload = (selected as any)?.datosEnviados;
    return Array.isArray(payload?.AvanceCursos) ? payload.AvanceCursos : [];
  }, [selected]);

  const modalTotalPages = Math.max(1, Math.ceil(selectedAvanceCursos.length / modalPageSize));

  useEffect(() => {
    if (modalPage > modalTotalPages) setModalPage(modalTotalPages);
  }, [modalPage, modalTotalPages]);

  const pagedAvanceCursos = useMemo(() => {
    const start = (modalPage - 1) * modalPageSize;
    return selectedAvanceCursos.slice(start, start + modalPageSize);
  }, [selectedAvanceCursos, modalPage, modalPageSize]);

  const getStatusType = (item: any): 'ok' | 'fail' | null => {
    const raw = String(item?.EstadoCurso ?? '').trim().toLowerCase();
    if (!raw || raw === '0') return null;
    if (raw === '1' || raw === 'aprobado' || raw === 'aprobada' || raw === 'ok') return 'ok';
    if (raw === '2' || raw === 'reprobado' || raw === 'reprobada') return 'fail';
    return null;
  };

  return (
    <div className="p-6">
      <div className="w-full max-w-[1280px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              title="Regresar"
            >
              ← Regresar
            </button>
            <h1 className="text-2xl font-semibold text-gray-800">VMICA</h1>
          </div>
          <div className="flex items-center gap-2">
            {!config.isProduction && (
              <button
                onClick={() => navigate('/vimica/json')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Área JSON
              </button>
            )}
            <button
              onClick={load}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Hora</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Cantidad Registros</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Registros Cargados</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Registros Rechazados</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Registros Leidos</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Datos Enviados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Cargando historial...</td>
                  </tr>
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No hay registros en VMICA</td>
                  </tr>
                ) : (
                  pagedRows.map((row, idx) => (
                    <tr key={String(row._id || row.Id || `${row.Fecha || 'sin-fecha'}-${idx}`)} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">{row.Id ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{formatFechaCorta(row.Fecha)}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{formatHora(row.Fecha)}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{row.CantidadRegistros ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{row.RegistrosCargados ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{getRechazados(row)}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{row.RegistrosLeidos ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <button
                          onClick={() => setSelected(row)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs"
                        >
                          Datos Enviados
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-lg shadow-lg w-[95vw] max-w-[1800px] max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Datos Enviados - ID {selected.Id ?? '-'}</h2>
              <button
                onClick={() => setSelected(null)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>

            <div className="p-4">
              {selectedAvanceCursos.length === 0 ? (
                <div className="text-sm text-gray-500">No hay registros en AvanceCursos para este envío.</div>
              ) : (
                <>
                  <div className="overflow-auto max-h-[68vh] border border-gray-200 rounded">
                    <table className="min-w-full text-sm">
                      <thead className="text-gray-700">
                        <tr>
                          <th className="px-3 py-2 text-left border-b bg-gray-100 sticky top-0 z-10">IdCurso</th>
                          <th className="px-3 py-2 text-left border-b bg-gray-100 sticky top-0 z-10">RutAlumno</th>
                          <th className="px-3 py-2 text-left border-b bg-gray-100 sticky top-0 z-10">Status</th>
                          <th className="px-3 py-2 text-left border-b bg-gray-100 sticky top-0 z-10">PorcentajeAvance</th>
                          <th className="px-3 py-2 text-left border-b bg-gray-100 sticky top-0 z-10">PorcentajeAsistenciaAlumno</th>
                          <th className="px-3 py-2 text-left border-b bg-gray-100 sticky top-0 z-10">NotaTeorica</th>
                          <th className="px-3 py-2 text-left border-b bg-gray-100 sticky top-0 z-10">EstadoTeorica</th>
                          <th className="px-3 py-2 text-left border-b bg-gray-100 sticky top-0 z-10">NotaPractica</th>
                          <th className="px-3 py-2 text-left border-b bg-gray-100 sticky top-0 z-10">EstadoPractica</th>
                          <th className="px-3 py-2 text-left border-b bg-gray-100 sticky top-0 z-10">NotaFinal</th>
                          <th className="px-3 py-2 text-left border-b bg-gray-100 sticky top-0 z-10">EstadoCurso</th>
                          <th className="px-3 py-2 text-left border-b bg-gray-100 sticky top-0 z-10">Observacion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedAvanceCursos.map((item: any, idx: number) => {
                          const status = getStatusType(item);
                          return (
                            <tr key={`${item?.IdCurso || 'sin-curso'}-${item?.RutAlumno || 'sin-rut'}-${idx}`} className="odd:bg-white even:bg-gray-50">
                              <td className="px-3 py-2 border-b">{item?.IdCurso ?? ''}</td>
                              <td className="px-3 py-2 border-b">{item?.RutAlumno ?? ''}</td>
                              <td className="px-3 py-2 border-b">
                                {status === 'ok' ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" aria-label="Aprobado" />
                                ) : status === 'fail' ? (
                                  <XCircle className="w-4 h-4 text-red-600" aria-label="Reprobado" />
                                ) : null}
                              </td>
                              <td className="px-3 py-2 border-b">{item?.PorcentajeAvance ?? ''}</td>
                              <td className="px-3 py-2 border-b">{item?.PorcentajeAsistenciaAlumno ?? ''}</td>
                              <td className="px-3 py-2 border-b">{item?.NotaTeorica ?? ''}</td>
                              <td className="px-3 py-2 border-b">{item?.EstadoTeorica ?? ''}</td>
                              <td className="px-3 py-2 border-b">{item?.NotaPractica ?? ''}</td>
                              <td className="px-3 py-2 border-b">{item?.EstadoPractica ?? ''}</td>
                              <td className="px-3 py-2 border-b">{item?.NotaFinal ?? ''}</td>
                              <td className="px-3 py-2 border-b">{item?.EstadoCurso ?? ''}</td>
                              <td className="px-3 py-2 border-b">{item?.Observacion ?? ''}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>Filas por página:</span>
                      <select
                        value={modalPageSize}
                        onChange={(e) => setModalPageSize(Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 bg-white"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span>Total: {selectedAvanceCursos.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span>Página {modalPage} de {modalTotalPages}</span>
                      <button
                        onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                        disabled={modalPage <= 1}
                        className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setModalPage((p) => Math.min(modalTotalPages, p + 1))}
                        disabled={modalPage >= modalTotalPages}
                        className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vimica;
