"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiUnreachableMessage, sameOriginApiProxyPath } from "@/lib/api-base-url";

const tokenKey = "prijClinicToken";
const sessionMessageKey = "prijClinicSessionMessage";

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

    const response = await fetch(`${sameOriginApiProxyPath}/auth/me`, {
      credentials: "include",
      headers: storedToken ? { authorization: `Bearer ${storedToken}` } : undefined
    }).catch(() => null);

    if (!response || response.status === 401) {
      clearSession(response ? sessionEndedMessage() : undefined);
      return;
    }

    if (!response.ok) {
      setStatus("unauthenticated");
      setUser(null);
      return;
    }

    const data = (await response.json()) as { user?: SessionUser };
    if (!data.user) {
      clearSession(sessionEndedMessage());
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
    const response = await fetch(`${sameOriginApiProxyPath}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: input.identifier, password: input.password })
    }).catch(() => null);

    if (!response) {
      throw new Error(connectionProblemMessage());
    }

    if (response.status === 401) {
      throw new Error(invalidLoginMessage());
    }

    if (!response.ok) {
      throw new Error(connectionProblemMessage());
    }

    const data = (await response.json()) as { token?: string; user?: SessionUser };
    if (!data.token || !data.user) {
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
    await fetch(`${sameOriginApiProxyPath}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: storedToken ? { authorization: `Bearer ${storedToken}` } : undefined
    }).catch(() => undefined);
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
