import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/db';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (role: 'admin' | 'librarian') => void;
  users: User[];
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => db.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => db.getUsers());

  useEffect(() => {
    // Keep in sync with storage
    const current = db.getCurrentUser();
    setUser(current);
  }, []);

  const refreshUsers = () => {
    setUsers(db.getUsers());
  };

  const login = (email: string, password?: string) => {
    const list = db.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password ? password.trim() : '';

    // Direct check for development-only administrator demo account
    if (cleanEmail === 'admin' && (cleanPassword === 'admin123' || cleanPassword === 'admin')) {
      const adminUser = list.find((u) => u.email === 'admin') || list.find((u) => u.role === 'admin')!;
      db.setCurrentUser(adminUser);
      setUser(adminUser);
      return { success: true };
    }

    const found = list.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        (cleanEmail === 'admin' && u.role === 'admin')
    );

    if (!found) {
      return {
        success: false,
        error: "Identifiant introuvable. Compte administrateur démo : 'admin' avec mot de passe 'admin123'.",
      };
    }

    if (found.password && cleanPassword && found.password !== cleanPassword) {
      // Also accept admin123 for any admin role
      if (found.role === 'admin' && cleanPassword === 'admin123') {
        db.setCurrentUser(found);
        setUser(found);
        return { success: true };
      }
      return { success: false, error: 'Mot de passe incorrect.' };
    }

    db.setCurrentUser(found);
    setUser(found);
    return { success: true };
  };

  const logout = () => {
    db.setCurrentUser(null);
    setUser(null);
  };

  const switchUser = (role: 'admin' | 'librarian') => {
    const list = db.getUsers();
    const target = list.find((u) => u.role === role) || list[0];
    if (target) {
      db.setCurrentUser(target);
      setUser(target);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        switchUser,
        users,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
