import config from '../config/environment';

export interface Inscripcion {
  _id?: string;
  numeroInscripcion: string;
  codigoSence?: string;
  ordenCompra?: string;
  idSence?: string;
  idMoodle?: string;
  cliente: string;
  nombreCurso: string;
  modalidad: string;
  inicio: string; // ISO string
  termino: string; // ISO string
  ejecutivo: string;
  numAlumnosInscritos: number;
  valorInicial: number;
  valorFinal: number;
  statusAlumnos: string;
  comentarios?: string;
}

interface ApiResponse<T> { success: boolean; data?: T; error?: { message: string } }

const BASE = `${config.apiBaseUrl}/inscripciones`;

export const inscripcionesApi = {
  async list(): Promise<Inscripcion[]> {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error('Error fetching inscripciones');
    const json: ApiResponse<Inscripcion[]> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data || [];
  },
  async create(payload: Inscripcion): Promise<Inscripcion> {
    const res = await fetch(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Error creating inscripción');
    const json: ApiResponse<Inscripcion> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data!;
  },
  async update(id: string, payload: Partial<Inscripcion>): Promise<Inscripcion> {
    const res = await fetch(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Error updating inscripción');
    const json: ApiResponse<Inscripcion> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data!;
  },
  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting inscripción');
    const json: ApiResponse<void> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
  },
  async importFromExcel(path: string, sheetName?: string): Promise<{ insertedOrUpdated: number; total: number }> {
    const res = await fetch(`${BASE}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path, sheetName }) });
    if (!res.ok) throw new Error('Error importing excel');
    const json: ApiResponse<{ insertedOrUpdated: number; total: number }> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data!;
  }
};

export default inscripcionesApi;
