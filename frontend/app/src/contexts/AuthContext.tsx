// AyuAahar - Authentication context (JWT stored in localStorage)
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, LoginCredentials, RegisterData } from '@/types';
import api from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    return raw && localStorage.getItem('token') ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);

  useEffect(() => {
    if (!readStoredUser()) return;
    // Re-validate the stored token in the background; the API interceptor handles expiry
    api.getProfile().then(
      ({ user: fresh }) => {
        localStorage.setItem('user', JSON.stringify(fresh));
        setUser(fresh);
      },
      () => undefined,
    );
  }, []);

  const startSession = ({ user: u, token }: { user: User; token: string }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login: async (credentials) => startSession(await api.login(credentials)),
    register: async (data) => startSession(await api.register(data)),
    logout: () => {
      clearSession();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
