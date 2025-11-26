import config from '../config/environment';

export interface Empresa {
  _id?: string;
  code: number;
  nombre: string;
  holding?: string;
  rut?: string;
  nombre_responsable?: string;
  email_responsable?: string;
  telefono_1?: string;
  telefono_2?: string;
  email_empresa?: string;
  status: string;
}

interface ApiResponse<T> { success: boolean; data?: T; error?: { message: string } }

const BASE = `${config.apiBaseUrl}/empresas`;

export const empresasApi = {
  async list(): Promise<Empresa[]> {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error('Error fetching empresas');
    const json: ApiResponse<Empresa[]> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data || [];
  },
  async create(payload: Omit<Empresa, '_id' | 'code'>): Promise<Empresa> {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error creating empresa');
    const json: ApiResponse<Empresa> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data!;
  },
  async update(id: string, payload: Partial<Omit<Empresa, '_id' | 'code'>>): Promise<Empresa> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error updating empresa');
    const json: ApiResponse<Empresa> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
    return json.data!;
  },
  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting empresa');
    const json: ApiResponse<void> = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'API error');
  },
};

export default empresasApi;