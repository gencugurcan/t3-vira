"use client";

import { useEffect, useState } from "react";
import { useOturum } from "@/context/OturumContext";
import { useCeviri } from "@/lib/ceviriler";

const SESSION_KEY = "t3-vira-hosgeldin-gosterildi";

// sessionStorage bilerek kullanılıyor (localStorage değil): sekme/tarayıcı
// oturumu kapanınca sıfırlanır, böylece "oturum başına bir kez" davranışı
// doğal olarak sağlanır — aynı sekmede sayfa yenilemede tekrar çıkmaz, ama
// tarayıcı kapatılıp yeniden açılan bir sonraki girişte tekrar gösterilir.
export function HosGeldinPopup() {
  const { oturum } = useOturum();
  const t = useCeviri();
  const [acik, setAcik] = useState(false);

  useEffect(() => {
    if (!oturum.girisYapildi || !oturum.ad) return;
    if (window.sessionStorage.getItem(SESSION_KEY)) return;
    window.sessionStorage.setItem(SESSION_KEY, "1");
    // sessionStorage okuma/yazma sadece client'ta, mount sonrası yapılabilir;
    // kullanicilar/page.tsx'teki aynı desenle tutarlı, bilinçli susturuluyor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAcik(true);
  }, [oturum.girisYapildi, oturum.ad]);

  if (!acik || !oturum.ad) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Tasarımın tamamı (avatar, "Hoş Geldin!" yazısı, açıklama, buton)
          public/images/hosgeldin.png görselinin içinde; buradaki tek gerçek
          etkileşim, görselin üzerine bindirilen kapat düğmesi. */}
      <div className="relative w-full max-w-lg">
        <button
          type="button"
          onClick={() => setAcik(false)}
          aria-label={t.ortak.kapat}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <img
          src="/images/hosgeldin.png"
          alt={`${t.ortak.tekrarHosGeldin}, ${oturum.ad}`}
          className="max-h-[85vh] w-full rounded-3xl object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}
