export type Role = 'superAdmin' | 'user';

export interface AuthUser {
  username: string;
  role: Role;
  empresa?: number;
  /** Nombre del holding activo. Si está presente, la sesión está en "modo holding". */
  holding?: string;
}
