import React from 'react';
import { Link } from 'react-router-dom';
import type { DashboardInscripcion } from '../services/dashboard';

interface Props {
  data: DashboardInscripcion[];
  loading?: boolean;
  error?: string | null;
}

const CourseTable: React.FC<Props> = ({ data, loading, error }) => {
  const calculateDaysRemaining = (termino?: string): number | null => {
    if (!termino) return null;
    const end = new Date(termino);
    if (isNaN(end.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Cargando inscripciones...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-red-500">
                  <div className="flex flex-col items-center space-y-2">
                    <span>❌ Error al cargar las inscripciones</span>
                    <span className="text-sm">{error}</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No hay inscripciones disponibles
                </td>
              </tr>
            ) : (
              data.map((insc) => {
                const days = calculateDaysRemaining(insc.termino);
                const totalAlumnos = insc.participantCount ?? insc.numAlumnosInscritos ?? 0;
                return (
                  <tr key={String(insc.numeroInscripcion)} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {insc.numeroInscripcion}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{insc.idMoodle || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{insc.correlativo ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{insc.nombreCurso || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatISODate(insc.inicio)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatISODate(insc.termino)}</td>
                    <td className="px-4 py-3 text-sm">
                      {days !== null ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          days > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {days} días
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{totalAlumnos}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-200">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Error al cargar datos</p>
        ) : (
          <p className="text-sm text-gray-500">Mostrando {data.length} inscripciones</p>
        )}
      </div>
    </div>
  );
};

export default CourseTable;
