import config from '../config/environment';
import { getWhiteLabelEmpresa, isWhiteLabelSite } from '../whitelabel/whiteLabel';

export type MoodleMajorVersion = 4 | 5;

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
  // White Label
  whiteLabel?: boolean;
  wlDominio?: string;
  wlMoodleUrl?: string;
  wlMoodleVersion?: MoodleMajorVersion;
  /** El token nunca llega al navegador: sólo se sabe si está guardado. */
  wlMoodleTokenSet?: boolean;
  /** Versión del logo (para invalidar caché); null si no hay logo. */
  wlLogoVersion?: string | null;
}

/** Lo que se envía al guardar. Token y logo sólo si se cambian. */
export type EmpresaPayload = Partial<Omit<Empresa, '_id' | 'code' | 'wlMoodleTokenSet' | 'wlLogoVersion'>> & {
  wlMoodleToken?: string;
  /** data URL (data:image/png;base64,...) */
  wlLogo?: string;
};

export interface MoodleTestResult {
  ok: boolean;
  message: string;
  sitename?: string;
  release?: string;
  major?: number | null;
  supported?: boolean;
  missingFunctions?: string[];
}

interface ApiResponse<T> { success: boolean; data?: T; error?: { message: string } }

const BASE = `${config.apiBaseUrl}/empresas`;

/** Códigos de las empresas White Label, según el último listado cargado. */
let whiteLabelCodes = new Set<number>();
export const getWhiteLabelEmpresaCodes = (): Set<number> => whiteLabelCodes;

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  let json: ApiResponse<T> | null = null;
  try {
    json = await res.json();
  } catch {
    throw new Error(fallback);
  }
  if (!res.ok || !json?.success) throw new Error(json?.error?.message || fallback);
  return json.data as T;
}

export const empresasApi = {
  async list(): Promise<Empresa[]> {
    const items = (await readJson<Empresa[]>(await fetch(BASE), 'Error fetching empresas')) || [];
    whiteLabelCodes = new Set(items.filter(e => e.whiteLabel).map(e => Number(e.code)));
    return items;
  },
  /**
   * Empresas que se pueden operar desde este sitio. En la plataforma principal
   * se ocultan las White Label (se gestionan desde su propio dominio); en un
   * White Label sólo existe su propia empresa.
   */
  async listVisible(): Promise<Empresa[]> {
    const items = await empresasApi.list();
    if (isWhiteLabelSite()) return items.filter(e => Number(e.code) === getWhiteLabelEmpresa());
    return items.filter(e => !e.whiteLabel);
  },
  async create(payload: EmpresaPayload): Promise<Empresa> {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return readJson<Empresa>(res, 'Error creando la empresa');
  },
  async update(id: string, payload: EmpresaPayload): Promise<Empresa> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return readJson<Empresa>(res, 'Error actualizando la empresa');
  },
  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    await readJson<void>(res, 'Error eliminando la empresa');
  },
  /** Prueba URL + token (si no se envía token, usa el guardado de empresaId). */
  async testMoodle(params: { url: string; token?: string; empresaId?: string; version?: number }): Promise<MoodleTestResult> {
    const res = await fetch(`${BASE}/moodle/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return readJson<MoodleTestResult>(res, 'No se pudo probar la conexión');
  },
};

export default empresasApi;
