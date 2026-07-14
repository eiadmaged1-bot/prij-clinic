"use client";

import { useEffect, useMemo, useState } from "react";
import { classifyRuntimeError, type RuntimeErrorKind } from "@/lib/runtime-error";

type BoundaryError = Error & { code?: string; digest?: string; status?: number; statusCode?: number };
type Language = "en" | "ar";

const copy: Record<Language, Record<RuntimeErrorKind, { title: string; message: string; action: string; href?: string }>> = {
  en: {
    auth_expired: { title: "Your session has expired", message: "Sign in again to reopen this workspace. No clinical record was changed.", action: "Sign in", href: "/login" },
    permission_denied: { title: "This workspace is not available for your role", message: "Return to your role home or ask an administrator to review your assigned permissions.", action: "Return to role home", href: "/dashboard" },
    api_unavailable: { title: "The clinic service is temporarily unavailable", message: "Keep this page open and try again. No clinical record was changed by this failed load.", action: "Try again" },
    unsupported_capability: { title: "This browser cannot securely complete that action", message: "Use an updated browser or the secure HTTPS clinic address. Manual lookup remains available where supported.", action: "Return to role home", href: "/dashboard" },
    initialization_failure: { title: "The workspace could not initialize", message: "Refresh the workspace. If this continues, give support the internal code shown below.", action: "Try again" },
    unexpected_runtime_failure: { title: "We could not open this workspace", message: "Your clinical records were not changed. Try again or return to your role home.", action: "Try again" }
  },
  ar: {
    auth_expired: { title: "انتهت جلسة الدخول", message: "سجّل الدخول مرة أخرى لفتح مساحة العمل. لم يتم تغيير أي سجل سريري.", action: "تسجيل الدخول", href: "/login" },
    permission_denied: { title: "مساحة العمل غير متاحة لصلاحياتك", message: "ارجع إلى الصفحة الرئيسية لدورك أو اطلب من المسؤول مراجعة الصلاحيات الممنوحة.", action: "العودة إلى الرئيسية", href: "/dashboard" },
    api_unavailable: { title: "خدمة العيادة غير متاحة مؤقتًا", message: "اترك الصفحة مفتوحة وحاول مرة أخرى. لم يغيّر فشل التحميل أي سجل سريري.", action: "إعادة المحاولة" },
    unsupported_capability: { title: "المتصفح لا يدعم إتمام هذا الإجراء بأمان", message: "استخدم متصفحًا حديثًا أو رابط العيادة الآمن عبر HTTPS. يظل البحث اليدوي متاحًا حيثما كان مدعومًا.", action: "العودة إلى الرئيسية", href: "/dashboard" },
    initialization_failure: { title: "تعذر تهيئة مساحة العمل", message: "أعد المحاولة. إذا استمرت المشكلة فأرسل إلى الدعم الرمز الداخلي الظاهر أدناه.", action: "إعادة المحاولة" },
    unexpected_runtime_failure: { title: "تعذر فتح مساحة العمل", message: "لم يتم تغيير سجلاتك السريرية. أعد المحاولة أو ارجع إلى الصفحة الرئيسية لدورك.", action: "إعادة المحاولة" }
  }
};

export default function RuntimeErrorView({ error, reset }: { error: BoundaryError; reset(): void }) {
  const [language, setLanguage] = useState<Language>("en");
  const classification = useMemo(() => classifyRuntimeError(error), [error]);
  const content = copy[language][classification.kind];

  useEffect(() => {
    setLanguage(localStorage.getItem("prijClinicLanguage") === "ar" ? "ar" : "en");
  }, []);

  useEffect(() => {
    const digest = classification.safeDigest ? ` digest=${classification.safeDigest}` : "";
    console.error(`[${classification.internalCode}] Clinic workspace failure${digest}`);
  }, [classification]);

  return (
    <main className="page centered" dir={language === "ar" ? "rtl" : "ltr"} lang={language} role="alert">
      <section className="panel compact-panel friendly-error-boundary">
        <p className="eyebrow">{language === "ar" ? "مساحة عمل العيادة" : "Clinic workspace"}</p>
        <h1>{content.title}</h1>
        <p className="muted">{content.message}</p>
        <p className="runtime-error-code">{language === "ar" ? "الرمز الداخلي" : "Internal code"}: {classification.internalCode}</p>
        <div className="form-actions">
          {content.href ? <a className="button" href={content.href}>{content.action}</a> : <button className="button" type="button" onClick={reset}>{content.action}</button>}
          {!content.href ? <a className="button secondary" href="/dashboard">{language === "ar" ? "العودة إلى الرئيسية" : "Return to role home"}</a> : null}
        </div>
      </section>
    </main>
  );
}
