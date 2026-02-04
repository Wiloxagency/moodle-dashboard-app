import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { inscripcionesApi } from '../services/inscripciones';
import type { Inscripcion } from '../services/inscripciones';
import { participantesApi } from '../services/participantes';
import type { Participante } from '../services/participantes';
import { empresasApi } from '../services/empresas';
import { ejecutivosApi } from '../services/ejecutivos';
import { modalidadesApi } from '../services/modalidades';

interface ExcelRow {
  Ficha?: string | number;
  RUT?: string;
  Nombres?: string;
  Apellidos?: string;
  'Correo electrónico'?: string;
  'Télefono'?: string; // Nota: el Excel real usa 'é' con acento
  'Valor Cobrado'?: number | string;
  '%Franquicia'?: number | string;
  Observaciones?: string;
  Empresa?: string;
  Curso?: string;
  'ID  Moodle'?: string | number;
  Correlativo?: string | number;
  'Orden de Compra'?: string | number;
  'Código Sence'?: string | number;
  'ID Sence'?: string | number;
  Modalidad?: string;
  'F. Inicio'?: string | number;
  'F. Termino'?: string | number;
  Ejecutivo?: string;
  Responsable?: string | number;
  [key: string]: any;
}

interface ProcessedData {
  inscripciones: Array<Partial<Inscripcion> & { participantes: Array<Omit<Participante, '_id' | 'numeroInscripcion' | 'rutkey'>> }>;
}

interface ErrorDetallado {
  numeroInscripcion?: number;
  ficha: string;
  participante: string;
  error: string;
}

