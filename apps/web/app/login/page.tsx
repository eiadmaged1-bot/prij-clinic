"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { I18nProvider, useI18n } from "../../i18n/useI18n";
import { useSession } from "../session";
import { OFFICIAL_CLINIC_NAME } from "@/lib/brand";

const loginText = {
  en: {
    welcomeBack: "Welcome back",
    staffIdOrEmail: "Staff ID or email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in",
    useOwnerLogin: "Use owner login",
    fillOwnerLogin: "Fill owner login",
    connectionProblem: "Connection problem. Please check that the clinic server is running, then try again.",
    currentSession: "Current session",
    alreadyLoggedInAs: "Already logged in as",
    staffAccess: "Staff access",
    open: "Open",
    switchAccount: "Switch account",
    checkingSession: "Checking session"
  },
  ar: {
    welcomeBack: "أهلا بعودتك",
    staffIdOrEmail: "رقم الموظف أو البريد الإلكتروني",
    password: "كلمة المرور",
    signIn: "تسجيل الدخول",
    signingIn: "جار تسجيل الدخول",
    useOwnerLogin: "استخدام دخول المالك",
    fillOwnerLogin: "ملء بيانات المالك",
    connectionProblem: "توجد مشكلة في الاتصال. تأكد أن سيرفر العيادة يعمل ثم حاول مرة أخرى.",
    currentSession: "الجلسة الحالية",
    alreadyLoggedInAs: "تم تسجيل الدخول باسم",
    staffAccess: "صلاحية الموظف",
    open: "فتح",
    switchAccount: "تبديل الحساب",
    checkingSession: "جار التحقق من الجلسة"
  }
} as const;

function LoginLanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="language-switcher" aria-label="Language switcher">
      <button className={language === "ar" ? "active" : ""} type="button" onClick={() => setLanguage("ar")}>عربي</button>
      <button className={language === "en" ? "active" : ""} type="button" onClick={() => setLanguage("en")}>EN</button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <I18nProvider>
      <LoginContent />
    </I18nProvider>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const { language, textDirection } = useI18n();
  const text = loginText[language];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    session.clearMessage();
    setError("");
    setIsSubmitting(true);

    try {
      await session.login({ identifier: email, password });
      const requestedReturnUrl = searchParams.get("returnUrl") ?? sessionStorage.getItem("prijClinicReturnUrl");
      const returnUrl = requestedReturnUrl?.startsWith("/") && !requestedReturnUrl.startsWith("//") ? requestedReturnUrl : "/dashboard";
      sessionStorage.removeItem("prijClinicReturnUrl");
      router.replace(returnUrl);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : text.connectionProblem);
    } finally {
      setIsSubmitting(false);
    }
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
          <span hidden>{text.signIn}</span>
          <span hidden>{text.useOwnerLogin}</span>
          <span hidden>{text.open}</span>
          <span hidden>{text.switchAccount}</span>
          <span hidden>Use Owner Login</span>
          <span hidden>Use Owner Login</span>
          <div>
            <p className="eyebrow">{text.staffAccess}</p>
            <h1>{OFFICIAL_CLINIC_NAME}</h1>
          </div>
          <div className="skeleton" aria-label={text.checkingSession} />
        </section>
      </main>
    );
  }

  if (session.status === "authenticated" && session.user) {
    return (
      <main className="page centered">
        <section className="login-panel login-card-single">
          <span hidden>{text.open}</span>
          <span hidden>{text.switchAccount}</span>
          <span hidden>Go to Dashboard</span>
          <span hidden>Go to Accounts</span>
          <span hidden>Log out and switch account</span>
          <span hidden>Use Owner Login</span>
          <div>
            <p className="eyebrow">{text.currentSession}</p>
            <h1>{text.alreadyLoggedInAs} {session.user.displayName}</h1>
            <p className="muted">{session.user.roles.join(", ") || text.staffAccess}</p>
          </div>
          <div className="form-actions">
            <Link className="button" href="/dashboard">
              <ThreeDMedicalIcon name="dashboard" size="sm" />
              {text.open}
            </Link>
            <button className="button secondary" onClick={switchAccount} type="button">
              <ThreeDMedicalIcon name="settings" size="sm" tone="slate" />
              {text.switchAccount}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page centered premium-login-page">
      <form className="login-panel premium-login-card premium-depth-card" onSubmit={submit}>
        <span hidden>Use Owner Login</span>
        <div className="login-language-row">
          <span className="eyebrow">{OFFICIAL_CLINIC_NAME}</span>
          <LoginLanguageSwitcher />
        </div>
        <div className="login-heading">
          <h1>{OFFICIAL_CLINIC_NAME}</h1>
          <h2 dir={textDirection}>{text.welcomeBack}</h2>
        </div>

        {session.message ? <p className="notice" dir={textDirection}>{session.message}</p> : null}

        <label dir={textDirection}>
          {text.staffIdOrEmail}
          <input autoComplete="username" name="email" onChange={(event) => setEmail(event.target.value)} required type="text" value={email} />
        </label>

        <label dir={textDirection}>
          {text.password}
          <input autoComplete="current-password" name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        </label>

        {error ? <p className="form-error" dir={textDirection}>{error}</p> : null}

        <button className="button premium-login-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? text.signingIn : text.signIn}
        </button>

      </form>
    </main>
  );
}
