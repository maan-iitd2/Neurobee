"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getCurrentUser,
  login as authLogin,
  logout as authLogout,
  signup as authSignup,
  computeChildAge,
  StoredUser,
  SignupData,
} from "@/lib/auth";
import { AuthScreen } from "@/components/AuthScreen";

export interface AuthUser {
  id: string;
  email: string;
  parentName: string;
  childName: string;
  childDob: string;
  childAge: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(u: StoredUser): AuthUser {
  return {
    id: u.id,
    email: u.email,
    parentName: u.parentName,
    childName: u.childName,
    childDob: u.childDob,
    childAge: computeChildAge(u.childDob),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate on mount
  useEffect(() => {
    const stored = getCurrentUser();
    setUser(stored ? toAuthUser(stored) : null);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authLogin(email, password);
    if (result.success) {
      const stored = getCurrentUser();
      setUser(stored ? toAuthUser(stored) : null);
    }
    return result;
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const result = await authSignup(data);
    if (result.success) {
      const stored = getCurrentUser();
      setUser(stored ? toAuthUser(stored) : null);
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  // While checking localStorage, render nothing to avoid flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span
          className="material-symbols-outlined text-primary text-5xl animate-spin"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          hive
        </span>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
      {user ? children : <AuthScreen />}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
