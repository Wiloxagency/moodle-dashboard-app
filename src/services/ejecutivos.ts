import config from '../config/environment';

export interface Ejecutivo {
  _id?: string;
  code: number;
  nombres: string;
  apellidos: string;
  rut?: string;
  direccion?: string;
  telefono_1?: string;
  telefono_2?: string;
  email?: string;
  status: string;
}

interface ApiResponse<T> { success: boolean; data?: T; error?: { message: string } }

const BASE = `${config.apiBaseUrl}/ejecutivos`;

export const ejecutivosApi = {
  async list(): Promise<Ejecutivo[]> {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error('Error fetching ejecutivos');
    const json: ApiResponse<Ejecutivo[]> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data || [];
  },
  async create(payload: Omit<Ejecutivo, '_id' | 'code'>): Promise<Ejecutivo> {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error creating ejecutivo');
    const json: ApiResponse<Ejecutivo> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data!;
  },
  async update(id: string, payload: Partial<Omit<Ejecutivo, '_id' | 'code'>>): Promise<Ejecutivo> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error updating ejecutivo');
    const json: ApiResponse<Ejecutivo> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data!;
  },
  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting ejecutivo');
    const json: ApiResponse<void> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
  },
};

export default ejecutivosApi;