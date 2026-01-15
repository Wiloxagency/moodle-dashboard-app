import config from '../config/environment';

export interface Inscripcion {
  _id?: string;
  // Autogenerado por el API
  numeroInscripcion: string;

  // Nuevos obligatorios
  correlativo: number;
  codigoCurso: string;
  empresa: string; // Valor fijo: "Mutual"

  // Opcionales/Existentes
  codigoSence?: string;
  ordenCompra?: string;
  idSence?: string;
  idMoodle: string; // obligatorio
  nombreCurso?: string;
  modalidad: 'e-learning' | 'sincrónico';
  inicio: string; // ISO string (obligatorio)
  termino?: string; // ISO string (opcional)
  ejecutivo: string;
  numAlumnosInscritos: number;
  valorInicial?: number;
  valorFinal?: number;
  statusAlumnos: 'Pendiente' | 'En curso' | 'Finalizado';
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
  async create(payload: Partial<Inscripcion>): Promise<Inscripcion> {
    // Asegurar empresa por defecto y no enviar numeroInscripcion cuando se crea
    const body = { ...payload, empresa: 'Mutual' } as any;
    if (!body.numeroInscripcion) delete body.numeroInscripcion;
    const res = await fetch(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
