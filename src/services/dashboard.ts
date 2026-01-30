import config from '../config/environment';

export interface Metrics {
  becados: number;
  empresa: number;
  sence: number;
  senceEmpresa: number;
}

export interface DashboardInscripcion {
  numeroInscripcion: number | string;
  idMoodle?: string;
  correlativo?: number;
  nombreCurso?: string;
  modalidad?: string;
  inicio?: string;
  termino?: string;
  numAlumnosInscritos?: number;
  participantCount: number;
  totalByCategory: Metrics;
  zeroByCategory: Metrics;
}

export interface DashboardCache {
  updatedAt: string;
  inscripciones: DashboardInscripcion[];
}

interface ApiResponse<T> { success: boolean; data?: T; error?: { message: string } }

const BASE = `${config.apiBaseUrl}/dashboard/cache`;

export const dashboardApi = {
  async getCache(refresh?: boolean): Promise<DashboardCache> {
    const url = refresh ? `${BASE}?refresh=true` : BASE;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error fetching dashboard cache');
    const json: ApiResponse<DashboardCache> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error?.message || 'API error');
    return json.data;
  }
};

export default dashboardApi;
