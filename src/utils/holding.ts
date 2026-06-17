import type { AuthUser } from '../types/auth';
import type { Empresa } from '../services/empresas';

/**
 * Modos de sesión soportados:
 * - 'empresa': la sesión está acotada a una única empresa (user.empresa).
 * - 'holding': la sesión está acotada a todas las empresas de un holding (user.holding).
 * - 'multi':   superAdmin viendo todas las empresas.
 */
export type SessionMode = 'empresa' | 'holding' | 'multi';

/** Prefijo usado para distinguir opciones de holding en selects de empresa. */
export const HOLDING_OPTION_PREFIX = 'holding:';

const norm = (value?: string | null) => (value || '').trim().toLowerCase();

export const getSessionMode = (user: AuthUser | null | undefined): SessionMode => {
  if (user?.holding && String(user.holding).trim() !== '') return 'holding';
  const code = user?.empresa;
  if (code !== undefined && code !== null && Number.isFinite(Number(code))) return 'empresa';
  return 'multi';
};

/** Lista única (case-insensitive) de holdings válidos, ordenada alfabéticamente. */
export const getUniqueHoldings = (empresas: Array<Pick<Empresa, 'holding'>>): string[] =>
  Array.from(
    new Map(
      empresas
        .map((e) => (e.holding || '').trim())
        .filter(Boolean)
        .map((h) => [h.toLowerCase(), h] as const)
    ).values()
  ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

/** Códigos de las empresas que pertenecen al holding indicado (match case-insensitive). */
export const getHoldingEmpresaCodes = (
  empresas: Array<Pick<Empresa, 'code' | 'holding'>>,
  holding?: string | null
): number[] => {
  const target = norm(holding);
  if (!target) return [];
  return empresas
    .filter((e) => norm(e.holding) === target)
    .map((e) => Number(e.code))
    .filter((c) => Number.isFinite(c));
};
