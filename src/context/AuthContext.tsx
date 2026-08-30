'use client';

import { createContext, ReactNode, useEffect, useState } from 'react';

import { login as loginRequest, signup as signupRequest, logout as logoutRequest, getCurrentUser } from '@/lib/api/auth';
import { LoginRequestData,  RegisterRequestData, AuthUser } from '@/lib/interfaces';

interface AuthContextActions {
  login: (data: LoginRequestData) => Promise<void>;
  signup: (data: RegisterRequestData) => Promise<void>;
  logout: () => Promise<void>;
}

type AuthContextValue = AuthContextActions & (
  | {
  isAuthenticated: true;
  user: AuthUser;
  isInitializing: boolean;
}
  | {
  isAuthenticated: false;
  user: null;
  isInitializing: boolean;
}
  );

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    async function initializeAuth(): Promise<void> {
      try {
        const response = await getCurrentUser();

        setUser(response.data);
      } catch {
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    }

    void initializeAuth();
  }, []);

  async function login(data: LoginRequestData): Promise<void> {
    const response = await loginRequest(data);

    setUser(response.data);
  }

  async function signup(data: RegisterRequestData): Promise<void> {
    const response = await signupRequest(data);

    setUser(response.data);
  }

  async function logout(): Promise<void> {
    await logoutRequest();

    setUser(null);
  }

  const authState: AuthContextValue = user
    ? {
      user,
      isAuthenticated: true,
      isInitializing,
      login,
      signup,
      logout,
    }
    : {
      user: null,
      isAuthenticated: false,
      isInitializing,
      login,
      signup,
      logout,
    };

  return (
    <AuthContext.Provider value={authState} >
      {children}
    </AuthContext.Provider>
  );
}