const ExportarInscripciones: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [erroresDetallados, setErroresDetallados] = useState<ErrorDetallado[]>([]);

  // Función para normalizar valores vacíos o 0
  const normalizeValue = (value: any): string => {
    if (value === undefined || value === null || value === '' || value === 0 || value === '0') {
      return '';
    }
    return String(value).trim();
  };

  // Función para convertir fecha serial de Excel a ISO
  const excelDateToISO = (serial: number): string => {
    if (!serial || serial === 0) return '';
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    return dateInfo.toISOString();
  };

  // Procesar el archivo Excel
  const processExcel = (file: File): Promise<ProcessedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          // Procesar filas y agrupar por ficha
          const inscripcionesMap = new Map<string, {
            ficha: string;
            fichaCount: number;
            participantes: Array<Omit<Participante, '_id' | 'numeroInscripcion' | 'rutkey'>>;
            inscripcionData: Partial<Inscripcion>;
          }>();

          rows.forEach((row, index) => {
            const ficha = normalizeValue(row.Ficha);
            
            if (!ficha) {
              console.warn(`Fila ${index + 2}: Ficha vacía, omitiendo`);
              return;
            }

            // Crear el participante
            const participante: Omit<Participante, '_id' | 'numeroInscripcion' | 'rutkey'> = {
              nombres: normalizeValue(row.Nombres),
              apellidos: normalizeValue(row.Apellidos),
              rut: normalizeValue(row.RUT),
              mail: normalizeValue(row['Correo electrónico']),
              telefono: normalizeValue(row['Télefono']), // Nota: 'é' con acento
              valorCobrado: row['Valor Cobrado'] && row['Valor Cobrado'] !== 0 ? Number(row['Valor Cobrado']) : undefined,
              franquiciaPorcentaje: row['%Franquicia'] && row['%Franquicia'] !== 0 ? Number(row['%Franquicia']) * 100 : undefined,
              costoOtic: null as any,
              costoEmpresa: null as any,
              estadoInscripcion: normalizeValue(row.Observaciones),
              observacion: normalizeValue(row.Observaciones),
            } as any;

            // Si la ficha no existe, crear nueva inscripción con los datos del Excel
            if (!inscripcionesMap.has(ficha)) {
              inscripcionesMap.set(ficha, {
                ficha,
                fichaCount: 0,
                participantes: [],
                inscripcionData: {
                  correlativo: row.Correlativo ? Number(row.Correlativo) : 0,
                  codigoCurso: normalizeValue(row['ID  Moodle']) || '0', // Mismo que idMoodle
                  empresa: normalizeValue(row.Empresa) || 'Mutual', // Se cambiará a code después
                  codigoSence: normalizeValue(row['Código Sence']),
                  ordenCompra: normalizeValue(row['Orden de Compra']),
                  idSence: normalizeValue(row['ID Sence']),
                  idMoodle: normalizeValue(row['ID  Moodle']) || '0', // Obligatorio
                  nombreCurso: normalizeValue(row.Curso),
                  modalidad: normalizeValue(row.Modalidad) || 'e-learning', // Mantener nombre original del Excel
                  inicio: typeof row['F. Inicio'] === 'number' ? excelDateToISO(row['F. Inicio']) : new Date().toISOString(),
                  termino: typeof row['F. Termino'] === 'number' ? excelDateToISO(row['F. Termino']) : undefined,
                  ejecutivo: normalizeValue(row.Ejecutivo) || 'N/A', // Obligatorio
                  numAlumnosInscritos: 0, // Se actualizará con el contador
                  statusAlumnos: 'Pendiente',
                }
              });
            }

            // Incrementar contador y agregar participante
            const inscripcionEntry = inscripcionesMap.get(ficha)!;
            inscripcionEntry.fichaCount++;
            inscripcionEntry.participantes.push(participante);
          });

          // Convertir el mapa a array (NO enviamos numeroInscripcion, lo genera el backend)
          const inscripciones = Array.from(inscripcionesMap.values()).map((inscEntry) => {
            // Crear la inscripción con todos los datos del Excel
            // La ficha se guarda tal cual viene del Excel
            const inscripcion: Partial<Inscripcion> & { participantes: Array<Omit<Participante, '_id' | 'numeroInscripcion' | 'rutkey'>> } = {
              ficha: inscEntry.ficha, // Ficha del Excel sin modificar
              ...inscEntry.inscripcionData,
              numAlumnosInscritos: inscEntry.participantes.length,
              participantes: inscEntry.participantes
            };

            return inscripcion;
          });

          resolve({ inscripciones });
        } catch (err) {
          reject(new Error(`Error procesando Excel: ${err instanceof Error ? err.message : 'Error desconocido'}`));
        }
      };

      reader.onerror = () => reject(new Error('Error leyendo el archivo'));
      reader.readAsBinaryString(file);
    });
  };

  // Crear o verificar ejecutivos y devolver mapa nombre -> code
  const createOrGetEjecutivos = async (data: ProcessedData): Promise<{ ejecutivosCreados: string[], ejecutivosMap: Map<string, number> }> => {
    const ejecutivosUnicos = new Set<string>();
    
    // Recopilar todos los ejecutivos únicos
    data.inscripciones.forEach(insc => {
      if (insc.ejecutivo) {
        ejecutivosUnicos.add(insc.ejecutivo);
      }
    });

    // Obtener ejecutivos existentes
    const ejecutivosExistentes = await ejecutivosApi.list();
    // Crear mapa por nombre completo (nombres + apellidos)
    const nombresExistentes = new Set(
      ejecutivosExistentes.map(e => `${e.nombres} ${e.apellidos}`.trim())
    );

    // Crear ejecutivos que no existen
    const ejecutivosCreados: string[] = [];
    for (const nombreEjecutivo of ejecutivosUnicos) {
      if (!nombresExistentes.has(nombreEjecutivo)) {
        try {
          // Separar nombres y apellidos (asumimos que el primer token es nombres, el resto apellidos)
          const parts = nombreEjecutivo.split(' ');
          const nombres = parts[0] || nombreEjecutivo;
          const apellidos = parts.slice(1).join(' ') || '';
          
          await ejecutivosApi.create({
            nombres,
            apellidos,
            status: 'Activo'
          });
          ejecutivosCreados.push(nombreEjecutivo);
        } catch (err) {
          console.warn(`No se pudo crear ejecutivo ${nombreEjecutivo}:`, err);
        }
      }
    }

    // Volver a obtener todos los ejecutivos
    const todosLosEjecutivos = await ejecutivosApi.list();
    
    // Crear mapa: nombre completo -> code
    const ejecutivosMap = new Map<string, number>();
    todosLosEjecutivos.forEach(ej => {
      const nombreCompleto = `${ej.nombres} ${ej.apellidos}`.trim();
      ejecutivosMap.set(nombreCompleto, ej.code);
    });

    return { ejecutivosCreados, ejecutivosMap };
  };

  // Crear o verificar modalidades y devolver mapa nombre -> code
  const createOrGetModalidades = async (data: ProcessedData): Promise<{ modalidadesCreadas: string[], modalidadesMap: Map<string, number> }> => {
    const modalidadesUnicas = new Set<string>();
    
    // Recopilar todas las modalidades únicas
    data.inscripciones.forEach(insc => {
      if (insc.modalidad) {
        modalidadesUnicas.add(insc.modalidad);
      }
    });

    // Obtener modalidades existentes
    const modalidadesExistentes = await modalidadesApi.list();
    const nombresExistentes = new Set(
      modalidadesExistentes.map(m => m.nombre?.toLowerCase())
    );

    // Crear modalidades que no existen
    const modalidadesCreadas: string[] = [];
    for (const nombreModalidad of modalidadesUnicas) {
      if (!nombresExistentes.has(nombreModalidad.toLowerCase())) {
        try {
          // Determinar los flags según el nombre
          const modalidadLower = nombreModalidad.toLowerCase();
          const esSincronico = modalidadLower.includes('sincrón') || 
                              (modalidadLower.includes('sincr') && !modalidadLower.includes('asincr'));
          const esAsincronico = modalidadLower.includes('asincr') || 
                                modalidadLower.includes('e-learning') || 
                                modalidadLower.includes('elearning');
          
          await modalidadesApi.create({
            nombre: nombreModalidad,
            sincronico: esSincronico,
            asincronico: esAsincronico
          });
          modalidadesCreadas.push(nombreModalidad);
        } catch (err) {
          console.warn(`No se pudo crear modalidad ${nombreModalidad}:`, err);
        }
      }
    }

    // Volver a obtener todas las modalidades
    const todasLasModalidades = await modalidadesApi.list();
    
    // Crear mapa: nombre -> code
    const modalidadesMap = new Map<string, number>();
    todasLasModalidades.forEach(mod => {
      if (mod.nombre) {
        modalidadesMap.set(mod.nombre, mod.code);
      }
    });

    return { modalidadesCreadas, modalidadesMap };
  };

  // Crear o verificar empresas y devolver mapa nombre -> code
  const createOrGetEmpresas = async (data: ProcessedData): Promise<{ empresasCreadas: string[], empresasMap: Map<string, number> }> => {
    const empresasUnicas = new Set<string>();
    
    // Recopilar todas las empresas únicas
    data.inscripciones.forEach(insc => {
      if (insc.empresa) {
        empresasUnicas.add(insc.empresa);
      }
    });

    // Obtener empresas existentes
    const empresasExistentes = await empresasApi.list();
    const nombresExistentes = new Set(empresasExistentes.map(e => e.nombre));

    // Crear empresas que no existen
    const empresasCreadas: string[] = [];
    for (const nombreEmpresa of empresasUnicas) {
      if (!nombresExistentes.has(nombreEmpresa)) {
        try {
          await empresasApi.create({
            nombre: nombreEmpresa,
            status: 'Activo'
          });
          empresasCreadas.push(nombreEmpresa);
        } catch (err) {
          console.warn(`No se pudo crear empresa ${nombreEmpresa}:`, err);
        }
      }
    }

    // Volver a obtener todas las empresas para tener los codes actualizados
    const todasLasEmpresas = await empresasApi.list();
    
    // Crear mapa: nombre -> code
    const empresasMap = new Map<string, number>();
    todasLasEmpresas.forEach(emp => {
      empresasMap.set(emp.nombre, emp.code);
    });

    return { empresasCreadas, empresasMap };
  };

  // Enviar datos al backend
  const sendToBackend = async (data: ProcessedData) => {
    const results = {
      empresasCreadas: 0,
      ejecutivosCreados: 0,
      modalidadesCreadas: 0,
      inscripcionesCreadas: 0,
      participantesCreados: 0,
      errores: [] as string[],
      erroresDetallados: [] as Array<{
        numeroInscripcion?: number;
        ficha: string;
        participante: string;
        error: string;
      }>
    };

    // Primero crear empresas, ejecutivos y modalidades
    let empresasMap: Map<string, number> = new Map();
    let ejecutivosMap: Map<string, number> = new Map();
    let modalidadesMap: Map<string, number> = new Map();
    
    try {
      const result = await createOrGetEmpresas(data);
      results.empresasCreadas = result.empresasCreadas.length;
      empresasMap = result.empresasMap;
      console.log('Mapa de empresas (nombre -> code):', Object.fromEntries(empresasMap));
    } catch (err) {
      results.errores.push(`Error creando empresas: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }

    try {
      const result = await createOrGetEjecutivos(data);
      results.ejecutivosCreados = result.ejecutivosCreados.length;
      ejecutivosMap = result.ejecutivosMap;
      console.log('Mapa de ejecutivos (nombre -> code):', Object.fromEntries(ejecutivosMap));
    } catch (err) {
      results.errores.push(`Error creando ejecutivos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }

    try {
      const result = await createOrGetModalidades(data);
      results.modalidadesCreadas = result.modalidadesCreadas.length;
      modalidadesMap = result.modalidadesMap;
      console.log('Mapa de modalidades (nombre -> code):', Object.fromEntries(modalidadesMap));
    } catch (err) {
      results.errores.push(`Error creando modalidades: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }

    // Luego crear inscripciones y participantes
    for (const inscripcionData of data.inscripciones) {
      try {
        const { participantes, ...inscripcionPayload } = inscripcionData;
        
        // Convertir nombre de empresa a code
        const empresaOriginal = inscripcionPayload.empresa;
        if (inscripcionPayload.empresa && empresasMap.has(inscripcionPayload.empresa)) {
          const empresaCode = empresasMap.get(inscripcionPayload.empresa);
          inscripcionPayload.empresa = String(empresaCode);
          console.log(`Empresa convertida: "${empresaOriginal}" -> "${inscripcionPayload.empresa}" (code: ${empresaCode})`);
        } else {
          console.warn(`Empresa no encontrada en mapa: "${inscripcionPayload.empresa}"`);
        }

        // Convertir nombre de ejecutivo a code
        const ejecutivoOriginal = inscripcionPayload.ejecutivo;
        if (inscripcionPayload.ejecutivo && ejecutivosMap.has(inscripcionPayload.ejecutivo)) {
          const ejecutivoCode = ejecutivosMap.get(inscripcionPayload.ejecutivo);
          inscripcionPayload.ejecutivo = String(ejecutivoCode);
          console.log(`Ejecutivo convertido: "${ejecutivoOriginal}" -> "${inscripcionPayload.ejecutivo}" (code: ${ejecutivoCode})`);
        } else {
          console.warn(`Ejecutivo no encontrado en mapa: "${inscripcionPayload.ejecutivo}"`);
        }

        // Convertir nombre de modalidad a code
        const modalidadOriginal = inscripcionPayload.modalidad;
        if (inscripcionPayload.modalidad && modalidadesMap.has(inscripcionPayload.modalidad)) {
          const modalidadCode = modalidadesMap.get(inscripcionPayload.modalidad);
          inscripcionPayload.modalidad = String(modalidadCode);
          console.log(`Modalidad convertida: "${modalidadOriginal}" -> "${inscripcionPayload.modalidad}" (code: ${modalidadCode})`);
        } else {
          console.warn(`Modalidad no encontrada en mapa: "${inscripcionPayload.modalidad}"`);
        }
        
        // Crear la inscripción
        const inscripcionCreada = await inscripcionesApi.create(inscripcionPayload);
        results.inscripcionesCreadas++;

        // Crear los participantes asociados
        for (const participante of participantes) {
          try {
            await participantesApi.create({
              ...participante,
              numeroInscripcion: inscripcionCreada.numeroInscripcion
            });
            results.participantesCreados++;
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
            results.errores.push(
              `Error creando participante ${participante.nombres} ${participante.apellidos}: ${errorMsg}`
            );
            results.erroresDetallados.push({
              numeroInscripcion: inscripcionCreada.numeroInscripcion,
              ficha: inscripcionData.ficha || 'N/A',
              participante: `${participante.nombres} ${participante.apellidos} (RUT: ${participante.rut})`,
              error: errorMsg
            });
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        results.errores.push(
          `Error creando inscripción ${inscripcionData.ficha}: ${errorMsg}`
        );
        results.erroresDetallados.push({
          ficha: inscripcionData.ficha || 'N/A',
          participante: `Inscripción completa (${inscripcionData.participantes?.length || 0} participantes)`,
          error: errorMsg
        });
      }
    }

    return results;
  };

  // Manejar la carga del archivo
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar extensión
    if (!file.name.endsWith('.xlsx')) {
      setError('Por favor, selecciona un archivo Excel (.xlsx)');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setErroresDetallados([]);

    try {
      // Procesar Excel
      const processedData = await processExcel(file);
      
      console.log('Datos procesados:', JSON.stringify(processedData, null, 2));

      // Enviar al backend
      const results = await sendToBackend(processedData);

      // Mostrar resultados
      let message = '';
      if (results.empresasCreadas > 0) {
        message += `✓ ${results.empresasCreadas} empresas creadas\n`;
      }
      if (results.ejecutivosCreados > 0) {
        message += `✓ ${results.ejecutivosCreados} ejecutivos creados\n`;
      }
      if (results.modalidadesCreadas > 0) {
        message += `✓ ${results.modalidadesCreadas} modalidades creadas\n`;
      }
      message += `✓ ${results.inscripcionesCreadas} inscripciones creadas\n`;
      message += `✓ ${results.participantesCreados} participantes creados`;
      
      setSuccess(message);
      
      // Si hay errores, mostrarlos con detalles
      if (results.erroresDetallados.length > 0) {
        setError(`Se encontraron ${results.erroresDetallados.length} errores durante la importación`);
        setErroresDetallados(results.erroresDetallados);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando el archivo');
    } finally {
      setLoading(false);
      // Limpiar el input para permitir cargar el mismo archivo nuevamente
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Exportar Nuevas Inscripciones</h2>
      
      <div className="space-y-4">
        {/* Botón de carga */}
        <label className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
          />
          <Upload className="w-5 h-5 mr-2" />
          {loading ? 'Procesando...' : 'Exportar nuevas inscripciones'}
        </label>

        {/* Mensaje de éxito */}
        {success && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Importación completada</p>
              <pre className="text-sm text-green-700 mt-1 whitespace-pre-wrap">{success}</pre>
            </div>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            
            {/* Tabla de errores detallados */}
            {erroresDetallados.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-red-200 text-sm">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                        Nº Inscripción
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                        Ficha
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                        Participante
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-red-200">
                    {erroresDetallados.map((errorDetalle, idx) => (
                      <tr key={idx} className="hover:bg-red-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {errorDetalle.numeroInscripcion || 'N/A'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                          {errorDetalle.ficha}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {errorDetalle.participante}
                        </td>
                        <td className="px-3 py-2 text-sm text-red-700">
                          {errorDetalle.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportarInscripciones;
