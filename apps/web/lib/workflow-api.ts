const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function workflowAuthHeaders() {
  const token = typeof window === "undefined" ? null : sessionStorage.getItem("prijClinicToken");
  return {
    "content-type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {})
  };
}

export async function workflowRequest<T>(path: string, options: RequestInit = {}, fallback = "Could not complete this workflow action."): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    credentials: "include",
    ...options,
    headers: { ...workflowAuthHeaders(), ...(options.headers ?? {}) }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    const message = response.status === 401 || response.status === 403 ? "Your role cannot open or change this workflow item." : body?.message || fallback;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
