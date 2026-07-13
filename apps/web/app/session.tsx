"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiUnreachableMessage, sameOriginApiProxyPath } from "@/lib/api-base-url";

const tokenKey = "prijClinicToken";
const sessionMessageKey = "prijClinicSessionMessage";
const returnUrlKey = "prijClinicReturnUrl";
const authRequestTimeoutMs = 8_000;
const authLoginPath = `${sameOriginApiProxyPath}/auth/login`;
const authMePath = `${sameOriginApiProxyPath}/auth/me`;
const authLogoutPath = `${sameOriginApiProxyPath}/auth/logout`;

function connectionProblemMessage() {
  return localStorage.getItem("prijClinicLanguage") === "ar"
    ? "ØªÙˆØ¬Ø¯ Ù…Ø´ÙƒÙ„Ø© ÙÙŠ Ø§Ù„Ø§ØªØµØ§Ù„. ØªØ£ÙƒØ¯ Ø£Ù† Ø³ÙŠØ±ÙØ± Ø§Ù„Ø¹ÙŠØ§Ø¯Ø© ÙŠØ¹Ù…Ù„ Ø«Ù… Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰."
    : apiUnreachableMessage;
}

function sessionEndedMessage() {
  return localStorage.getItem("prijClinicLanguage") === "ar"
    ? "Ø§Ù†ØªÙ‡Øª Ø§Ù„Ø¬Ù„Ø³Ø©. ÙŠØ±Ø¬Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰."
    : "Your session ended. Please sign in again.";
}

function invalidLoginMessage() {
  return localStorage.getItem("prijClinicLanguage") === "ar"
    ? "Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸Ù Ø£Ùˆ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± ØµØ­ÙŠØ­Ø©."
    : "Invalid staff ID/email or password.";
}

function authRequestFailed(response: Response) {
  return response.status >= 500;
}

async function parseErrorEnvelope(response: Response, defaultMessage: string): Promise<string> {
  try {
    const data = await response.clone().json();
    if (data?.error?.message) {
      return data.error.requestId ? `${data.error.message} (Ref: ${data.error.requestId})` : data.error.message;
    }
  } catch {
    // Ignore JSON parse errors for non-JSON responses
  }
  return defaultMessage;
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
  branchName: string | null;
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
  status: "loading" | "authenticated" | "unauthenticated";
  message: string;
  isAdmin: boolean;
  login(input: LoginInput): Promise<void>;
  logout(): Promise<void>;
  expire(returnUrl?: string): void;
  refresh(): Promise<void>;
  clearMessage(): void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<SessionContextValue["status"]>("loading");
  const [message, setMessage] = useState("");

  const clearSession = useCallback((nextMessage?: string) => {
    // Remove tokens left by pre-cookie releases; browser auth is cookie-only.
    localStorage.removeItem(tokenKey);
    sessionStorage.removeItem(tokenKey);
    // Also remove csrf token
    document.cookie = "csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    if (nextMessage) {
      sessionStorage.setItem(sessionMessageKey, nextMessage);
      setMessage(nextMessage);
    } else {
      sessionStorage.removeItem(sessionMessageKey);
      setMessage("");
    }
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const expire = useCallback((returnUrl?: string) => {
    if (returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//")) {
      sessionStorage.setItem(returnUrlKey, returnUrl);
    }
    clearSession(sessionEndedMessage());
  }, [clearSession]);

  const refresh = useCallback(async () => {
    localStorage.removeItem(tokenKey);
    sessionStorage.removeItem(tokenKey);

    const response = await fetchAuth(authMePath, {
      credentials: "include"
    });

    if (!response || authRequestFailed(response)) {
      setUser(null);
      setStatus("unauthenticated");
      const msg = response ? await parseErrorEnvelope(response, connectionProblemMessage()) : connectionProblemMessage();
      setMessage(msg);
      return;
    }

    if (response.status === 401) {
      clearSession();
      return;
    }

    if (!response.ok) {
      const msg = await parseErrorEnvelope(response, sessionEndedMessage());
      clearSession(msg);
      return;
    }

    const data = (await response.json().catch(() => null)) as { user?: SessionUser } | null;
    if (!data?.user) {
      setUser(null);
      setStatus("unauthenticated");
      setMessage(connectionProblemMessage());
      return;
    }

    setUser(data.user);
    setStatus("authenticated");
    sessionStorage.removeItem(sessionMessageKey);
    setMessage("");
  }, [clearSession]);

  useEffect(() => {
    setMessage(sessionStorage.getItem(sessionMessageKey) ?? "");
    void refresh();

    // Patch fetch to automatically append x-csrf-token for mutations
    if (typeof window !== "undefined") {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        let [resource, config] = args;

        let method = "GET";
        if (resource instanceof Request) {
          method = resource.method.toUpperCase();
        } else if (config && config.method) {
          method = config.method.toUpperCase();
        }

        if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
          const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
          if (match && match[1]) {
            const csrfToken = match[1];
            if (resource instanceof Request) {
              resource.headers.set("x-csrf-token", csrfToken);
            } else {
              config = config || {};
              config.headers = {
                ...config.headers,
                "x-csrf-token": csrfToken
              };
              args[1] = config;
            }
          }
        }
        return originalFetch(...args);
      };
    }
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
      const msg = await parseErrorEnvelope(response, invalidLoginMessage());
      throw new Error(msg);
    }

    if (authRequestFailed(response)) {
      const msg = await parseErrorEnvelope(response, connectionProblemMessage());
      throw new Error(msg);
    }

    if (!response.ok) {
      const msg = await parseErrorEnvelope(response, invalidLoginMessage());
      throw new Error(msg);
    }

    const data = (await response.json().catch(() => null)) as { user?: SessionUser } | null;
    if (!data?.user) {
      throw new Error(connectionProblemMessage());
    }

    localStorage.removeItem(tokenKey);
    sessionStorage.removeItem(tokenKey);
    sessionStorage.removeItem(sessionMessageKey);
    setMessage("");
    setUser(data.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await fetchAuth(authLogoutPath, {
      method: "POST",
      credentials: "include"
    });
    clearSession();
  }, [clearSession]);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
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
      expire,
      refresh,
      clearMessage() {
        sessionStorage.removeItem(sessionMessageKey);
        setMessage("");
      }
    }),
    [expire, login, logout, message, refresh, status, user]
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
