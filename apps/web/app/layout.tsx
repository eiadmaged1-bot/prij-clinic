import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./reception-shell.css";
import { SessionProvider } from "./session";
import { ThemeProvider } from "./theme";
import { OFFICIAL_APP_DESCRIPTION, OFFICIAL_CLINIC_NAME } from "@/lib/brand";
import { InterfaceModeProvider } from "@/lib/interface-mode";
import { I18nProvider } from "@/i18n/useI18n";

export const metadata: Metadata = {
  title: OFFICIAL_CLINIC_NAME,
  description: OFFICIAL_APP_DESCRIPTION
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <I18nProvider><ThemeProvider>
          <SessionProvider><InterfaceModeProvider>{children}</InterfaceModeProvider></SessionProvider>
        </ThemeProvider></I18nProvider>
      </body>
    </html>
  );
}
