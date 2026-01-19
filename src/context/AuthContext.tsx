import React, { createContext, useContext, useState, useMemo } from 'react';
import type { AuthUser } from '../types/auth';
import { findUserByCredentials } from '../services/users';

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    const storedUser = findUserByCredentials(username, password);
    if (!storedUser) {
      return false;
    }
    setUser({ username: storedUser.username, role: storedUser.role });
    return true;
  };

  const logout = () => {
    setUser(null);
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
