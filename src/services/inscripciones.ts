import config from '../config/environment';

export interface Inscripcion {
  _id?: string;
  // Autogenerado por el API
  numeroInscripcion: number;

  // Nuevos obligatorios
  correlativo: number;
  codigoCurso: string;
  empresa: number; // Código de empresa

  // Opcionales/Existentes
  codigoSence?: string;
  ordenCompra?: string;
  idSence?: string;
  idMoodle: string; // obligatorio
  nombreCurso?: string;
  // Usamos string genérico porque ahora viene desde la configuración de "Modalidad"
  modalidad: number | string;
  inicio: string; // ISO string (obligatorio)
  termino?: string; // ISO string (opcional)
  ejecutivo: number | string;
  numAlumnosInscritos: number;
  valorInicial?: number;
  responsable?: string;
  valorFinal?: number;
  statusAlumnos: 'Pendiente' | 'En curso' | 'Finalizado';
  status?: 'abierta' | 'cerrada' | string;
  status_vimica?: 'abierta' | 'cerrada' | string;
  comentarios?: string;
  // Archivada: se conserva pero queda fuera de reportes, dashboard, cron y VMICA.
  archivada?: boolean;
  archivadaAt?: string | null;
}

export const isArchivada = (ins: Partial<Inscripcion> | null | undefined): boolean =>
  Boolean(ins && ins.archivada === true);

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
    // No enviar numeroInscripcion cuando se crea
    const body = { ...payload } as any;
    if (body.empresa !== undefined) body.empresa = Number(body.empresa);
    if (!body.numeroInscripcion) delete body.numeroInscripcion;
    const res = await fetch(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      try {
        const errJson = await res.json().catch(() => null as any);
        const msg = errJson?.error?.message || errJson?.message || `Error creating inscripción (${res.status})`;
        throw new Error(msg);
      } catch (e: any) {
        throw new Error(e?.message || 'Error creating inscripción');
      }
    }
    const json: ApiResponse<Inscripcion> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data!;
  },
  async update(id: string, payload: Partial<Inscripcion>): Promise<Inscripcion> {
    const body = { ...payload } as any;
    if (body.empresa !== undefined) body.empresa = Number(body.empresa);
    const res = await fetch(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
  /**
   * Recalcula las notas de UNA inscripción contra Moodle (grades-numeric),
   * por lotes para no superar el timeout de nginx. Funciona aunque la
   * inscripción esté cerrada: es el camino para recoger notas de alumnos que
   * terminan después de la fecha de término (el cron ya no las refresca).
   * No toca el status ni envía nada a VMICA.
   */
  async recalcularNotas(
    numeroInscripcion: number | string,
    onProgress?: (procesados: number, total: number) => void
  ): Promise<{ total: number }> {
    const CHUNK_SIZE = 25;
    let offset = 0;
    let hasMore = true;
    let total = 0;
    while (hasMore) {
      const url = `${config.apiBaseUrl}/participantes/${encodeURIComponent(String(numeroInscripcion))}/grades-numeric?offset=${offset}&limit=${CHUNK_SIZE}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Error recalculando notas (${res.status})`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Error recalculando notas');
      total = Number(json.total) || 0;
      onProgress?.(Math.min(offset + (Number(json.processed) || 0), total), total);
      hasMore = Boolean(json.hasMore);
      offset += CHUNK_SIZE;
    }
    return { total };
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
