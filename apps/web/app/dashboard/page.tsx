"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type SafeUser = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  branchId: string | null;
  roles: string[];
  permissions: string[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");

    fetch(`${apiUrl}/auth/me`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Authentication is required.");
        }

        return (await response.json()) as { user: SafeUser };
      })
      .then((data) => setUser(data.user))
      .catch(() => setError("Please sign in to continue."));
  }, []);

  async function logout() {
    const token = sessionStorage.getItem("prijClinicToken");

    await fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    });

    sessionStorage.removeItem("prijClinicToken");
    router.push("/login");
  }

  if (error) {
    return (
      <main className="page">
        <section className="panel">
          <p className="form-error">{error}</p>
          <a className="button" href="/login">
            Login
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">Prij Clinic</p>
          <h1>Prij Clinic Dashboard</h1>
        </div>
        <button className="button secondary" onClick={logout} type="button">
          Logout
        </button>
      </header>

      <section className="panel">
        <h2>Logged-in user</h2>
        {user ? (
          <dl className="profile-grid">
            <div>
              <dt>Name</dt>
              <dd>{user.displayName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{user.status}</dd>
            </div>
            <div>
              <dt>Roles</dt>
              <dd>{user.roles.join(", ") || "None"}</dd>
            </div>
            <div className="wide">
              <dt>Permissions</dt>
              <dd>{user.permissions.join(", ") || "None"}</dd>
            </div>
          </dl>
        ) : (
          <p>Loading</p>
        )}
      </section>
    </main>
  );
}
