import config from '../config/environment';

/**
 * White Label: el sitio se identifica por el dominio desde el que se abre.
 * Si el host coincide con el "Dominio del reporte" de una empresa White Label,
 * todo el frontend queda fijado a esa empresa: su logo, su Moodle, sus
 * catálogos y sus usuarios. Cualquier otro host (reportes.edutecno.com,
 * clicklaboral.cl, localhost) es la plataforma principal.
 *
 * El estado se resuelve una vez al arrancar (main.tsx) y es de sólo lectura.
 */
export interface WhiteLabelInfo {
  whiteLabel: boolean;
  empresa?: number;
  nombre?: string;
  dominio?: string;
  logoVersion?: string | null;
}

let current: WhiteLabelInfo = { whiteLabel: false };

export const getWhiteLabel = (): WhiteLabelInfo => current;
export const isWhiteLabelSite = (): boolean => current.whiteLabel === true;

/** Código de la empresa del sitio White Label (undefined en la plataforma principal). */
export const getWhiteLabelEmpresa = (): number | undefined =>
  current.whiteLabel && Number.isFinite(Number(current.empresa)) ? Number(current.empresa) : undefined;

/**
 * Host del sitio. En desarrollo se puede simular un White Label con
 * VITE_WL_HOST=reportes.cliente.cl en .env.local.
 */
export const getCurrentHost = (): string => {
  const override = config.isDevelopment ? import.meta.env.VITE_WL_HOST : undefined;
  return (override || window.location.hostname || '').trim().toLowerCase();
};

export const empresaLogoUrl = (code: number | string, version?: string | null): string =>
  `${config.apiBaseUrl}/empresas/${code}/logo${version ? `?v=${encodeURIComponent(version)}` : ''}`;

/** URL del logo del sitio White Label, o null en la plataforma principal. */
export const getWhiteLabelLogoUrl = (): string | null =>
  current.whiteLabel && current.empresa !== undefined ? empresaLogoUrl(current.empresa, current.logoVersion) : null;

/** Añade `empresa=<code>` a una URL si el sitio es White Label (catálogos propios). */
export const withWhiteLabelScope = (url: string): string => {
  const empresa = getWhiteLabelEmpresa();
  if (empresa === undefined) return url;
  return `${url}${url.includes('?') ? '&' : '?'}empresa=${empresa}`;
};

/** Campo `empresa` a añadir al crear registros de catálogo en un White Label. */
export const whiteLabelScopeBody = (): { empresa?: number } => {
  const empresa = getWhiteLabelEmpresa();
  return empresa === undefined ? {} : { empresa };
};

export async function loadWhiteLabel(): Promise<WhiteLabelInfo> {
  const host = getCurrentHost();
  try {
    const res = await fetch(`${config.apiBaseUrl}/empresas/whitelabel?host=${encodeURIComponent(host)}`);
    const json = await res.json();
    if (json?.success && json.data?.whiteLabel) {
      current = {
        whiteLabel: true,
        empresa: Number(json.data.empresa),
        nombre: json.data.nombre,
        dominio: json.data.dominio,
        logoVersion: json.data.logoVersion ?? null,
      };
    }
  } catch (e) {
    // Sin API se muestra la marca principal. El login igualmente envía el host,
    // así que el backend sigue aplicando las reglas del White Label.
    console.error('No se pudo resolver el White Label', e);
  }
  applyBranding();
  return current;
}

/** Título de la pestaña y favicon. */
function applyBranding(): void {
  if (!current.whiteLabel) return;
  if (current.nombre) document.title = `Reportes ${current.nombre}`;
  const logo = getWhiteLabelLogoUrl();
  if (logo) {
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.removeAttribute('type');
    link.href = logo;
    if (!link.parentNode) document.head.appendChild(link);
  }
}
