"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, SafetyAlert } from "../../mvp-page";
import { AppThemeId, getTheme, resolveThemeId, sanitizeThemeConfiguration, themes, useTheme, type ThemeConfiguration } from "../../theme";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { InterfaceModeSettings } from "@/components/settings/InterfaceModeSettings";
import { DensityModeSettings } from "@/components/settings/DensityModeSettings";

type AppearanceSettings = {
  defaultTheme: AppThemeId;
  allowUserThemeOverride: boolean;
  defaultDoctorComfortMode: boolean;
  appearanceConfig: Partial<ThemeConfiguration>;
  roleDefaults: Record<string, { themeId: AppThemeId; configuration: ThemeConfiguration }>;
};

const fallbackSettings: AppearanceSettings = {
  defaultTheme: "prij-heritage",
  allowUserThemeOverride: true,
  defaultDoctorComfortMode: false,
  appearanceConfig: {},
  roleDefaults: {}
};

export default function AppearancePage() {
  const { doctorComfortMode, setDoctorComfortMode, theme, setTheme, resetTheme, configuration, setConfiguration } = useTheme();
  const [settings, setSettings] = useState<AppearanceSettings>(fallbackSettings);
  const [selectedTheme, setSelectedTheme] = useState<AppThemeId>(theme);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [scope, setScope] = useState<"device" | "account" | "role" | "clinic">("device");
  const [roleScope, setRoleScope] = useState("Doctor");

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
      setError("Sign in with an Owner account to change appearance.");
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

    const data = (await response.json().catch(() => null)) as Partial<AppearanceSettings> | null;
    const defaultTheme = resolveThemeId(data?.defaultTheme) ?? fallbackSettings.defaultTheme;
    const defaultConfiguration = getTheme(defaultTheme).configuration;
    const next = {
      defaultTheme,
      allowUserThemeOverride: typeof data?.allowUserThemeOverride === "boolean" ? data.allowUserThemeOverride : true,
      defaultDoctorComfortMode: typeof data?.defaultDoctorComfortMode === "boolean" ? data.defaultDoctorComfortMode : false,
      appearanceConfig: sanitizeThemeConfiguration(data?.appearanceConfig, defaultConfiguration),
      roleDefaults: data?.roleDefaults && typeof data.roleDefaults === "object" && !Array.isArray(data.roleDefaults) ? data.roleDefaults : {}
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
      defaultDoctorComfortMode: settings.defaultDoctorComfortMode,
      appearanceConfig: configuration,
      roleDefaults: scope === "role" ? { ...settings.roleDefaults, [roleScope]: { themeId: selectedTheme, configuration } } : settings.roleDefaults
    };

    if (scope === "device") { setTheme(selectedTheme); setConfiguration(configuration); setIsSaving(false); setMessage("Appearance saved for this device."); return; }
    if (scope === "account") {
      const accountResponse = await fetch(`${getApiBaseUrl()}/users/me/preferences`, { method: "PATCH", credentials: "include", headers, body: JSON.stringify({ appearanceJson: { themeId: selectedTheme, ...configuration } }) }).catch(() => null);
      setIsSaving(false); if (!accountResponse?.ok) { setError("Could not save account appearance."); return; } setTheme(selectedTheme); setConfiguration(configuration); setMessage("Appearance saved to your account."); return;
    }

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
    setTheme(selectedTheme); setConfiguration(configuration);
    setDoctorComfortMode(next.defaultDoctorComfortMode);
    setMessage("Appearance settings saved and audited.");
  }

  function applyForThisBrowser(themeId: AppThemeId) {
    setSelectedTheme(themeId);
    setTheme(themeId);
    setConfiguration(getTheme(themeId).configuration);
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

  function prepareSharedReset() {
    const premium = getTheme("prij-heritage");
    setSelectedTheme(premium.id);
    setConfiguration(premium.configuration);
    setSettings((current) => ({ ...current, defaultTheme: premium.id, appearanceConfig: premium.configuration, roleDefaults: {} }));
    setMessage("Safe Dr Maged Premium defaults are ready. Save the selected scope to replace corrupted server settings.");
    setError("");
  }

  return (
    <AppShell>
      <section className="panel appearance-preferences" aria-labelledby="personal-appearance-title">
        <p className="eyebrow">Settings / Appearance</p>
        <h2 id="personal-appearance-title">Personal workspace</h2>
        <InterfaceModeSettings />
        <DensityModeSettings />
      </section>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Appearance Settings</h1>
          </div>
          <span className="badge warning">Protected setting</span>
        </div>
        <p className="muted">Choose the visual style for the clinic workspace. Changes to the default are protected and audited.</p>
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

      <section className="panel"><div className="section-heading"><div><h2>Appearance scope</h2><p className="muted">Theme settings are independent from patient panel layouts.</p></div></div><div className="inline-form"><label>Save for<select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)}><option value="device">This device</option><option value="account">My account</option><option value="role">Role default</option><option value="clinic">Clinic default</option></select></label>{scope === "role" ? <label>Role<select value={roleScope} onChange={(event) => setRoleScope(event.target.value)}>{["Doctor", "Receptionist", "Nurse", "Accountant", "Admin", "Owner"].map((role) => <option key={role}>{role}</option>)}</select></label> : null}</div></section>

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

      {error ? <section className="panel compact-panel" role="alert"><p className="form-error">{error}</p><div className="form-actions"><button className="button secondary compact" type="button" onClick={() => void loadSettings()}>Retry appearance settings</button><button className="button secondary compact" type="button" onClick={resetBrowserTheme}>Reset corrupted device state</button></div></section> : null}
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
              <button className="button compact" onClick={() => { setSelectedTheme(appTheme.id); setConfiguration(sanitizeThemeConfiguration(appTheme.configuration, getTheme(appTheme.id).configuration)); }} type="button">
                Select
              </button>
              <button className="button secondary compact" onClick={() => applyForThisBrowser(appTheme.id)} type="button">
                Use here
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="panel"><div className="section-heading"><h2>Theme details</h2><span className="badge">Live preview</span></div><div className="form-grid"><label>Accent<input type="color" value={configuration.accent} onChange={(event) => setConfiguration({ ...configuration, accent: event.target.value })} /></label><label>Sidebar<select value={configuration.sidebar} onChange={(event) => setConfiguration({ ...configuration, sidebar: event.target.value as ThemeConfiguration["sidebar"] })}><option value="light">Light</option><option value="dark">Dark</option><option value="accent">Accent</option></select></label><label>Font scale<input type="range" min="0.9" max="1.3" step="0.05" value={configuration.fontScale} onChange={(event) => setConfiguration({ ...configuration, fontScale: Number(event.target.value) })} /></label><label>Card radius<input type="range" min="0" max="24" value={configuration.cardRadius} onChange={(event) => setConfiguration({ ...configuration, cardRadius: Number(event.target.value) })} /></label><label>Density<select value={configuration.density} onChange={(event) => setConfiguration({ ...configuration, density: event.target.value as ThemeConfiguration["density"] })}><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></label><label className="toggle-row"><input type="checkbox" checked={configuration.reducedMotion} onChange={(event) => setConfiguration({ ...configuration, reducedMotion: event.target.checked })} /> Reduced motion</label><label className="toggle-row"><input type="checkbox" checked={configuration.contrast === "high"} onChange={(event) => setConfiguration({ ...configuration, contrast: event.target.checked ? "high" : "standard" })} /> High contrast</label></div><div className="appearance-context-previews"><article className="data-row"><strong>Reception</strong><span>Queue and patient search preview</span></article><article className="data-row"><strong>Doctor patient file</strong><span>Panels remain independently configured</span></article><article className="data-row"><strong>Investigations</strong><span>Ordering and review status retain their meaning</span></article><article className="data-row"><strong>Ultrasound</strong><span>Structured editor and report surfaces</span></article><article className="data-row"><strong>Knowledge Center</strong><span>PDF and protocol navigation</span></article><article className="data-row" dir="rtl"><strong>معاينة العربية</strong><span>اتجاه من اليمين إلى اليسار على الهاتف</span></article><article className="data-row"><strong>Owner · desktop / tablet / mobile</strong><span>Compact administration preview</span></article></div></section>

      <div className="form-actions"><button className="button secondary compact" type="button" onClick={prepareSharedReset}>Prepare safe shared reset</button></div>

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
            {isSaving ? "Saving" : "Save appearance"}
          </button>
          <button className="button secondary" onClick={resetBrowserTheme} type="button">
            Reset this browser
          </button>
        </div>
      </section>
    </AppShell>
  );
}
