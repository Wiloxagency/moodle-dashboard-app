import config from '../config/environment';

export interface ReporteAvanceRow {
  empresa: string;
  nombreCurso: string;
  idSence: string;
  rut: string;
  nombres: string;
  apellidos: string;
  email: string;
  fechaInicio: string;
  fechaFinal: string;
  notaFinal: number | null;
  porcentajeAvance: number | null;
  porcentajeAsistencia: number | null;
  fechaReporte: string;
  correlativo: number | null;
  responsable: string;
}

interface ApiResponse<T> { success: boolean; data?: T; error?: { message: string }; generatedAt?: string }

const BASE = `${config.apiBaseUrl}/reportes/avances`;

export const reportesApi = {
  async listAvances(): Promise<{ data: ReporteAvanceRow[]; generatedAt?: string }> {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error('Error fetching reporte de avances');
    const json: ApiResponse<ReporteAvanceRow[]> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return { data: json.data || [], generatedAt: json.generatedAt };
  }
};

export default reportesApi;
