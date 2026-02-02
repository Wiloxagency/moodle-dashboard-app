import React, { createContext, useContext, useMemo, useState } from 'react';
import type { AuthUser } from '../types/auth';
import { loginUser } from '../services/users';

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const COOKIE_NAME = 'moodle_dashboard_user';
const COOKIE_DAYS = 7;

const readUserFromCookie = (): AuthUser | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const raw = match.slice(COOKIE_NAME.length + 1);
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!parsed || typeof parsed.username !== 'string' || typeof parsed.role !== 'string') {
      return null;
    }
    return parsed as AuthUser;
  } catch {
    return null;
  }
};

const writeUserCookie = (user: AuthUser | null) => {
  if (typeof document === 'undefined') return;
  if (!user) {
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    return;
  }
  const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000).toUTCString();
  const value = encodeURIComponent(JSON.stringify(user));
  document.cookie = `${COOKIE_NAME}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => readUserFromCookie());

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const storedUser = await loginUser(username, password);
      if (!storedUser) {
        return false;
      }
      const nextUser: AuthUser = {
        username: storedUser.username,
        role: storedUser.role,
        empresa: storedUser.empresa,
      };
      setUser(nextUser);
      writeUserCookie(nextUser);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    writeUserCookie(null);
  };

  const value = useMemo(
    () => ({ user, login, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
