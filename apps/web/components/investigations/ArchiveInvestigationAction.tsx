"use client";

import { FormEvent, useState } from "react";
import { useI18n } from "@/i18n/useI18n";
import { getApiBaseUrl } from "@/lib/api-base-url";

type ArchiveableInvestigation = {
  id: string;
  name: string;
  category: string;
  active: boolean;
};

export function ArchiveInvestigationAction({
  item,
  onComplete
}: {
  item: ArchiveableInvestigation;
  onComplete(message: string): void | Promise<void>;
}) {
  const { language } = useI18n();
  const ar = language === "ar";
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function archive(event: FormEvent) {
    event.preventDefault();
    if (confirmation !== item.name || reason.trim().length < 4 || busy) return;
    setBusy(true);
    setError("");
    const response = await apiRequest(
      `/investigations/catalog-management/${item.id}/archive`,
      "POST",
      { confirmation, reason: reason.trim() }
    );
    setBusy(false);
    if (!response.ok) {
      setError(await responseError(response));
      return;
    }
    setOpen(false);
    setReason("");
    setConfirmation("");
    await onComplete(ar
      ? "تمت أرشفة الفحص مع الاحتفاظ بطلبات ونتائج المرضى السابقة."
      : "Investigation archived. Existing patient orders and results were preserved.");
  }

  async function restore() {
    if (busy) return;
    setBusy(true);
    setError("");
    const response = await apiRequest(
      `/investigations/catalog-management/${item.id}/restore`,
      "POST",
      {}
    );
    setBusy(false);
    if (!response.ok) {
      setError(await responseError(response));
      return;
    }
    await onComplete(ar ? "تمت استعادة الفحص." : "Investigation restored.");
  }

  if (!item.active) {
    return (
      <>
        <button className="button secondary compact" disabled={busy} type="button" onClick={() => void restore()}>
          {ar ? "استعادة" : "Restore"}
        </button>
        {error ? <small className="form-error">{error}</small> : null}
      </>
    );
  }

  return (
    <>
      <button className="button secondary compact" type="button" onClick={() => setOpen(true)}>
        {ar ? "أرشفة" : "Archive"}
      </button>
      {open ? (
        <div className="admin-editor-backdrop" role="presentation" onMouseDown={(event) => { if (!busy && event.target === event.currentTarget) setOpen(false); }}>
          <section className="admin-editor-drawer" role="dialog" aria-modal="true" aria-labelledby={`archive-investigation-${item.id}`}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">{item.category}</p>
                <h2 id={`archive-investigation-${item.id}`}>{ar ? "أرشفة" : "Archive"}: {item.name}</h2>
              </div>
              <button className="button secondary compact" disabled={busy} type="button" onClick={() => setOpen(false)}>
                {ar ? "إغلاق" : "Close"}
              </button>
            </div>
            <p className="notice">
              {ar
                ? "الأرشفة ليست حذفاً. ستخفي الفحص من شاشات الطلب وتزيله من المفضلة والقوائم القابلة لإعادة الاستخدام، مع بقاء الطلبات والنتائج السابقة دون تغيير."
                : "Archiving is not deletion. It hides the investigation from ordering views and removes it from favorites and reusable lists. Existing orders and results remain unchanged."}
            </p>
            <form className="form-grid" onSubmit={archive}>
              <label className="wide">
                {ar ? "سبب الأرشفة" : "Reason for archiving"}
                <textarea required minLength={4} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
              </label>
              <label className="wide">
                {ar ? "اكتب اسم الفحص مطابقاً تماماً للتأكيد" : "Type the exact investigation name to confirm"}
                <input required autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={item.name} />
                <small>{ar ? "هذه الخطوة تمنع الأرشفة بالخطأ." : "This extra step prevents accidental archiving."}</small>
              </label>
              {error ? <p className="form-error wide">{error}</p> : null}
              <div className="form-actions wide">
                <button className="button" disabled={busy || confirmation !== item.name || reason.trim().length < 4} type="submit">
                  {busy ? "…" : ar ? "تأكيد الأرشفة" : "Archive investigation"}
                </button>
                <button className="button secondary" disabled={busy} type="button" onClick={() => setOpen(false)}>
                  {ar ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

async function apiRequest(endpoint: string, method: string, payload: Record<string, unknown>) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${endpoint}`, {
    method,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  }).catch(() => new Response(null, { status: 503 }));
}

async function responseError(response: Response) {
  const body = await response.json().catch(() => ({})) as { message?: string | string[] };
  return Array.isArray(body.message)
    ? body.message[0] ?? "Catalogue action failed."
    : body.message ?? "Catalogue action failed.";
}
