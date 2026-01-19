import type { Role } from '../types/auth';

export interface StoredUser {
  id: string;
  username: string;
  role: Role;
  password: string; // NOTE: demo only; en producción debe ir hasheada en backend
}

const STORAGE_KEY = 'app_users_v1';

function loadUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredUser[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function ensureInitialSuperAdmin(): StoredUser[] {
  let users = loadUsers();
  const hasSuperAdmin = users.some(u => u.role === 'superAdmin');
  if (!hasSuperAdmin) {
    const defaultUser: StoredUser = {
      id: crypto.randomUUID(),
      username: 'superadmin',
      role: 'superAdmin',
      password: '123456',
    };
    users = [defaultUser];
    saveUsers(users);
  }
  return users;
}

export function listUsers(): StoredUser[] {
  return ensureInitialSuperAdmin();
}

export function findUserByCredentials(username: string, password: string): StoredUser | undefined {
  const users = ensureInitialSuperAdmin();
  const key = username.trim().toLowerCase();
  return users.find(u => u.username.trim().toLowerCase() === key && u.password === password);
}

export function createUser(username: string, role: Role, password: string): StoredUser {
  const users = ensureInitialSuperAdmin();
  const key = username.trim().toLowerCase();
  if (users.some(u => u.username.trim().toLowerCase() === key)) {
    throw new Error('El nombre de usuario ya existe');
  }
  const user: StoredUser = {
    id: crypto.randomUUID(),
    username: username.trim(),
    role,
    password,
  };
  const next = [...users, user];
  saveUsers(next);
  return user;
}

export function updateUser(id: string, data: Partial<Pick<StoredUser, 'username' | 'role'>>): StoredUser {
  const users = ensureInitialSuperAdmin();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    throw new Error('Usuario no encontrado');
  }

  // Evitar duplicados de username
  if (data.username) {
    const key = data.username.trim().toLowerCase();
    if (users.some(u => u.id !== id && u.username.trim().toLowerCase() === key)) {
      throw new Error('El nombre de usuario ya existe');
    }
  }

  const updated: StoredUser = {
    ...users[index],
    ...data,
    username: data.username ? data.username.trim() : users[index].username,
  };
  const next = [...users];
  next[index] = updated;
  saveUsers(next);
  return updated;
}

export function changePassword(id: string, newPassword: string): StoredUser {
  const users = ensureInitialSuperAdmin();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    throw new Error('Usuario no encontrado');
  }
  const updated: StoredUser = { ...users[index], password: newPassword };
  const next = [...users];
  next[index] = updated;
  saveUsers(next);
  return updated;
}

export function deleteUser(id: string): void {
  const users = ensureInitialSuperAdmin();
  const user = users.find(u => u.id === id);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  const superAdmins = users.filter(u => u.role === 'superAdmin');
  if (user.role === 'superAdmin' && superAdmins.length <= 1) {
    throw new Error('No se puede eliminar el último Superadmin');
  }
  const next = users.filter(u => u.id !== id);
  saveUsers(next);
}
