/**
 * - superAdmin: administra todo (nunca pertenece a un White Label).
 * - admin:      administrador de una empresa White Label, acotado a ella.
 * - user:       consulta los reportes de su empresa.
 */
export type Role = 'superAdmin' | 'admin' | 'user';

export const ROLE_LABELS: Record<Role, string> = {
  superAdmin: 'Superadmin',
  admin: 'Administrador',
  user: 'User',
};

/** Puede usar las páginas de administración (inscripciones, usuarios, catálogos…). */
export const isAdminRole = (role?: string | null): boolean => role === 'superAdmin' || role === 'admin';

export interface AuthUser {
  username: string;
  role: Role;
  empresa?: number;
  /** Nombre del holding activo. Si está presente, la sesión está en "modo holding". */
  holding?: string;
}
