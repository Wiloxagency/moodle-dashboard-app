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

export interface VimicaPayload {
  Usuario: string;
  Token: string;
  AvanceCursos: Array<{
    IdCurso: string;
    RutAlumno: string;
    PorcentajeAvance: string;
    PorcentajeAsistenciaAlumno: string;
    NotaTeorica: string;
    EstadoTeorica: string;
    NotaPractica: string;
    EstadoPractica: string;
    NotaFinal: string;
    EstadoCurso: string;
    Observacion: string;
  }>;
}

export interface VimicaResponse {
  Id: number;
  Fecha: string;
  CantidadRegistros: number;
  RegistrosCargados: number;
  RegistrosRechazados: number;
  RegistrosLeidos: number;
}

export interface VimicaHistorialRow {
  _id?: string;
  Id?: number | string;
  Fecha?: string;
  CantidadRegistros?: number;
  RegistrosCargados?: number;
  RegistrosRechazados?: number;
  RegistrosRechazado?: number;
  RegistrosLeidos?: number;
  datosEnviados?: VimicaPayload | Record<string, any>;
}

interface ApiResponse<T> { success: boolean; data?: T; error?: { message: string }; generatedAt?: string }

const AVANCES_URL = `${config.apiBaseUrl}/reportes/avances`;
const VIMICA_URL = `${config.apiBaseUrl}/reportes/vimica`;
const VIMICA_SEND_URL = `${config.apiBaseUrl}/reportes/vimica/enviar`;
const VIMICA_HIST_URL = `${config.apiBaseUrl}/reportes/vimica/historial`;
const VIMICA_CLOSE_URL = `${config.apiBaseUrl}/reportes/vimica/cerrar-procesadas`;

export const reportesApi = {
  async listAvances(): Promise<{ data: ReporteAvanceRow[]; generatedAt?: string }> {
    const res = await fetch(AVANCES_URL);
    if (!res.ok) throw new Error('Error fetching reporte de avances');
    const json: ApiResponse<ReporteAvanceRow[]> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return { data: json.data || [], generatedAt: json.generatedAt };
  },
  async getVimica(): Promise<VimicaPayload> {
    const res = await fetch(VIMICA_URL);
    if (!res.ok) throw new Error('Error fetching reporte Vimica');
    return res.json();
  },
  async listVimicaHistorial(): Promise<VimicaHistorialRow[]> {
    const res = await fetch(VIMICA_HIST_URL);
    if (!res.ok) throw new Error('Error fetching historial Vimica');
    const json: ApiResponse<VimicaHistorialRow[]> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data || [];
  },

  async sendVimica(payload?: VimicaPayload): Promise<VimicaResponse> {
    const res = await fetch(VIMICA_SEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch (_) {
      json = null;
    }

    if (!res.ok) {
      const msg = json?.error?.message || `Error enviando reporte Vimica (${res.status})`;
      const details = json?.error?.details;
      const detailText = details ? `: ${typeof details === 'string' ? details : JSON.stringify(details)}` : '';
      throw new Error(msg + detailText);
    }

    if (json?.success === false) throw new Error(json.error?.message || 'API error');
    return (json?.data ?? json) as VimicaResponse;
  },

  async closeVimicaProcesadas(): Promise<{ matched: number; modified: number }> {
    const res = await fetch(VIMICA_CLOSE_URL, { method: 'POST' });
    let json: any = null;
    try {
      json = await res.json();
    } catch (_) {
      json = null;
    }
    if (!res.ok) {
      const msg = json?.error?.message || `Error cerrando inscripciones (${res.status})`;
      throw new Error(msg);
    }
    if (json?.success === false) throw new Error(json.error?.message || 'API error');
    const data = json?.data || {};
    return { matched: data.matched ?? 0, modified: data.modified ?? 0 };
  }
};

export default reportesApi;
