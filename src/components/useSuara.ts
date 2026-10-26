'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { pecahKalimat, pilihSuara } from '@/lib/suara.ts';

/**
 * Suara bacaan memakai suara bawaan peramban (Web Speech). Tanpa berkas dan tanpa biaya,
 * tetapi ada tidaknya suara bahasa Indonesia bergantung pada perangkat.
 */
export function useSuara() {
  const [didukung, setDidukung] = useState(false);
  /** null = daftar suara perangkat belum termuat */
  const [adaSuaraId, setAdaSuaraId] = useState<boolean | null>(null);
  const [berbicara, setBerbicara] = useState(false);
  /** true bila peramban menahan suara karena belum ada ketukan pengguna */
  const [ditolak, setDitolak] = useState(false);

  const suaraRef = useRef<SpeechSynthesisVoice | null>(null);
  const tundaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** naik setiap ucapan dihentikan/diganti, supaya kejadian dari ucapan lama diabaikan */
  const nomorRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    setDidukung(true);
    const muat = () => {
      const daftar = synth.getVoices();
      if (daftar.length === 0) return;
      const s = pilihSuara(daftar);
      suaraRef.current = s;
      setAdaSuaraId(s !== null);
    };
    muat();
    synth.addEventListener('voiceschanged', muat);
    return () => {
      synth.removeEventListener('voiceschanged', muat);
      if (tundaRef.current) clearTimeout(tundaRef.current);
      nomorRef.current += 1;
      synth.cancel(); // tutup tutorial = suara berhenti
    };
  }, []);

  const berhenti = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (tundaRef.current) clearTimeout(tundaRef.current);
    nomorRef.current += 1;
    window.speechSynthesis.cancel();
    setBerbicara(false);
  }, []);

  const ucapkan = useCallback(
    (teks: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const synth = window.speechSynthesis;
      berhenti();
      const nomor = nomorRef.current;
      // jeda singkat setelah cancel() agar Chrome tidak membatalkan ucapan baru
      tundaRef.current = setTimeout(() => {
        const kalimat = pecahKalimat(teks);
        kalimat.forEach((k, idx) => {
          const u = new SpeechSynthesisUtterance(k);
          u.lang = 'id-ID';
          if (suaraRef.current) u.voice = suaraRef.current;
          u.rate = 0.92; // sedikit pelan agar mudah dipahami anak
          u.pitch = 1.05;
          if (idx === 0) {
            u.onstart = () => {
              if (nomorRef.current !== nomor) return;
              setBerbicara(true);
              setDitolak(false);
            };
          }
          if (idx === kalimat.length - 1) {
            u.onend = () => {
              if (nomorRef.current === nomor) setBerbicara(false);
            };
          }
          u.onerror = (e) => {
            if (nomorRef.current !== nomor) return;
            setBerbicara(false);
            if (e.error === 'not-allowed') setDitolak(true);
          };
          synth.speak(u);
        });
      }, 80);
    },
    [berhenti],
  );

  return { didukung, adaSuaraId, berbicara, ditolak, ucapkan, berhenti };
}
