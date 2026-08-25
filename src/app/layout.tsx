import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/context/RoleContext";
import { OturumProvider } from "@/context/OturumContext";
import { AppKabuk } from "@/components/AppKabuk";

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
        <OturumProvider>
          <RoleProvider>
            <AppKabuk>{children}</AppKabuk>
          </RoleProvider>
        </OturumProvider>
      </body>
    </html>
  );
}
