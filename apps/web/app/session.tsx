"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiUnreachableMessage, sameOriginApiProxyPath } from "@/lib/api-base-url";

const tokenKey = "prijClinicToken";
const sessionMessageKey = "prijClinicSessionMessage";
const authRequestTimeoutMs = 8_000;
const authLoginPath = `${sameOriginApiProxyPath}/auth/login`;
const authMePath = `${sameOriginApiProxyPath}/auth/me`;
const authLogoutPath = `${sameOriginApiProxyPath}/auth/logout`;

function connectionProblemMessage() {
  return localStorage.getItem("prijClinicLanguage") === "ar"
    ? "توجد مشكلة في الاتصال. تأكد أن سيرفر العيادة يعمل ثم حاول مرة أخرى."
    : apiUnreachableMessage;
}

function sessionEndedMessage() {
  return localStorage.getItem("prijClinicLanguage") === "ar"
    ? "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى."
    : "Your session ended. Please sign in again.";
}

function invalidLoginMessage() {
  return localStorage.getItem("prijClinicLanguage") === "ar" ? "بيانات الدخول غير صحيحة." : "Invalid login ID or password.";
}

function sessionStartMessage() {
  return localStorage.getItem("prijClinicLanguage") === "ar" ? "تعذر بدء الجلسة." : "Could not start your session.";
}

function authRequestFailed(response: Response) {
  return response.status >= 500;
}

async function fetchAuth(url: typeof authLoginPath | typeof authMePath | typeof authLogoutPath, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), authRequestTimeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

export type SessionUser = {
  id: string;
  email: string;
  loginId: string | null;
  displayName: string;
  status: string;
  branchId: string | null;
  roles: string[];
  permissions: string[];
  permissionPreset: string;
  protectedAccount: boolean;
  isSystemOwner: boolean;
};

type LoginInput = {
  identifier: string;
  password: string;
};

type SessionContextValue = {
  user: SessionUser | null;
  token: string | null;
  status: "loading" | "authenticated" | "unauthenticated";
  message: string;
  isAdmin: boolean;
  login(input: LoginInput): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  clearMessage(): void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionContextValue["status"]>("loading");
  const [message, setMessage] = useState("");

  const clearSession = useCallback((nextMessage?: string) => {
    localStorage.removeItem(tokenKey);
    sessionStorage.removeItem(tokenKey);
    if (nextMessage) {
      sessionStorage.setItem(sessionMessageKey, nextMessage);
      setMessage(nextMessage);
    } else {
      sessionStorage.removeItem(sessionMessageKey);
      setMessage("");
    }
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refresh = useCallback(async () => {
    const storedToken = localStorage.getItem(tokenKey) ?? sessionStorage.getItem(tokenKey);
    setToken(storedToken);
    if (storedToken) {
      sessionStorage.setItem(tokenKey, storedToken);
    }

    const response = await fetchAuth(authMePath, {
      credentials: "include",
      headers: storedToken ? { authorization: `Bearer ${storedToken}` } : undefined
    });

    if (!response || authRequestFailed(response)) {
      setToken(null);
      setUser(null);
      setStatus("unauthenticated");
      setMessage(connectionProblemMessage());
      return;
    }

    if (response.status === 401) {
      clearSession(storedToken ? sessionEndedMessage() : undefined);
      return;
    }

    if (!response.ok) {
      clearSession(storedToken ? sessionEndedMessage() : undefined);
      return;
    }

    const data = (await response.json().catch(() => null)) as { user?: SessionUser } | null;
    if (!data?.user) {
      setToken(null);
      setUser(null);
      setStatus("unauthenticated");
      setMessage(connectionProblemMessage());
      return;
    }

    setUser(data.user);
    setStatus("authenticated");
  }, [clearSession]);

  useEffect(() => {
    setMessage(sessionStorage.getItem(sessionMessageKey) ?? "");
    void refresh();
  }, [refresh]);

  const login = useCallback(async (input: LoginInput) => {
    const response = await fetchAuth(authLoginPath, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: input.identifier, password: input.password })
    });

    if (!response) {
      throw new Error(connectionProblemMessage());
    }

    if (response.status === 401) {
      throw new Error(invalidLoginMessage());
    }

    if (authRequestFailed(response)) {
      throw new Error(connectionProblemMessage());
    }

    if (!response.ok) {
      throw new Error(invalidLoginMessage());
    }

    const data = (await response.json().catch(() => null)) as { token?: string; user?: SessionUser } | null;
    if (!data?.token || !data.user) {
      throw new Error(sessionStartMessage());
    }

    localStorage.setItem(tokenKey, data.token);
    sessionStorage.setItem(tokenKey, data.token);
    sessionStorage.removeItem(sessionMessageKey);
    setMessage("");
    setToken(data.token);
    setUser(data.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    const storedToken = token ?? localStorage.getItem(tokenKey) ?? sessionStorage.getItem(tokenKey);
    await fetchAuth(authLogoutPath, {
      method: "POST",
      credentials: "include",
      headers: storedToken ? { authorization: `Bearer ${storedToken}` } : undefined
    });
    clearSession();
  }, [clearSession, token]);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      token,
      status,
      message,
      isAdmin: Boolean(
        user?.roles.includes("Owner") ||
          user?.roles.includes("Admin") ||
          user?.permissions.includes("clinic_settings.manage") ||
          user?.permissions.includes("user.manage")
      ),
      login,
      logout,
      refresh,
      clearMessage() {
        sessionStorage.removeItem(sessionMessageKey);
        setMessage("");
      }
    }),
    [login, logout, message, refresh, status, token, user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("SessionProvider is required.");
  }
  return context;
}
