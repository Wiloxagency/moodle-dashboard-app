import config from '../config/environment';

export interface Sence {
  _id?: string;
  code: number;
  codigo_sence?: string;
  nombre_sence?: string;
  horas_teoricas?: number;
  horas_practicas?: number;
  horas_elearning?: number;
  horas_totales?: number;
  numero_participantes?: number;
  termino_vigencia?: string;
  area?: string;
  especialidad?: string;
  modalidad_instruccion?: string;
  modo?: string;
  valor_efectivo_participante?: number;
  valor_maximo_imputable?: number;
  numero_solicitud?: string;
  fecha_resolucion?: string;
  numero_resolucion?: string;
  valor_hora_imputable?: number;
  exclusivo_cliente?: boolean;
  dirigido_por_relator?: boolean;
  incluye_tablet?: boolean;
  otec?: string;
  id_sence?: string;
  id_moodle?: string;
}

interface ApiResponse<T> { success: boolean; data?: T; error?: { message: string } }

const BASE = `${config.apiBaseUrl}/sence`;

export const senceApi = {
  async list(): Promise<Sence[]> {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error('Error fetching Sence records');
    const json: ApiResponse<Sence[]> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data || [];
  },

  async importBulk(cursos: Array<Partial<Sence>>): Promise<{ inserted: number; updated: number; total: number }> {
    const res = await fetch(`${BASE}/import/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cursos }),
    });
    const json: ApiResponse<{ inserted: number; updated: number; total: number }> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Error importando Sence');
    }
    return json.data!;
  },
};

export default senceApi;
