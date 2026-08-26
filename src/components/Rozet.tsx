import type { AiDurum, GirisimDurum } from "@/lib/types";

// Tüm durum/AI rozetlerinin tek stil kaynağı. Yeni bir renk eklemek ya da
// mevcut birini değiştirmek istendiğinde SADECE burası güncellenir; sayfalar
// <DurumRozeti> / <AiDurumRozeti> üzerinden tüketir.
type RozetTuru = "success" | "warning" | "danger" | "notr";

const ROZET_STIL: Record<RozetTuru, string> = {
  success: "bg-[var(--success-soft)] text-success",
  warning: "bg-[var(--warning-soft)] text-warning",
  danger: "bg-[var(--danger-soft)] text-danger",
  notr: "bg-surface-2 text-foreground-muted",
};

function IconCheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="8 12.5 10.5 15 16 9.5" />
    </svg>
  );
}
function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  );
}
function IconAlertCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="12.5" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

const ROZET_IKON: Record<RozetTuru, (props: { className?: string }) => React.JSX.Element> = {
  success: IconCheckCircle,
  warning: IconClock,
  danger: IconAlertCircle,
  notr: IconClock,
};

export function Rozet({
  tur,
  children,
  className,
}: {
  tur: RozetTuru;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = ROZET_IKON[tur];
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${ROZET_STIL[tur]} ${className ?? ""}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {children}
    </span>
  );
}

// Girişim durumu (onaylı / onay bekliyor) → { etiket, tur } eşlemesi.
export const GIRISIM_DURUM_BILGISI: Record<GirisimDurum, { etiket: string; tur: RozetTuru }> = {
  onayli: { etiket: "Onaylı", tur: "success" },
  onay_bekliyor: { etiket: "Onay Bekliyor", tur: "warning" },
};

export function DurumRozeti({ durum, className }: { durum: GirisimDurum; className?: string }) {
  const bilgi = GIRISIM_DURUM_BILGISI[durum];
  return (
    <Rozet tur={bilgi.tur} className={className}>
      {bilgi.etiket}
    </Rozet>
  );
}

// AI durumu (HAZIR / İZLEMEDE / VERİ_EKSİK) → { etiket, tur } eşlemesi.
// Ham snake_case/büyük harf değerler yerine okunur Türkçe etiketler burada.
export const AI_DURUM_BILGISI: Record<
  NonNullable<AiDurum>,
  { etiket: string; tur: RozetTuru }
> = {
  HAZIR: { etiket: "Hazır", tur: "success" },
  IZLEMEDE: { etiket: "İzlemede", tur: "warning" },
  VERI_EKSIK: { etiket: "Veri Eksik", tur: "danger" },
};

export function AiDurumRozeti({
  aiDurum,
  className,
}: {
  aiDurum: AiDurum;
  className?: string;
}) {
  if (!aiDurum) return null;
  const bilgi = AI_DURUM_BILGISI[aiDurum];
  return (
    <Rozet tur={bilgi.tur} className={className}>
      AI: {bilgi.etiket}
    </Rozet>
  );
}
