"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getApiBaseUrl } from "./api-base-url";

export type InterfaceMode = "OPTIMIZED" | "MINIMALISTIC";
export type DensityMode = "COMPACT" | "COMFORTABLE" | "LARGE";
export type MobileNavigationMode = "AUTO" | "BOTTOM_NAV" | "DRAWER";
export type InterfacePreferences = { interfaceMode: InterfaceMode; densityMode: DensityMode; mobileNavigationMode: MobileNavigationMode };

export const defaultInterfacePreferences: InterfacePreferences = { interfaceMode: "OPTIMIZED", densityMode: "COMFORTABLE", mobileNavigationMode: "AUTO" };
const cacheKey = "prij:display-preferences";
const InterfaceModeContext = createContext<(InterfacePreferences & { ready: boolean; updatePreferences: (patch: Partial<InterfacePreferences>) => Promise<void> }) | null>(null);

export function InterfaceModeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaultInterfacePreferences);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) ?? "null") as Partial<InterfacePreferences> | null;
      if (cached && validPreferences(cached)) setPreferences(cached as InterfacePreferences);
    } catch { /* Ignore corrupt non-sensitive display cache. */ }
    const controller = new AbortController();
    fetch(`${getApiBaseUrl()}/users/me/preferences`, { credentials: "include", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<InterfacePreferences> : defaultInterfacePreferences)
      .then((server) => { if (validPreferences(server)) { setPreferences(server); localStorage.setItem(cacheKey, JSON.stringify(server)); } })
      .finally(() => setReady(true));
    return () => controller.abort();
  }, []);

  async function updatePreferences(patch: Partial<InterfacePreferences>) {
    const response = await fetch(`${getApiBaseUrl()}/users/me/preferences`, { method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
    if (!response.ok) throw new Error("Could not save appearance preferences.");
    const server = await response.json() as InterfacePreferences;
    setPreferences(server);
    localStorage.setItem(cacheKey, JSON.stringify(server));
  }

  const value = useMemo(() => ({ ...preferences, ready, updatePreferences }), [preferences, ready]);
  return createElement(InterfaceModeContext.Provider, { value }, children);
}

export function useInterfaceMode() {
  const value = useContext(InterfaceModeContext);
  if (!value) throw new Error("InterfaceModeProvider is required.");
  return value;
}

function validPreferences(value: Partial<InterfacePreferences>) {
  return ["OPTIMIZED", "MINIMALISTIC"].includes(String(value.interfaceMode)) && ["COMPACT", "COMFORTABLE", "LARGE"].includes(String(value.densityMode)) && ["AUTO", "BOTTOM_NAV", "DRAWER"].includes(String(value.mobileNavigationMode));
}
