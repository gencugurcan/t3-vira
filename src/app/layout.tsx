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
      <body className="min-h-full flex flex-col bg-gray-50">
        <RoleProvider>
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <div className="flex items-center gap-6">
                <Link href="/" className="text-lg font-semibold text-gray-900">
                  T3 Vira
                </Link>
                <nav className="flex items-center gap-4 text-sm text-gray-600">
                  <Link href="/" className="hover:text-gray-900">
                    Ana Sayfa
                  </Link>
                  <Link href="/portal" className="hover:text-gray-900">
                    Portal
                  </Link>
                  <Link href="/onay" className="hover:text-gray-900">
                    Onay Kuyruğu
                  </Link>
                  <Link href="/sorgu" className="hover:text-gray-900">
                    AI Sorgu
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
