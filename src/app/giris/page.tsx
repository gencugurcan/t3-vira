"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRole } from "@/context/RoleContext";
import { useOturum } from "@/context/OturumContext";
import type { KullaniciRol } from "@/lib/types";

/* ==========================================================
   BÖLÜM ARKA PLANLARI (placeholder)
   Görseller eklenene kadar placehold.co kullanılıyor. Gerçek görsel
   eklemek için sadece aşağıdaki tek satırlık sabitleri değiştirmek
   yeterli. Aynı prototip: tasarim/parallax-giris/
   ========================================================== */

/* === RESİM 1 BURAYA === */
const GORSEL_1 = "/images/giris/bg-1.jpg";
/* === RESİM 2 BURAYA === */
const GORSEL_2 = "/images/giris/bg-2.jpg";
/* === RESİM 3 BURAYA === */
const GORSEL_3 = "/images/giris/bg-3.jpg";
/* === RESİM 4 BURAYA === */
const GORSEL_4 = "/images/giris/bg-4.jpg";
/* === RESİM LOGIN BURAYA === */
const GORSEL_LOGIN = "/images/giris/bg-login.png";

// GSAP'in ve arka plan katmanlarının okuyabilmesi için gerçek CSS
// değişkenleri olarak tanımlanıyor (--bg-1..4 / --bg-login), prototipteki
// isimlerle birebir aynı.
const ARKAPLAN_DEGISKENLERI = {
  "--bg-1": `url(${GORSEL_1})`,
  "--bg-2": `url(${GORSEL_2})`,
  "--bg-3": `url(${GORSEL_3})`,
  "--bg-4": `url(${GORSEL_4})`,
  "--bg-login": `url(${GORSEL_LOGIN})`,
} as React.CSSProperties;

const BASLIKLAR = ["Başlık 1", "Başlık 2", "Başlık 3", "Başlık 4"];

// Her parallax fotoğrafının ana öznesi (uçak/helikopter gövdesi) farklı
// dikey konumda olduğu için bg-center yetmiyor; her görsele ayrı dikey
// odak yüzdesi (bg-1..4 sırasıyla).
const DIKEY_ODAK = [65, 50, 55, 40];

