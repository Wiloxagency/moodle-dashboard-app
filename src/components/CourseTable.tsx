import React, { useState, useEffect } from 'react';
import apiService, { ApiError } from '../services/api';
import type { SimplifiedCourse } from '../types/api';

interface CourseTableState {
  courses: SimplifiedCourse[];
  loading: boolean;
  error: string | null;
}

const CourseTable: React.FC = () => {
  const [state, setState] = useState<CourseTableState>({
    courses: [],
    loading: true,
    error: null
  });

  // Load courses for category 57
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const coursesData = await apiService.getSimplifiedCoursesByCategory(57);
        
        setState(prev => ({
          ...prev,
          courses: coursesData.courses,
          loading: false
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof ApiError ? error.message : 'Error al cargar los cursos'
        }));
      }
    };

    loadCourses();
  }, []);

  // Helper function to calculate remaining days
  const calculateRemainingDays = (endDate: number): number | null => {
    // Return null for courses without end date
    if (!endDate || endDate === 0) {
      return null;
    }
    
    const today = new Date();
    const end = new Date(endDate * 1000);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Helper function to format date
  const formatDate = (timestamp: number): string => {
    return apiService.formatDate(timestamp);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm max-w-[1000px]">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Calendario de Cursos Activos</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">No. Ficha</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Curso</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Fecha de Inicio</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Fecha de Cierre</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Días Restantes</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Total Alumnos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {state.loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Cargando cursos...</span>
                  </div>
                </td>
              </tr>
            ) : state.error ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-red-600">
                  <div className="flex flex-col items-center space-y-2">
                    <span>❌ Error al cargar los cursos</span>
                    <span className="text-sm text-gray-500">{state.error}</span>
                  </div>
                </td>
              </tr>
            ) : state.courses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No hay cursos disponibles en esta categoría
                </td>
              </tr>
            ) : (
              state.courses.map((course, index) => {
                const remainingDays = calculateRemainingDays(course.enddate);
                return (
                  <tr key={course.id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{course.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{course.fullname}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(course.startdate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(course.enddate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {remainingDays !== null ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          remainingDays <= 7 ? 'bg-red-100 text-red-800' :
                          remainingDays <= 30 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {remainingDays} días
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin fecha límite</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{course.students}</td>
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
          {state.loading ? (
            'Cargando...'
          ) : state.error ? (
            'Error al cargar datos'
          ) : (
            `Mostrando ${state.courses.length} cursos activos`
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseTable;
