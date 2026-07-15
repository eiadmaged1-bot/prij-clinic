export type SafeApiError = { code: string; message: string; requestId?: string };

export async function readSafeApiError(response: Response | null, fallback: string): Promise<SafeApiError> {
  if (!response) return { code: "SERVER_ERROR", message: fallback };
  const body = await response.json().catch(() => null) as { error?: { code?: string; message?: string; requestId?: string } } | null;
  const code = body?.error?.code ?? (response.status === 401 ? "SESSION_EXPIRED" : response.status === 403 ? "QUEUE_PERMISSION_DENIED" : "SERVER_ERROR");
  const message = body?.error?.message?.trim() || fallback;
  return { code, message, requestId: body?.error?.requestId };
}

export function formatSafeApiError(error: SafeApiError) {
  return error.requestId ? `${error.message} (Request ${error.requestId})` : error.message;
}
