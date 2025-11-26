import config from '../config/environment';

export interface Sence {
  _id?: string;
  code: number;
  codigo_sence?: string;
  id_sence?: string;
  id_moodle?: string;
}

interface ApiResponse<T> { success: boolean; data?: T; error?: { message: string } }

const BASE = `${config.apiBaseUrl}/sence`;

export const senceApi = {
  async list(): Promise<Sence[]> {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error('Error fetching sence');
    const json: ApiResponse<Sence[]> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data || [];
  },
  async create(payload: Omit<Sence, '_id' | 'code'>): Promise<Sence> {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error creating sence');
    const json: ApiResponse<Sence> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data!;
  },
  async update(id: string, payload: Partial<Omit<Sence, '_id' | 'code'>>): Promise<Sence> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error updating sence');
    const json: ApiResponse<Sence> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data!;
  },
  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting sence');
    const json: ApiResponse<void> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
  },
};

export default senceApi;