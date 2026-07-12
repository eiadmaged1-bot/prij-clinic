"use server";

import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:3001";

export async function fetchDiagnostics() {
  try {
    const res = await fetch(`${API_URL}/health/live`, { cache: "no-store" });
    const data = await res.json();
    return { status: data.status || "down" };
  } catch (error) {
    return { status: "down", error: String(error) };
  }
}

// In a real app we'd fetch the AuditLogs via an internal service or a secure API endpoint.
// For now, this just proves the server action structure.
export async function fetchAuditLogs() {
  // Mock data, or we could query the DB directly if we had Prisma available here,
  // but Prisma is in apps/api. We'd normally have an endpoint in apps/api for this.
  // The prompt says "fetch and display basic API status ... and the latest 10 AuditLog entries."
  // Let's create an endpoint in apps/api for this, or just return dummy data for the UI if the endpoint isn't made yet.
  
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("prij_clinic_session")?.value;
    const res = await fetch(`${API_URL}/audit/recent`, {
      cache: "no-store",
      headers: {
        ...(sessionCookie ? { Cookie: `prij_clinic_session=${sessionCookie}` } : {})
      }
    });
    
    if (!res.ok) {
      return { logs: [], error: `Failed to fetch logs: ${res.status}` };
    }
    
    const data = await res.json();
    return { logs: data };
  } catch (error) {
    return { logs: [], error: String(error) };
  }
}
