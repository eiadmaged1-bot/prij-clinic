"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { useSession } from "../session";

const demoEmail = "eyad";
const demoPassword = "eyad";

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState(demoEmail);
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
    } catch {
      setError("Invalid login ID or password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function useDemoLogin() {
    setEmail(demoEmail);
    setPassword(demoPassword);
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
          <div>
            <p className="eyebrow">Staff access</p>
            <h1>Sign in</h1>
            <p className="muted">Checking whether you already have an active session. Use Admin Demo Login if no active session is found.</p>
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
          <div>
            <p className="eyebrow">Current session</p>
            <h1>Already logged in as {session.user.displayName}</h1>
            <p className="muted">
              {session.user.loginId ?? session.user.email} - {session.user.roles.join(", ") || "Staff"}
            </p>
          </div>
          <div className="form-actions">
            <Link className="button" href="/dashboard">
              <ThreeDMedicalIcon name="dashboard" size="sm" />
              Go to Dashboard
            </Link>
            {session.isAdmin ? (
              <Link className="button secondary" href="/admin/accounts">
                <ThreeDMedicalIcon name="admin" size="sm" tone="violet" />
                Go to Accounts
              </Link>
            ) : null}
            <button className="button secondary" onClick={switchAccount} type="button">
              <ThreeDMedicalIcon name="settings" size="sm" tone="slate" />
              Log out and switch account
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page centered">
      <section className="login-shell">
        <div className="login-brand">
          <p className="eyebrow">Staff access</p>
          <h1>Prij Clinic</h1>
          <p className="muted">
            Local V0.1 demo workspace for clinic workflow QA. Do not use real clinic credentials or real patient data.
          </p>
          <div className="workflow-band">
            <span>Staff protected</span>
            <span>Audit logged</span>
            <span>AI disabled</span>
          </div>
        </div>

        <form className="login-panel" onSubmit={submit}>
          <div>
            <p className="eyebrow">Demo login</p>
            <h2>Sign in</h2>
            <p className="muted">Use local demo staff credentials only. External AI and payment services are not enabled.</p>
          </div>

          {session.message ? <p className="notice">{session.message}</p> : null}

          <div className="credential-card" aria-label="Demo owner credentials">
            <div>
              <span className="eyebrow">Local Admin Demo</span>
              <strong>{demoEmail}</strong>
              <span className="credential-value">{demoPassword}</span>
            </div>
            <button className="button secondary compact" onClick={useDemoLogin} type="button">
              Use Admin Demo Login
            </button>
          </div>

          <label>
            Admin ID or email
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

          <button className="button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in" : "Sign in"}
          </button>

          <p className="empty-state">Demo/local only - no real patient data, credentials, payment details, or report files.</p>
        </form>
      </section>
    </main>
  );
}
