import { useReducedMotion } from "framer-motion";

// Ana Sayfa'daki girisim kartlarinda kullanilan "dokulme" efektiyle (fade +
// hafif kayma, sirali gecikme) gorsel tutarlilik icin butun sekmelerde
// paylasilan tek kaynak. Her sayfa kendi useReducedMotion() durumuna gore
// varyant nesnelerini burada uretir, boylece erisilebilirlik (azaltilmis
// hareket tercihi) her yerde ayni sekilde saygi goruyor.
export function useDokulmeVariants() {
  const azaltilmisHareket = useReducedMotion();

  const baslik = {
    hidden: azaltilmisHareket ? { opacity: 1 } : { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: azaltilmisHareket ? 0 : 0.4 },
    },
  };

  // delay: bir sonraki blogun basligin hemen ardindan degil, kisa bir
  // gecikmeyle girmesi icin (Ana Sayfa'daki filtreVariants deseniyle ayni).
  function gecikmeliBlok(gecikme: number) {
    return {
      hidden: azaltilmisHareket ? { opacity: 1 } : { opacity: 0, y: -10 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: azaltilmisHareket ? 0 : 0.4, delay: azaltilmisHareket ? 0 : gecikme },
      },
    };
  }

  const liste = {
    hidden: {},
    visible: {
      transition: azaltilmisHareket ? {} : { staggerChildren: 0.08, delayChildren: 0.15 },
    },
  };

  const oge = {
    hidden: azaltilmisHareket ? { opacity: 1 } : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: azaltilmisHareket ? 0 : 0.35 },
    },
    exit: {
      opacity: azaltilmisHareket ? 1 : 0,
      y: azaltilmisHareket ? 0 : -8,
      transition: { duration: azaltilmisHareket ? 0 : 0.2 },
    },
  };

  return { azaltilmisHareket, baslik, gecikmeliBlok, liste, oge };
}
