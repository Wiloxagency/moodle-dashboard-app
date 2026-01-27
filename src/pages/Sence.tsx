import React, { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Sidebar from '../components/Sidebar';
import { senceApi, type Sence } from '../services/sence';

// Helpers para normalizar datos desde Excel
const toNumberCell = (v: any): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const s = String(v).replace(/\s+/g, '').replace(',', '.');
  const n = Number(s.replace(/[^0-9.-]/g, ''));
  return Number.isNaN(n) ? undefined : n;
};

const toBoolCell = (v: any): boolean | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const s = String(v).toString().trim().toLowerCase();
  if (!s) return undefined;
  if (['si', 'sí', 'yes', 'true', '1', 'x'].includes(s)) return true;
  if (['no', 'false', '0'].includes(s)) return false;
  return undefined;
};

const SencePage: React.FC = () => {
  const [data, setData] = useState<Sence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [excelImporting, setExcelImporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await senceApi.list();
      setData(items);
    } catch (e: any) {
      setError(e?.message || 'Error cargando datos Sence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleImportFromExcelClick = () => {
    if (excelImporting) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setExcelImporting(true);
      setError(null);
      setNotice(null);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const cursos: Array<Partial<Sence>> = [];

      for (const row of rows) {
        const codigoSence =
          row['Código Sence'] ??
          row['Codigo Sence'] ??
          row['CODIGO SENCE'] ??
          row['CÓDIGO SENCE'] ??
          row['codigo_sence'] ??
          row.Codigo_Sence ??
          row.CODIGO_SENCE;

        if (!codigoSence) continue;

        const nombreSence =
          row['Nombre_SENCE'] ??
          row['Nombre SENCE'] ??
          row['NOMBRE_SENCE'] ??
          row['NOMBRE SENCE'] ??
          row.nombre_sence;

        const horasTeoricas = toNumberCell(row['Horas Teóricas'] ?? row['Horas Teoricas'] ?? row.horas_teoricas);
        const horasPracticas = toNumberCell(row['Horas Practicas'] ?? row['Horas Prácticas'] ?? row.horas_practicas);
        const horasElearning = toNumberCell(row['Horas E-learning'] ?? row['Horas E-Learning'] ?? row['Horas Elearning'] ?? row.horas_elearning);
        const horasTotales = toNumberCell(row['Horas Totales'] ?? row['Horas totales'] ?? row.horas_totales);
        const numeroParticipantes = toNumberCell(row['Número de Participantes'] ?? row['Numero de Participantes'] ?? row.numero_participantes);

        const terminoVigencia = row['Término Vigencia'] ?? row['Termino Vigencia'] ?? row.termino_vigencia;
        const area = row['Área'] ?? row['Area'] ?? row.area;
        const especialidad = row['Especialidad'] ?? row.especialidad;
        const modalidadInstruccion = row['Modalidad de instrucción'] ?? row['Modalidad de instruccion'] ?? row.modalidad_instruccion;
        const modo = row['Modo'] ?? row.modo;
        const valorEfectivo = toNumberCell(row['Valor efectivo por participante'] ?? row['Valor efectivo participante'] ?? row.valor_efectivo_participante);
        const valorMaximoImputable = toNumberCell(row['Valor máximo imputable'] ?? row['Valor maximo imputable'] ?? row.valor_maximo_imputable);
        const numeroSolicitud = row['N° Solicitud'] ?? row['No Solicitud'] ?? row.numero_solicitud;
        const fechaResolucion = row['Fecha Resolución'] ?? row['Fecha Resolucion'] ?? row.fecha_resolucion;
        const numeroResolucion = row['Número Resolución'] ?? row['Numero Resolución'] ?? row['Numero Resolucion'] ?? row.numero_resolucion;
        const valorHoraImputable = toNumberCell(row['Valor Hora Imputable'] ?? row.valor_hora_imputable);

        const exclusivoCliente = toBoolCell(row['Exclusivo cliente'] ?? row['Exclusivo Cliente'] ?? row.exclusivo_cliente);
        const dirigidoPorRelator = toBoolCell(row['Dirigido por relator'] ?? row['Dirigido por Relator'] ?? row.dirigido_por_relator);
        const incluyeTablet = toBoolCell(row['Incluye Tablet'] ?? row['incluye tablet'] ?? row.incluye_tablet);
        const otec = row['OTEC'] ?? row.otec;

        cursos.push({
          codigo_sence: String(codigoSence).trim(),
          nombre_sence: nombreSence ? String(nombreSence).trim() : undefined,
          horas_teoricas: horasTeoricas,
          horas_practicas: horasPracticas,
          horas_elearning: horasElearning,
          horas_totales: horasTotales,
          numero_participantes: numeroParticipantes,
          termino_vigencia: terminoVigencia ? String(terminoVigencia).trim() : undefined,
          area: area ? String(area).trim() : undefined,
          especialidad: especialidad ? String(especialidad).trim() : undefined,
          modalidad_instruccion: modalidadInstruccion ? String(modalidadInstruccion).trim() : undefined,
          modo: modo ? String(modo).trim() : undefined,
          valor_efectivo_participante: valorEfectivo,
          valor_maximo_imputable: valorMaximoImputable,
          numero_solicitud: numeroSolicitud ? String(numeroSolicitud).trim() : undefined,
          fecha_resolucion: fechaResolucion ? String(fechaResolucion).trim() : undefined,
          numero_resolucion: numeroResolucion ? String(numeroResolucion).trim() : undefined,
          valor_hora_imputable: valorHoraImputable,
          exclusivo_cliente: exclusivoCliente,
          dirigido_por_relator: dirigidoPorRelator,
          incluye_tablet: incluyeTablet,
          otec: otec ? String(otec).trim() : undefined,
        });
      }

      if (!cursos.length) {
        setNotice('No se encontraron filas válidas en el Excel (falta "Código Sence").');
        return;
      }

      // Refrescar UI localmente con lo leído del Excel (merge por codigo_sence)
      const byCodigo = new Map<string, Sence>();
      for (const existing of data) {
        if (existing.codigo_sence) {
          byCodigo.set(existing.codigo_sence, existing);
        }
      }
      for (const c of cursos) {
        const key = String(c.codigo_sence);
        const existing = byCodigo.get(key) || ({ code: 0, codigo_sence: key } as Sence);
        byCodigo.set(key, { ...existing, ...c });
      }
      setData(Array.from(byCodigo.values()));

      // Enviar al backend para persistir
      const r = await senceApi.importBulk(cursos);
      await load();
      setNotice(`Importación desde Excel completa: procesadas ${cursos.length} filas. Insertados ${r.inserted}, actualizados ${r.updated}. Total: ${r.total}.`);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Error importando desde Excel');
    } finally {
      setExcelImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <Sidebar />
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Sence</h2>
                <p className="text-sm text-gray-500">Listado de registros Sence</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleImportFromExcelClick}
                  disabled={excelImporting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {excelImporting ? 'Importando...' : 'Cargar Excel'}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.csv"
                  onChange={handleExcelFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {error && (
              <div className="px-6 pt-2 text-sm text-red-600">{error}</div>
            )}
            {notice && (
              <div className="px-6 pt-2 text-sm text-yellow-700 bg-yellow-50">{notice}</div>
            )}

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código interno</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código Sence</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre SENCE</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Horas Teóricas</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Horas Prácticas</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Horas E-learning</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Horas Totales</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">N° Participantes</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Término Vigencia</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidad</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modalidad de instrucción</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modo</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor efectivo / participante</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor máximo imputable</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Solicitud</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Resolución</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Resolución</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Hora Imputable</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Exclusivo cliente</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Dirigido por relator</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Incluye Tablet</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OTEC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={24} className="px-3 py-6 text-center text-gray-500">Cargando...</td>
                      </tr>
                    ) : data.length === 0 ? (
                      <tr>
                        <td colSpan={24} className="px-3 py-6 text-center text-gray-500">Sin registros</td>
                      </tr>
                    ) : (
                      data.map((row) => (
                        <tr key={row._id || row.code}>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.code}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.codigo_sence || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.nombre_sence || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-gray-900">{row.horas_teoricas ?? '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-gray-900">{row.horas_practicas ?? '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-gray-900">{row.horas_elearning ?? '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-gray-900">{row.horas_totales ?? '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-gray-900">{row.numero_participantes ?? '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.termino_vigencia || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.area || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.especialidad || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.modalidad_instruccion || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.modo || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-gray-900">{row.valor_efectivo_participante ?? '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-gray-900">{row.valor_maximo_imputable ?? '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.numero_solicitud || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.fecha_resolucion || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.numero_resolucion || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-gray-900">{row.valor_hora_imputable ?? '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-center text-gray-900">{row.exclusivo_cliente == null ? '-' : (row.exclusivo_cliente ? 'Sí' : 'No')}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-center text-gray-900">{row.dirigido_por_relator == null ? '-' : (row.dirigido_por_relator ? 'Sí' : 'No')}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-center text-gray-900">{row.incluye_tablet == null ? '-' : (row.incluye_tablet ? 'Sí' : 'No')}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.otec || '-'}</td>
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
    </div>
  );
};

export default SencePage;
