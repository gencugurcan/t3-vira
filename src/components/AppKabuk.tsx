"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOturum } from "@/context/OturumContext";
import { useRole } from "@/context/RoleContext";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import type { KullaniciRol } from "@/lib/types";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  roller?: KullaniciRol[];
}[] = [
  { href: "/", label: "Ana Sayfa", icon: IconHome },
  {
    href: "/portal",
    label: "Portal",
    icon: IconEdit,
    roller: ["startup", "program_yoneticisi"],
  },
  { href: "/onay", label: "Onay Kuyruğu", icon: IconCheckSquare, roller: ["super_admin"] },
  {
    href: "/sorgu",
    label: "AI Sorgu",
    icon: IconSparkle,
    roller: ["karar_verici", "super_admin"],
  },
  {
    href: "/rapor",
    label: "Yönetici Raporu",
    icon: IconBarChart,
    roller: ["karar_verici", "super_admin"],
  },
];

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconEdit({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function IconCheckSquare({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function IconSparkle({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M17.7 6.3l-2.1 2.1M8.4 15.6l-2.1 2.1" />
    </svg>
  );
}
function IconBarChart({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

export function AppKabuk({ children }: { children: React.ReactNode }) {
  const { oturum } = useOturum();
  const { rol } = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const girisSayfasindaMi = pathname === "/giris";
  const [hazir, setHazir] = useState(false);

  useEffect(() => {
    setHazir(true);
  }, []);

  useEffect(() => {
    if (hazir && !oturum.girisYapildi && !girisSayfasindaMi) {
      router.replace("/giris");
    }
  }, [hazir, oturum.girisYapildi, girisSayfasindaMi, router]);

  if (girisSayfasindaMi) {
    return <>{children}</>;
  }

  if (!hazir || !oturum.girisYapildi) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-60 flex-shrink-0 flex-col border-r border-border-subtle bg-surface">
        <Link href="/" className="flex items-center gap-2 px-5 py-5 text-lg font-semibold text-foreground">
          <img src="/vira-mark.png" alt="Vira" className="h-6 w-auto" />
          vira
        </Link>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.filter((item) => !item.roller || item.roller.includes(rol)).map((item) => {
            const aktif = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  aktif
                    ? "bg-accent-soft text-foreground"
                    : "text-foreground-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <Icon className={aktif ? "text-accent" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border-subtle p-3">
          <RoleSwitcher />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
