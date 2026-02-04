import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { inscripcionesApi, Inscripcion } from '../services/inscripciones';
import { participantesApi, Participante } from '../services/participantes';
import { empresasApi, Empresa } from '../services/empresas';

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

const ExportarInscripciones: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

          let currentNumeroInscripcion = 100100; // Corregido: comienza en 100100

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
              // Normalizar modalidad
              const modalidadRaw = normalizeValue(row.Modalidad).toLowerCase();
              let modalidad = 'e-learning';
              if (modalidadRaw.includes('asincr') || modalidadRaw.includes('async')) {
                modalidad = 'e-learning';
              } else if (modalidadRaw.includes('sincrón') || (modalidadRaw.includes('sincr') && !modalidadRaw.includes('asincr'))) {
                modalidad = 'sincrónico';
              }

              inscripcionesMap.set(ficha, {
                ficha,
                fichaCount: 0,
                participantes: [],
                inscripcionData: {
                  correlativo: row.Correlativo ? Number(row.Correlativo) : 0,
                  codigoCurso: normalizeValue(row['Código Sence']) || 'N/A', // Obligatorio
                  empresa: normalizeValue(row.Empresa) || 'Mutual',
                  codigoSence: normalizeValue(row['Código Sence']),
                  ordenCompra: normalizeValue(row['Orden de Compra']),
                  idSence: normalizeValue(row['ID Sence']),
                  idMoodle: normalizeValue(row['ID  Moodle']) || '0', // Obligatorio
                  nombreCurso: normalizeValue(row.Curso),
                  modalidad: modalidad,
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

  // Crear o verificar empresas
  const createOrGetEmpresas = async (data: ProcessedData) => {
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

    return empresasCreadas;
  };

  // Enviar datos al backend
  const sendToBackend = async (data: ProcessedData) => {
    const results = {
      empresasCreadas: 0,
      inscripcionesCreadas: 0,
      participantesCreados: 0,
      errores: [] as string[]
    };

    // Primero crear las empresas
    try {
      const empresasNuevas = await createOrGetEmpresas(data);
      results.empresasCreadas = empresasNuevas.length;
    } catch (err) {
      results.errores.push(`Error creando empresas: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }

    // Luego crear inscripciones y participantes
    for (const inscripcionData of data.inscripciones) {
      try {
        const { participantes, ...inscripcionPayload } = inscripcionData;
        
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
            results.errores.push(
              `Error creando participante ${participante.nombres} ${participante.apellidos}: ${err instanceof Error ? err.message : 'Error desconocido'}`
            );
          }
        }
      } catch (err) {
        results.errores.push(
          `Error creando inscripción ${inscripcionData.ficha}: ${err instanceof Error ? err.message : 'Error desconocido'}`
        );
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
      message += `✓ ${results.inscripcionesCreadas} inscripciones creadas\n`;
      message += `✓ ${results.participantesCreados} participantes creados`;
      
      if (results.errores.length > 0) {
        message += `\n\n⚠ ${results.errores.length} errores:\n${results.errores.slice(0, 5).join('\n')}`;
        if (results.errores.length > 5) {
          message += `\n... y ${results.errores.length - 5} más`;
        }
      }

      setSuccess(message);
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
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Instrucciones */}
        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-medium">Instrucciones:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>El archivo debe ser formato Excel (.xlsx)</li>
            <li>Columnas requeridas: <strong>Ficha, RUT, Nombres, Apellidos, Correo electrónico, Télefono, Valor Cobrado, %Franquicia, Observaciones, Empresa, Curso, ID Moodle, Correlativo, Orden de Compra, Código Sence, ID Sence, Modalidad, F. Inicio, F. Termino, Ejecutivo</strong></li>
            <li>Los números de inscripción se generan automáticamente por el backend comenzando desde <strong>100100</strong></li>
            <li>Las <strong>empresas</strong> se crean automáticamente si no existen (solo con nombre y status "Activo")</li>
            <li>Los participantes con la misma <strong>Ficha</strong> se agrupan en una inscripción</li>
            <li>El campo <strong>ficha</strong> se guarda exactamente como viene en el Excel (ej: "2506-001")</li>
            <li>El campo <strong>rutkey</strong> se genera automáticamente (normalización del RUT)</li>
            <li>El campo <strong>Observaciones</strong> del Excel se asigna a <strong>estadoInscripcion</strong> en la BD</li>
            <li>Los campos <strong>costoOtic</strong> y <strong>costoEmpresa</strong> se guardan siempre como <strong>null</strong></li>
            <li>Los campos vacíos o con valor 0 se guardan como cadena vacía</li>
            <li>Las fechas (F. Inicio, F. Termino) se convierten automáticamente de formato Excel a ISO</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExportarInscripciones;
