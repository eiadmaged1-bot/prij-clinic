import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./investigation-embedded.css";
import { SessionProvider } from "./session";
import { ThemeProvider } from "./theme";
import { OFFICIAL_APP_DESCRIPTION, OFFICIAL_CLINIC_NAME } from "@/lib/brand";
import { InterfaceModeProvider } from "@/lib/interface-mode";
import { I18nProvider } from "@/i18n/useI18n";

export const metadata: Metadata = { title: OFFICIAL_CLINIC_NAME, description: OFFICIAL_APP_DESCRIPTION };

const languageBootScript = `try{var l=localStorage.getItem("prijClinicLanguage")==="ar"?"ar":"en";document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";document.documentElement.classList.toggle("rtl-layout",l==="ar")}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: languageBootScript }} /></head>
      <body suppressHydrationWarning>
        <I18nProvider><ThemeProvider>
          <SessionProvider><InterfaceModeProvider>{children}</InterfaceModeProvider></SessionProvider>
        </ThemeProvider></I18nProvider>
      </body>
    </html>
  );
}
