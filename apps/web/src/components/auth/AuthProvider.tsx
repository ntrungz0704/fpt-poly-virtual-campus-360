"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AuthUserProfileDto, LoginRequest } from "@fpt-campus/shared";
import {
  authApi,
  clearClientSessionState,
  getInMemoryAccessToken,
  hasSessionHintCookie,
  registerSessionLifecycleHandlers,
} from "@/lib/auth/api-client";
import { isProtectedAppPath } from "@/lib/auth/auth-routing";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUserProfileDto | null;
  hasVerifiedWithBackend: boolean;
  login: (payload: LoginRequest) => Promise<AuthUserProfileDto>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUserProfileDto | null>;
  ensureSessionChecked: () => Promise<AuthUserProfileDto | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUserProfileDto | null>(null);
  const [hasVerifiedWithBackend, setHasVerifiedWithBackend] = useState(false);
  const checkPromiseRef = useRef<Promise<AuthUserProfileDto | null> | null>(null);

  const applyAuthenticatedUser = useCallback((nextUser: AuthUserProfileDto) => {
    setUser(nextUser);
    setStatus("authenticated");
    setHasVerifiedWithBackend(true);
  }, []);

  const applyUnauthenticated = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
    setHasVerifiedWithBackend(true);
  }, []);

  useEffect(() => {
    return registerSessionLifecycleHandlers({
      onSessionUpdated: (updatedUser) => {
        applyAuthenticatedUser(updatedUser);
      },
      onSessionInvalidated: () => {
        applyUnauthenticated();
      },
      onPasswordChangeRequired: () => {
        setUser((prev) => (prev ? { ...prev, mustChangePassword: true } : prev));
      },
    });
  }, [applyAuthenticatedUser, applyUnauthenticated]);

  const ensureSessionChecked = useCallback(async (): Promise<AuthUserProfileDto | null> => {
    if (checkPromiseRef.current) {
      return checkPromiseRef.current;
    }

    const task = (async () => {
      try {
        if (getInMemoryAccessToken()) {
          const me = await authApi.getMe();
          applyAuthenticatedUser(me);
          return me;
        }
        const refreshed = await authApi.refresh();
        applyAuthenticatedUser(refreshed.user);
        return refreshed.user;
      } catch {
        clearClientSessionState();
        applyUnauthenticated();
        return null;
      }
    })();

    checkPromiseRef.current = task.finally(() => {
      checkPromiseRef.current = null;
    });

    return checkPromiseRef.current;
  }, [applyAuthenticatedUser, applyUnauthenticated]);

  useEffect(() => {
    let active = true;
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : "";

    async function bootstrapSession() {
      await Promise.resolve();
      if (!active) return;

      if (isProtectedAppPath(pathname) || hasSessionHintCookie()) {
        await ensureSessionChecked();
        return;
      }

      setUser(null);
      setStatus("unauthenticated");
      setHasVerifiedWithBackend(false);
    }

    void bootstrapSession();
    return () => {
      active = false;
    };
  }, [ensureSessionChecked]);

  const login = useCallback(
    async (payload: LoginRequest): Promise<AuthUserProfileDto> => {
      const response = await authApi.login(payload);
      applyAuthenticatedUser(response.user);
      return response.user;
    },
    [applyAuthenticatedUser],
  );

  const logout = useCallback(async (): Promise<void> => {
    await authApi.logout();
    applyUnauthenticated();
  }, [applyUnauthenticated]);

  const refreshUser = useCallback(async (): Promise<AuthUserProfileDto | null> => {
    try {
      const me = await authApi.getMe();
      applyAuthenticatedUser(me);
      return me;
    } catch {
      clearClientSessionState();
      applyUnauthenticated();
      return null;
    }
  }, [applyAuthenticatedUser, applyUnauthenticated]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      hasVerifiedWithBackend,
      login,
      logout,
      refreshUser,
      ensureSessionChecked,
    }),
    [
      status,
      user,
      hasVerifiedWithBackend,
      login,
      logout,
      refreshUser,
      ensureSessionChecked,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
