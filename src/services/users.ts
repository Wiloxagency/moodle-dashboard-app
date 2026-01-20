import type { Role } from '../types/auth';
import config from '../config/environment';
import type { ApiResponse } from '../types/api';

export interface StoredUser {
  id: string;
  username: string;
  role: Role;
}

interface ApiUser {
  _id: string;
  username: string;
  role: Role;
}

const BASE_URL = config.apiBaseUrl;

function mapUser(apiUser: ApiUser): StoredUser {
  return {
    id: apiUser._id,
    username: apiUser.username,
    role: apiUser.role,
  };
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...options,
  });

  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch (e) {
    throw new Error(`Error de red o de formato de respuesta (${response.status})`);
  }

  if (!payload.success) {
    const msg = payload.error?.message || `Error HTTP ${response.status}`;
    throw new Error(msg);
  }

  return payload.data as T;
}

export async function listUsers(): Promise<StoredUser[]> {
  const users = await request<ApiUser[]>('/users', { method: 'GET' });
  return users.map(mapUser);
}

export async function loginUser(username: string, password: string): Promise<StoredUser | null> {
  try {
    const user = await request<ApiUser>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return mapUser(user);
  } catch (e) {
    if (e instanceof Error && e.message === 'Credenciales inválidas') {
      return null;
    }
    throw e;
  }
}

export async function createUser(username: string, role: Role, password: string): Promise<StoredUser> {
  const user = await request<ApiUser>('/users', {
    method: 'POST',
    body: JSON.stringify({ username, role, password }),
  });
  return mapUser(user);
}

export async function updateUser(
  id: string,
  data: Partial<Pick<StoredUser, 'username' | 'role'>>,
): Promise<StoredUser> {
  const user = await request<ApiUser>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return mapUser(user);
}

export async function changePassword(id: string, newPassword: string): Promise<void> {
  await request<StoredUser | null>(`/users/${id}/password`, {
    method: 'POST',
    body: JSON.stringify({ password: newPassword }),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await request<null>(`/users/${id}`, {
    method: 'DELETE',
  });
}
