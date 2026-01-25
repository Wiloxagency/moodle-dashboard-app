import config from '../config/environment';

export interface Modalidad {
  _id?: string;
  code: number;
  nombre?: string;
  sincronico?: boolean;
  asincronico?: boolean;
  sincronico_online?: boolean;
  sincronico_presencial_moodle?: boolean;
  sincronico_presencial_no_moodle?: boolean;
}

interface ApiResponse<T> { success: boolean; data?: T; error?: { message: string } }

const BASE = `${config.apiBaseUrl}/modalidades`;

export const modalidadesApi = {
  async list(): Promise<Modalidad[]> {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error('Error fetching modalidades');
    const json: ApiResponse<Modalidad[]> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data || [];
  },
  async create(payload: Omit<Modalidad, '_id' | 'code'>): Promise<Modalidad> {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error creating modalidad');
    const json: ApiResponse<Modalidad> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data!;
  },
  async update(id: string, payload: Partial<Omit<Modalidad, '_id' | 'code'>>): Promise<Modalidad> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error updating modalidad');
    const json: ApiResponse<Modalidad> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data!;
  },
  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting modalidad');
    const json: ApiResponse<void> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
  },
};

export default modalidadesApi;