export type Role = 'superAdmin' | 'user';

export interface AuthUser {
  username: string;
  role: Role;
  empresa?: number;
}
