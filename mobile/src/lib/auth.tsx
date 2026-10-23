import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, clearTokens, loadTokens, saveTokens } from "./api";
import type { AuthTokens, LoginRequest, RegisterRequest, User } from "../types/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await loadTokens();
      try {
        const me = await apiFetch<User>("/auth/me");
        setUser(me);
      } catch {
        await clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (req: LoginRequest) => {
    const tokens = await apiFetch<AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify(req),
    });
    await saveTokens(tokens.access_token, tokens.refresh_token);
    const me = await apiFetch<User>("/auth/me");
    setUser(me);
  };

  const register = async (req: RegisterRequest) => {
    const tokens = await apiFetch<AuthTokens>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(req),
    });
    await saveTokens(tokens.access_token, tokens.refresh_token);
    const me = await apiFetch<User>("/auth/me");
    setUser(me);
  };

  const logout = async () => {
    await clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
