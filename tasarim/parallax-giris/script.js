/* ==========================================================
   VIRA — PARALLAX GİRİŞ PROTOTİPİ / SCRIPT DOSYASI
   ========================================================== */

/**
 * GSAP'in klasik "natural parallax" deseni: her section'ın arka plan
 * katmanının (.bg) background-position'ını scroll'a bağlı olarak scrub
 * ile animasyonluyoruz. background-size:cover olduğu için görsel her
 * zaman katmanı doldurur; sadece görünen kısmı (odak noktası) kaydırılır.
 *
 * getRatio: section ne kadar uzunsa (viewport'a göre) parallax hareketi
 * o kadar küçük olur — böylece her section, ekran boyutundan bağımsız
 * olarak "doğal" hızda kayar.
 */
function getRatio(el) {
  return window.innerHeight / (window.innerHeight + el.offsetHeight);
}

// prefers-reduced-motion açıksa parallax tween'lerini HİÇ oluşturma.
// Arka planlar sabit kalır, sayfa normal şekilde scroll edilebilir.
const azaltilmisHareketTercihi = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (!azaltilmisHareketTercihi) {
  gsap.registerPlugin(ScrollTrigger);

  const sectionlar = gsap.utils.toArray(".section");

  sectionlar.forEach((section, i) => {
    const bg = section.querySelector(".bg");
    if (!bg) return;

    // ÖNEMLİ: backgroundPosition değerleri düz string DEĞİL, fonksiyon.
    // Bu sayede invalidateOnRefresh:true ile ekran boyutu (dolayısıyla
    // window.innerHeight ve section.offsetHeight) değiştiğinde GSAP
    // değerleri yeniden hesaplar; sabit bir string olsaydı resize
    // sonrası parallax yanlış/bozuk görünürdü.
    gsap.fromTo(
      bg,
      {
        backgroundPosition: () =>
          i
            ? `50% ${-window.innerHeight * getRatio(bg)}px`
            : `50% ${window.innerHeight * (1 - getRatio(bg))}px`,
      },
      {
        backgroundPosition: () =>
          i
            ? `50% ${window.innerHeight * (1 - getRatio(bg))}px`
            : `50% ${-window.innerHeight * getRatio(bg)}px`,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          // İlk section sayfa yüklenir yüklenmez görünür durumda olduğu
          // için "top top"; diğerleri aşağıdan yukarı doğru scroll
          // edildiğinde başlasın diye "top bottom".
          start: i ? "top bottom" : "top top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );
  });
}

/* ==========================================================
   LOGIN FORMU (sadece görsel prototip)
   ========================================================== */

const girisFormu = document.getElementById("giris-form");

if (girisFormu) {
  girisFormu.addEventListener("submit", (e) => {
    // Şimdilik gerçek bir backend bağlantısı yok, sayfanın yenilenmesini
    // / yönlendirmeyi engelle.
    e.preventDefault();

    // TODO: Gerçek giriş akışına bağlanacak (mevcut Vira uygulamasındaki
    // Supabase auth ile aynı e-posta + şifre akışı — src/app/giris/page.tsx
    // içindeki mantığa bakılabilir). Şu an sadece görsel prototip.
    console.log(
      "[Parallax Giriş Prototipi] Form henüz backend'e bağlı değil — bu sadece görsel bir prototip."
    );
  });
}

// Not: "Şifremi unuttum" butonuna kasıtlı olarak hiçbir event listener
// bağlanmadı — sadece görsel, tıklanabilir ama işlevsiz kalmalı.
