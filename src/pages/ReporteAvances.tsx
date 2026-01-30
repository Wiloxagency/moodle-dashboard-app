import React, { useEffect, useMemo, useState } from 'react';
import { reportesApi, type ReporteAvanceRow } from '../services/reportes';

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
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
};

const ReporteAvances: React.FC = () => {
  const [data, setData] = useState<ReporteAvanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  const [mode, setMode] = useState<'active' | 'all'>('active');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(() => formatDateInput(new Date()));
  const [sortKey, setSortKey] = useState('');

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

  useEffect(() => {
    load();
  }, []);

  const formatPercent = (value?: number | null) => (value === null || value === undefined ? '' : `${value}%`);
  const formatNota = (value?: number | null) => (value === null || value === undefined ? '' : String(value));

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const fromDate = useMemo(() => (dateFrom ? parseDateInput(dateFrom) : null), [dateFrom]);
  const toDate = useMemo(() => (dateTo ? parseDateInput(dateTo) : null), [dateTo]);

  const filteredRows = useMemo(() => {
    let rows = [...data];

    if (mode === 'active') {
      rows = rows.filter((row) => {
        const end = parseISODate(row.fechaFinal);
        if (!end) return true;
        return end.getTime() >= today.getTime();
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
  }, [data, mode, fromDate, toDate, sortKey, today]);

  const exportRows = useMemo(() => {
    return filteredRows.map((row) => ({
      'Empresa': row.empresa || '',
      'Nombre del Curso': row.nombreCurso || '',
      'ID Sence': row.idSence || '',
      'RUT': row.rut || '',
      'Nombres': row.nombres || '',
      'Apellidos': row.apellidos || '',
      'Email': row.email || '',
      'Fecha de Inicio': formatDate(row.fechaInicio),
      'Fecha Final': formatDate(row.fechaFinal),
      'Nota final': formatNota(row.notaFinal),
      '% Avance': formatPercent(row.porcentajeAvance),
      '% Asistencia': formatPercent(row.porcentajeAsistencia),
      'Fecha reporte': formatDate(row.fechaReporte || generatedAt),
      'N° Correlativo': row.correlativo ?? '',
      'Responsable': row.responsable || '',
    }));
  }, [filteredRows, generatedAt]);

  const handleExport = async () => {
    if (!exportRows.length || exporting) return;
    setExporting(true);
    try {
      const mod = await import('exceljs');
      const workbook = new mod.Workbook();
      const worksheet = workbook.addWorksheet('Reporte');

      worksheet.columns = [
        { header: 'Empresa', key: 'Empresa', width: 18 },
        { header: 'Nombre del Curso', key: 'Nombre del Curso', width: 54 },
        { header: 'ID Sence', key: 'ID Sence', width: 18 },
        { header: 'RUT', key: 'RUT', width: 16 },
        { header: 'Nombres', key: 'Nombres', width: 20 },
        { header: 'Apellidos', key: 'Apellidos', width: 20 },
        { header: 'Email', key: 'Email', width: 28 },
        { header: 'Fecha de Inicio', key: 'Fecha de Inicio', width: 18 },
        { header: 'Fecha Final', key: 'Fecha Final', width: 18 },
        { header: 'Nota final', key: 'Nota final', width: 12 },
        { header: '% Avance', key: '% Avance', width: 12 },
        { header: '% Asistencia', key: '% Asistencia', width: 14 },
        { header: 'Fecha reporte', key: 'Fecha reporte', width: 18 },
        { header: 'N° Correlativo', key: 'N° Correlativo', width: 16 },
        { header: 'Responsable', key: 'Responsable', width: 20 },
      ];

      exportRows.forEach((row) => worksheet.addRow(row));

      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006400' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      headerRow.height = 20;

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const todayFile = new Date();
      a.download = `reporte-avance-mutual-${todayFile.toISOString().slice(0, 10)}.xlsx`;
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

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Reporte de Avance Mutual</h2>
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
                    className="w-[120px] border rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">Hasta</span>
                  <input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={dateTo}
                    onChange={(e) => handleDateChange(e.target.value, setDateTo)}
                    className="w-[120px] border rounded px-2 py-1 text-sm"
                  />
                </div>

                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="border rounded px-2 py-2 text-sm"
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
            {loading && <p className="px-6 py-3 text-sm text-gray-500">Cargando reporte...</p>}

            <div className="overflow-auto max-h-[65vh]">
              <table className="w-full min-w-[1800px]">
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
                      <td colSpan={14} className="px-4 py-6 text-center text-gray-500">
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
