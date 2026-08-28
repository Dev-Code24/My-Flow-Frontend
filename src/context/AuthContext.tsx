'use client';

import { createContext, ReactNode, useEffect, useState } from 'react';

import { login as loginRequest, signup as signupRequest, logout as logoutRequest, getCurrentUser } from '@/lib/api/auth';
import { LoginRequestData,  RegisterRequestData, AuthUser } from '@/lib/interfaces';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (data: LoginRequestData) => Promise<void>;
  signup: (data: RegisterRequestData) => Promise<void>;
  logout: () => Promise<void>;
}

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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isInitializing,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}