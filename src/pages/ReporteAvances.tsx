import React, { useEffect, useMemo, useState } from 'react';
import { reportesApi, type ReporteAvanceRow } from '../services/reportes';

const ReporteAvances: React.FC = () => {
  const [data, setData] = useState<ReporteAvanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

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

  const formatDate = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-CL');
  };

  const formatPercent = (value?: number | null) => (value === null || value === undefined ? '' : `${value}%`);
  const formatNota = (value?: number | null) => (value === null || value === undefined ? '' : String(value));

  const exportRows = useMemo(() => {
    return data.map((row) => ({
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
  }, [data, generatedAt]);

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
      const today = new Date();
      a.download = `reporte-avance-mutual-${today.toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Reporte de Avance Mutual</h2>
                {generatedAt && (
                  <p className="text-xs text-gray-500">Generado: {formatDate(generatedAt)}</p>
                )}
              </div>
              <button
                onClick={handleExport}
                disabled={!exportRows.length || exporting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? 'Exportando...' : 'Exportar Excel'}
              </button>
            </div>

            {error && <p className="px-6 py-3 text-sm text-red-600">{error}</p>}
            {loading && <p className="px-6 py-3 text-sm text-gray-500">Cargando reporte...</p>}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Empresa</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Nombre del Curso</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">ID Sence</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">RUT</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Nombres</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Apellidos</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium min-w-[140px]">Fecha de Inicio</th>
                    <th className="px-4 py-3 text-left text-sm font-medium min-w-[140px]">Fecha Final</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Nota final</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">% Avance</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">% Asistencia</th>
                    <th className="px-4 py-3 text-left text-sm font-medium min-w-[140px]">Fecha reporte</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">N° Correlativo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!loading && !error && exportRows.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="px-4 py-6 text-center text-gray-500">
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
                        <td className="px-4 py-3 text-sm text-gray-700">{row['Fecha reporte']}</td>
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
