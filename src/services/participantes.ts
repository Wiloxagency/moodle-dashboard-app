import config from '../config/environment';

export interface Participante {
  _id?: string;
  numeroInscripcion: number;
  nombres: string;
  apellidos: string;
  rut: string;
  mail: string;
  telefono?: string;
  franquiciaPorcentaje?: number;
  costoOtic?: number;
  costoEmpresa?: number;
  estadoInscripcion?: string;
  observacion?: string;
}

interface ApiResponse<T> { success: boolean; data?: T; error?: { message: string } }

const BASE = `${config.apiBaseUrl}/participantes`;

export const participantesApi = {
  async listByInscripcion(numeroInscripcion: number): Promise<Participante[]> {
    const url = `${BASE}?numeroInscripcion=${encodeURIComponent(numeroInscripcion)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error fetching participantes');
    const json: ApiResponse<Participante[]> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data || [];
  },
  async counts(inscripciones?: number[]): Promise<Record<string, number>> {
    const url = inscripciones && inscripciones.length > 0 
      ? `${BASE}/counts?inscripciones=${encodeURIComponent(inscripciones.join(','))}`
      : `${BASE}/counts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error fetching counts');
    const json: ApiResponse<Record<string, number>> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data || {};
  },
  async create(participante: Omit<Participante, '_id'>): Promise<Participante> {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(participante)
    });
    if (!res.ok) throw new Error('Error creating participante');
    const json: ApiResponse<Participante> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    if (!json.data) throw new Error('No data returned');
    return json.data;
  },
  async update(id: string, participante: Partial<Participante>): Promise<Participante> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(participante)
    });
    if (!res.ok) throw new Error('Error updating participante');
    const json: ApiResponse<Participante> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    if (!json.data) throw new Error('No data returned');
    return json.data;
  },
  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error deleting participante');
    const json: ApiResponse<void> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
  }
 ,
  async importFromMoodle(numeroInscripcion: string): Promise<{ inserted: number; updated: number; skipped: number; total: number; message?: string }> {
    const res = await fetch(`${BASE}/import/moodle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeroInscripcion })
    });
    const json: ApiResponse<{ inserted: number; updated: number; skipped: number; total: number; message?: string }> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Error importando desde Moodle');
    }
    return json.data!;
  }

  ,
  async importBulk(numeroInscripcion: string, participantes: Array<Partial<Participante>>): Promise<{ inserted: number; updated: number; total: number }> {
    const res = await fetch(`${BASE}/import/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeroInscripcion, participantes })
    });
    const json: ApiResponse<{ inserted: number; updated: number; total: number }> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Error importando participantes');
    }
    return json.data!;
  }

};

export default participantesApi;