export default function GirisSayfasi() {
  const router = useRouter();
  const { setRol } = useRole();
  const { girisYap } = useOturum();
  const [eposta, setEposta] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const kapsayiciRef = useRef<HTMLDivElement>(null);

  // ========================================================
  // GİRİŞ MANTIĞI — mevcut sayfadan BİREBİR AYNI taşındı, hiçbir
  // satırı değiştirilmedi. /api/giris'e istek, başarılıysa
  // useRole()/useOturum() güncellemesi ve "/" yönlendirmesi,
  // başarısızsa hata mesajı — hepsi aynı.
  // ========================================================
  async function girisYapiliyor(e: React.FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eposta, sifre }),
      });
      const veri = await res.json();
      if (!res.ok) throw new Error(veri.error ?? "Giriş başarısız");
      setRol(veri.rol as KullaniciRol);
      girisYap(veri.ad as string);
      router.replace("/");
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setYukleniyor(false);
    }
  }

  // ========================================================
  // PARALLAX KURULUMU (GSAP + ScrollTrigger)
  // tasarim/parallax-giris/script.js ile aynı mantık: getRatio +
  // function-based backgroundPosition + invalidateOnRefresh.
  // ========================================================
  useEffect(() => {
    const azaltilmisHareketTercihi = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // prefers-reduced-motion açıksa parallax tween'lerini HİÇ oluşturma;
    // arka planlar sabit kalır, sayfa normal şekilde scroll edilebilir.
    if (azaltilmisHareketTercihi) return;

    gsap.registerPlugin(ScrollTrigger);

    // gsap.context: bu effect içinde oluşturulan tüm tween'ler ve
    // ScrollTrigger instance'ları otomatik izleniyor. Turbopack dev
    // server'da hot-reload sırasında (veya normal unmount'ta) aşağıdaki
    // ctx.revert() hepsini tek seferde temizliyor. Bu adım ATLANIRSA
    // her hot-reload'da eski ScrollTrigger'lar birikip önceki
    // cache/watcher kaynaklı çökmelere benzer bir soruna yol açabilir.
    const ctx = gsap.context(() => {
      function getRatio(el: HTMLElement) {
        return window.innerHeight / (window.innerHeight + el.offsetHeight);
      }

      const sectionlar = gsap.utils.toArray<HTMLElement>(".parallax-section");

      sectionlar.forEach((section, i) => {
        const bg = section.querySelector<HTMLElement>(".parallax-bg");
        if (!bg) return;

        const odak = DIKEY_ODAK[i] ?? 50;

        // bg-1 (i===0) odak noktası zaten aşağı kaydırılmış (65%); üstüne
        // tam parallax kayması binince resmin cover-slack payı taşıp
        // section 1/2 arasında koyu boşluk açıyordu. Sadece ilk section'da
        // hareket miktarı yarıya indiriliyor, diğerleri (çarpan 1) aynı.
        const hareketOrani = i === 0 ? 0.5 : 1;

        // ÖNEMLİ: backgroundPosition değerleri düz string DEĞİL, fonksiyon.
        // invalidateOnRefresh:true ile ekran boyutu değiştiğinde GSAP bu
        // fonksiyonları yeniden çağırıp değerleri tazeliyor; sabit bir
        // string olsaydı resize sonrası parallax bozuk görünürdü.
        // calc(${odak}% + ...px): taban dikey odak noktası (ana özneyi
        // gösteren nokta) + parallax kayma miktarı üst üste bindiriliyor.
        gsap.fromTo(
          bg,
          {
            // i===0: sayfa yüklenir yüklenmez ("top top") bu değer aktif
            // oluyor; offset'li versiyon resmi aşağı itip tepede koyu
            // boşluk bırakıyordu. Bu yüzden ilk section'da başlangıç
            // kayması yok, doğrudan dikey odak noktası kullanılıyor.
            backgroundPosition: () =>
              i
                ? `50% calc(${odak}% + ${-window.innerHeight * getRatio(bg) * hareketOrani}px)`
                : `50% ${odak}%`,
          },
          {
            backgroundPosition: () =>
              i
                ? `50% calc(${odak}% + ${window.innerHeight * (1 - getRatio(bg)) * hareketOrani}px)`
                : `50% calc(${odak}% + ${-window.innerHeight * getRatio(bg) * hareketOrani}px)`,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              // İlk section sayfa yüklenir yüklenmez görünür olduğu için
              // "top top"; diğerleri aşağıdan scroll edilince başlasın
              // diye "top bottom".
              start: i ? "top bottom" : "top top",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    }, kapsayiciRef);

    return () => ctx.revert();
  }, []);

  // "Girişe atla": ilk bölümdeki köşe linki, doğrudan login bölümüne
  // yumuşak kaydırma yapar (tekrar tekrar test/demo için farklı rollerle
  // giriş yapılırken 4 bölümü kaydırmaya gerek kalmasın diye).
  function giriseAtla() {
    const azaltilmisHareketTercihi = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document.getElementById("giris-bolumu")?.scrollIntoView({
      behavior: azaltilmisHareketTercihi ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <div
      ref={kapsayiciRef}
      data-theme="dark"
      style={ARKAPLAN_DEGISKENLERI}
      className="relative"
    >
      {/* ==========================================================
          PARALLAX BÖLÜMLERİ (1-4)
          tasarim/parallax-giris/ prototipiyle aynı yapı: her
          .parallax-section içinde mutlak konumlu, negatif z-index'li
          .parallax-bg katmanı.
          ========================================================== */}
      {BASLIKLAR.map((baslik, i) => (
        <section
          key={baslik}
          className="parallax-section relative flex min-h-screen w-full items-center justify-center overflow-hidden"
        >
          <div
            className="parallax-bg absolute inset-0 -z-10 bg-cover bg-no-repeat"
            style={{
              backgroundImage: `var(--bg-${i + 1})`,
              backgroundPosition: `center ${DIKEY_ODAK[i]}%`,
            }}
            aria-hidden="true"
          />

          <div className="relative px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground [text-shadow:0_4px_24px_rgba(0,0,0,0.55)] sm:text-5xl md:text-6xl">
              {baslik}
            </h1>
          </div>

          {i === 0 && (
            <button
              type="button"
              onClick={giriseAtla}
              className="absolute bottom-6 right-6 rounded-full border border-border-subtle bg-surface/70 px-4 py-2 text-xs font-medium text-foreground-muted backdrop-blur-sm transition hover:border-accent/40 hover:text-foreground sm:bottom-8 sm:right-8"
            >
              Girişe atla ↓
            </button>
          )}
        </section>
      ))}

      {/* ==========================================================
          LOGIN BÖLÜMÜ (5. ve son bölüm)
          Görünüm prototipten (yuvarlak köşe, hafif gölge, backdrop-blur,
          --bg-login arka planı); form mantığı yukarıdaki
          girisYapiliyor() ile birebir aynı, eski sayfadan değişmedi.
          ========================================================== */}
      <section
        id="giris-bolumu"
        className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-12"
      >
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "var(--bg-login)" }}
          aria-hidden="true"
        />
        {/* Görselin üzerine koyu/lacivert katman: kartın okunabilirliği için */}
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-background/75 to-background/90"
          aria-hidden="true"
        />

        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2">
            <img src="/vira-mark.png" alt="Vira" className="h-10 w-auto" />
            <span className="text-xl font-semibold text-foreground">vira</span>
            <p className="text-sm text-foreground-muted">
              Girişim ekosistemi yönetim sistemi
            </p>
          </div>

          <form
            onSubmit={girisYapiliyor}
            className="space-y-4 rounded-3xl border border-border-subtle bg-surface/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div>
              <label className="block text-sm font-medium text-foreground-muted">
                E-posta
              </label>
              <input
                type="email"
                required
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
                placeholder="ornek@t3vira.app"
                className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-muted">
                Şifre
              </label>
              <input
                type="password"
                required
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
              />
            </div>

            {hata && (
              <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-danger">
                {hata}
              </p>
            )}

            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>
      </section>

      {/* ==========================================================
          KAPANIŞ PAYI
          Parallax section'larına dahil değil (GSAP/.parallax-section
          seçicisine girmiyor), bu yüzden bg-1..4 ve DIKEY_ODAK'a
          dokunmuyor. Sayfanın en altında login arka planının devamı
          gibi doğal bir boşluk/pay bırakıyor.
          ========================================================== */}
      <div className="relative h-40 w-full overflow-hidden sm:h-56" aria-hidden="true">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-no-repeat"
          style={{ backgroundImage: "var(--bg-login)", backgroundPosition: "center 20%" }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/90 to-background" />
      </div>
    </div>
  );
}
