import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Inscripcion } from '../services/inscripciones';
import inscripcionesApi from '../services/inscripciones';
import participantesApi from '../services/participantes';

interface DashboardTableState {
  inscripciones: Inscripcion[];
  participantCounts: Record<string, number>;
  loading: boolean;
  error: string | null;
}

const CourseTable: React.FC = () => {
  const [state, setState] = useState<DashboardTableState>({
    inscripciones: [],
    participantCounts: {},
    loading: true,
    error: null
  });

  // Cargar inscripciones y conteos de participantes
  useEffect(() => {
    const load = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const ins = await inscripcionesApi.list();
        const ids = ins
          .map(i => i.numeroInscripcion)
          .filter((n): n is number => n !== null && n !== undefined);
        let counts: Record<string, number> = {};
        try {
          counts = await participantesApi.counts(ids);
        } catch (e) {
          // Si falla el conteo, continuamos usando los valores locales
          counts = {};
        }
        setState(prev => ({ ...prev, inscripciones: ins, participantCounts: counts, loading: false }));
      } catch (error: any) {
        setState(prev => ({ ...prev, loading: false, error: error?.message || 'Error al cargar inscripciones' }));
      }
    };
    load();
  }, []);

  // Cálculo: (termino - inicio) en días, según requerimiento
  const calculateDaysBetween = (inicio?: string, termino?: string): number | null => {
    if (!inicio || !termino) return null;
    const start = new Date(inicio).getTime();
    const end = new Date(termino).getTime();
    if (!isFinite(start) || !isFinite(end)) return null;
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  };

  const formatISODate = (value?: string): string => (value ? new Date(value).toLocaleDateString('es-CL') : '');

  return (
    <div className="bg-white rounded-lg shadow-sm w-full max-w-[1150px] mx-auto">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Inscripciones de Cursos Activos</h2>
        <Link
          to="/reporte-avances"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Reporte de Avances
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">No. Inscripción</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Moodle ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Correlativo</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Curso</th>
              <th className="px-4 py-3 text-left text-sm font-medium min-w-[140px]">Fecha de Inicio</th>
              <th className="px-4 py-3 text-left text-sm font-medium min-w-[140px]">Fecha de Cierre</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Días Restantes</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Total Alumnos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {state.loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Cargando inscripciones...</span>
                  </div>
                </td>
              </tr>
            ) : state.error ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-red-600">
                  <div className="flex flex-col items-center space-y-2">
                    <span>❌ Error al cargar las inscripciones</span>
                    <span className="text-sm text-gray-500">{state.error}</span>
                  </div>
                </td>
              </tr>
            ) : state.inscripciones.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No hay inscripciones disponibles
                </td>
              </tr>
            ) : (
              state.inscripciones.map((insc, index) => {
                const days = calculateDaysBetween(insc.inicio, insc.termino);
                const totalAlumnos = state.participantCounts[insc.numeroInscripcion] ?? insc.numAlumnosInscritos;
                return (
                  <tr key={insc._id || insc.numeroInscripcion || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{insc.numeroInscripcion}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{insc.idMoodle || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{insc.correlativo ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-[300px] truncate" title={insc.nombreCurso || ""}>{insc.nombreCurso || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap min-w-[140px]">{formatISODate(insc.inicio)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap min-w-[140px]">{formatISODate(insc.termino)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {days !== null ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {days} días
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{totalAlumnos}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer with course count */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {state.loading ? 'Cargando...' : state.error ? 'Error al cargar datos' : `Mostrando ${state.inscripciones.length} inscripciones`}
        </div>
      </div>
    </div>
  );
};

export default CourseTable;
