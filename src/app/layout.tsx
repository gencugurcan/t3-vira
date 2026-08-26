import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TemaProvider } from "@/context/TemaContext";
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

// React hydrate olmadan ÖNCE, senkron olarak çalışıp <html>'e doğru
// data-theme'i uygular — böylece "yanlış temayla açılıp sonra doğru temaya
// geçme" (flash) yaşanmaz. localStorage okunamazsa (gizli sekme vb.)
// sessizce koyu temada kalır.
// /giris kendi sabit koyu tasarımını koruyor (bkz. AppKabuk.tsx'teki eşleşen
// useEffect — bu, sayfalar arası client-side geçişleri kapsar; buradaki
// script sadece ilk/hard-load anını flash'sız hale getirir).
const TEMA_ANTI_FLASH_SCRIPT = `(function () {
  try {
    if (location.pathname === '/giris') {
      document.documentElement.setAttribute('data-theme', 'dark');
      return;
    }
    var kayitli = localStorage.getItem('t3-vira-tema');
    var tema = kayitli === 'light' || kayitli === 'dark'
      ? kayitli
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', tema);
  } catch (e) {}
})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_ANTI_FLASH_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TemaProvider>
          <OturumProvider>
            <RoleProvider>
              <AppKabuk>{children}</AppKabuk>
            </RoleProvider>
          </OturumProvider>
        </TemaProvider>
      </body>
    </html>
  );
}
