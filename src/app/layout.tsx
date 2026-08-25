import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/context/RoleContext";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "T3 Vira",
  description: "Girişim ekosistemi yönetim sistemi",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <RoleProvider>
          <header className="sticky top-0 z-10 border-b border-border-subtle bg-background/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <img src="/vira-mark.png" alt="Vira" className="h-6 w-auto" />
                  vira
                </Link>
                <nav className="flex items-center gap-4 text-sm text-foreground-muted">
                  <Link href="/" className="transition hover:text-foreground">
                    Ana Sayfa
                  </Link>
                  <Link href="/portal" className="transition hover:text-foreground">
                    Portal
                  </Link>
                  <Link href="/onay" className="transition hover:text-foreground">
                    Onay Kuyruğu
                  </Link>
                  <Link href="/sorgu" className="transition hover:text-foreground">
                    AI Sorgu
                  </Link>
                  <Link href="/rapor" className="transition hover:text-foreground">
                    Yönetici Raporu
                  </Link>
                </nav>
              </div>
              <RoleSwitcher />
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </RoleProvider>
      </body>
    </html>
  );
}
