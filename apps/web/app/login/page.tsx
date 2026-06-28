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
    <main className="page">
      <form className="panel login-panel" onSubmit={submit}>
        <div>
          <p className="eyebrow">V0.1 staging demo access</p>
          <h1>Login</h1>
          <p className="muted">
            Use seeded demo staff accounts only. Do not use real clinic credentials, patient details, or secrets.
          </p>
        </div>

        <div className="demo-account-list" aria-label="Seeded demo roles">
          {["Owner", "Admin", "Doctor", "Nurse", "Receptionist", "Accountant"].map((role) => (
            <span key={role}>{role}</span>
          ))}
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
      </form>
    </main>
  );
}
