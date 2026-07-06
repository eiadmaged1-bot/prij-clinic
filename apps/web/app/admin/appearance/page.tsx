"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, SafetyAlert } from "../../mvp-page";
import { AppThemeId, isThemeId, themes, useTheme } from "../../theme";

import { getApiBaseUrl } from "@/lib/api-base-url";

type AppearanceSettings = {
  defaultTheme: AppThemeId;
  allowUserThemeOverride: boolean;
  defaultDoctorComfortMode: boolean;
};

const fallbackSettings: AppearanceSettings = {
  defaultTheme: "clinic-premium",
  allowUserThemeOverride: true,
  defaultDoctorComfortMode: false
};

export default function AppearancePage() {
  const { doctorComfortMode, setDoctorComfortMode, theme, setTheme, resetTheme } = useTheme();
  const [settings, setSettings] = useState<AppearanceSettings>(fallbackSettings);
  const [selectedTheme, setSelectedTheme] = useState<AppThemeId>(theme);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const token = useMemo(() => (typeof window === "undefined" ? null : sessionStorage.getItem("prijClinicToken")), []);
  const headers = useMemo(
    () => ({
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    }),
    [token]
  );

  useEffect(() => {
    void loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSettings() {
    setError("");
    const response = await fetch(`${getApiBaseUrl()}/admin/settings/appearance`, {
      credentials: "include",
      headers
    }).catch(() => null);

    if (!response) {
      setError("Appearance settings are unavailable.");
      return;
    }
    if (response.status === 401) {
      setError("Sign in with the local admin demo account to change appearance.");
      return;
    }
    if (response.status === 403) {
      setError("Admin access is required.");
      return;
    }
    if (!response.ok) {
      setError("Could not load appearance settings.");
      return;
    }

    const data = (await response.json()) as Partial<AppearanceSettings>;
    const defaultTheme = isThemeId(data.defaultTheme) ? data.defaultTheme : fallbackSettings.defaultTheme;
    const next = {
      defaultTheme,
      allowUserThemeOverride: typeof data.allowUserThemeOverride === "boolean" ? data.allowUserThemeOverride : true,
      defaultDoctorComfortMode: typeof data.defaultDoctorComfortMode === "boolean" ? data.defaultDoctorComfortMode : false
    };
    setSettings(next);
    setSelectedTheme(defaultTheme);
  }

  async function saveDefault() {
    setIsSaving(true);
    setError("");
    setMessage("");

    const next = {
      defaultTheme: selectedTheme,
      allowUserThemeOverride: settings.allowUserThemeOverride,
      defaultDoctorComfortMode: settings.defaultDoctorComfortMode
    };

    const response = await fetch(`${getApiBaseUrl()}/admin/settings/appearance`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify(next)
    }).catch(() => null);

    setIsSaving(false);

    if (!response) {
      setError("Could not save appearance settings.");
      return;
    }
    if (response.status === 403) {
      setError("Admin access is required.");
      return;
    }
    if (!response.ok) {
      setError("Could not save appearance settings.");
      return;
    }

    setSettings(next);
    setTheme(selectedTheme);
    setDoctorComfortMode(next.defaultDoctorComfortMode);
    setMessage("Appearance settings saved and audited.");
  }

  function applyForThisBrowser(themeId: AppThemeId) {
    setSelectedTheme(themeId);
    setTheme(themeId);
    setMessage("Theme applied to this browser.");
    setError("");
  }

  function resetBrowserTheme() {
    resetTheme();
    setDoctorComfortMode(settings.defaultDoctorComfortMode);
    setSelectedTheme(settings.defaultTheme);
    setMessage("This browser will use the default theme again.");
    setError("");
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Appearance Settings</h1>
          </div>
          <span className="badge warning">Protected setting</span>
        </div>
        <p className="muted">Choose the visual style for the demo workspace. Changes to the default are protected and audited.</p>
      </section>

      <SafetyAlert />

      <section className="panel appearance-density-note">
        <div className="section-heading">
          <div>
            <h2>Density controls</h2>
            <p className="muted">Comfort is the balanced default. Large increases text, controls, sidebar items, cards, and rows for tablet or RDP use. Compact tightens spacing, chips, buttons, cards, and rows while keeping text readable.</p>
          </div>
          <span className="badge accent">Saved per browser</span>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Doctor Comfort Mode</h2>
            <p className="muted">Larger doctor-facing controls, calmer colors, simplified patient tabs, and fewer advanced tools. Saved locally for this browser; owners can also set the shared default below.</p>
          </div>
          <span className="badge accent">{doctorComfortMode ? "On here" : "Off here"}</span>
        </div>
        <div className="form-actions">
          <button className={`button secondary ${doctorComfortMode ? "active" : ""}`} onClick={() => setDoctorComfortMode(!doctorComfortMode)} type="button">
            {doctorComfortMode ? "Turn off here" : "Turn on here"}
          </button>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="success-message">{message}</p> : null}

      <section className="theme-preview-grid" aria-label="Theme choices">
        {themes.map((appTheme) => (
          <article className={`theme-preview theme-preview-${appTheme.id} ${selectedTheme === appTheme.id ? "selected" : ""}`} key={appTheme.id}>
            <div className="theme-preview-window">
              <span />
              <span />
              <span />
            </div>
            <div>
              <p className="eyebrow">{appTheme.tone}</p>
              <h2>{appTheme.name}</h2>
              <p className="muted">{appTheme.description}</p>
            </div>
            <div className="form-actions">
              <button className="button compact" onClick={() => setSelectedTheme(appTheme.id)} type="button">
                Select
              </button>
              <button className="button secondary compact" onClick={() => applyForThisBrowser(appTheme.id)} type="button">
                Use here
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Default appearance</h2>
            <p className="muted">Saved changes affect the shared appearance setting and write an audit entry.</p>
          </div>
          <span className="badge accent">{themes.find((appTheme) => appTheme.id === settings.defaultTheme)?.name ?? "Original Premium"}</span>
        </div>
        <label className="toggle-row">
          <input
            checked={settings.allowUserThemeOverride}
            onChange={(event) => setSettings((current) => ({ ...current, allowUserThemeOverride: event.target.checked }))}
            type="checkbox"
          />
          Allow each browser to use its own theme
        </label>
        <label className="toggle-row">
          <input
            checked={settings.defaultDoctorComfortMode}
            onChange={(event) => setSettings((current) => ({ ...current, defaultDoctorComfortMode: event.target.checked }))}
            type="checkbox"
          />
          Make Doctor Comfort Mode the shared default
        </label>
        <div className="form-actions">
          <button className="button" disabled={isSaving} onClick={saveDefault} type="button">
            {isSaving ? "Saving" : "Set as default"}
          </button>
          <button className="button secondary" onClick={resetBrowserTheme} type="button">
            Reset this browser
          </button>
        </div>
      </section>
    </AppShell>
  );
}
