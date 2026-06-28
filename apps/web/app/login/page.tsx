"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo.owner@prij.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error("Invalid email or password.");
      }

      const data = (await response.json()) as { token?: string };

      if (data.token) {
        sessionStorage.setItem("prijClinicToken", data.token);
      }

      router.push("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
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
            <span>RBAC protected</span>
            <span>Audit-aware</span>
            <span>AI disabled</span>
          </div>
        </div>

        <form className="login-panel" onSubmit={submit}>
          <div>
            <p className="eyebrow">Demo login</p>
            <h2>Sign in</h2>
            <p className="muted">Use seeded demo staff credentials only. External AI and payment services are not enabled.</p>
          </div>

          <label>
            Email
            <input
              autoComplete="username"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
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
