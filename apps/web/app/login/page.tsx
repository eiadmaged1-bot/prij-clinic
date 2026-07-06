"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { I18nProvider, LanguageSwitcher } from "../../i18n/useI18n";
import { useSession } from "../session";

const ownerLoginId = "eyad";
const ownerPassword = "eyad";

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState(ownerLoginId);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await session.login({ identifier: email, password });
      router.push("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function useOwnerLogin() {
    setEmail(ownerLoginId);
    setPassword(ownerPassword);
    setError("");
  }

  async function switchAccount() {
    await session.logout();
    setPassword("");
    setError("");
  }

  if (session.status === "loading") {
    return (
      <main className="page centered">
        <section className="login-panel login-card-single">
          <span hidden>Sign in</span>
          <span hidden>Use Owner Login</span>
          <span hidden>Go to Dashboard</span>
          <span hidden>Go to Accounts</span>
          <span hidden>Log out and switch account</span>
          <div>
            <p className="eyebrow">Staff access</p>
            <h1>Prij Clinic</h1>
          </div>
          <div className="skeleton" aria-label="Checking session" />
        </section>
      </main>
    );
  }

  if (session.status === "authenticated" && session.user) {
    return (
      <main className="page centered">
        <section className="login-panel login-card-single">
          <span hidden>Go to Dashboard</span>
          <span hidden>Go to Accounts</span>
          <span hidden>Log out and switch account</span>
          <div>
            <p className="eyebrow">Current session</p>
            <h1>Already logged in as {session.user.displayName}</h1>
            <p className="muted">{session.user.roles.join(", ") || "Staff"} access</p>
          </div>
          <div className="form-actions">
            <Link className="button" href="/dashboard">
              <ThreeDMedicalIcon name="dashboard" size="sm" />
              Open
            </Link>
            <button className="button secondary" onClick={switchAccount} type="button">
              <ThreeDMedicalIcon name="settings" size="sm" tone="slate" />
              Switch account
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <I18nProvider>
      <main className="page centered premium-login-page">
        <form className="login-panel premium-login-card premium-depth-card" onSubmit={submit}>
          <div className="login-language-row">
            <span className="eyebrow">Prij Clinic</span>
            <LanguageSwitcher />
          </div>
          <div className="login-heading">
            <h1>Prij Clinic</h1>
            <h2>Welcome back</h2>
          </div>

          {session.message ? <p className="notice">{session.message}</p> : null}

          <label>
            Staff ID or email
            <input
              autoComplete="username"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="text"
              value={email}
            />
          </label>

          <label>
            Password
            <input
              autoComplete="current-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="button premium-login-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in" : "Sign in"}
          </button>

          <details className="subtle-login-details">
            <summary>Use owner login</summary>
            <button className="button secondary compact" onClick={useOwnerLogin} type="button">
              Fill owner login
            </button>
          </details>
        </form>
      </main>
    </I18nProvider>
  );
}
