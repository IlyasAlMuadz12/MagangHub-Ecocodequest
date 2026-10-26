'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import * as api from '@/lib/api';
import type { Profil, Progres } from '@/lib/api';
import { PENGATURAN_AWAL, bacaLokal, gabungkan, tulisLokal } from '@/lib/pengaturan.ts';
import type { Pengaturan, Penyimpanan } from '@/lib/pengaturan.ts';
import { LAGU_AWAL } from '@/lib/lagu.ts';
import { aturAudio } from '@/lib/audio';

interface NilaiAuth {
  memuat: boolean;
  sudahMasuk: boolean;
  profil: Profil | null;
  pengaturan: Pengaturan | null;
  progres: Record<number, Progres>;
  /** memuat ulang profil dan progres (TIDAK menyentuh pengaturan) */
  muatUlang: () => Promise<void>;
  ubahPengaturan: (p: Partial<Pengaturan>) => Promise<void>;
  keluar: () => Promise<void>;
}

const Konteks = createContext<NilaiAuth | null>(null);

export function useAuth(): NilaiAuth {
  const n = useContext(Konteks);
  if (!n) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return n;
}

function penyimpanan(): Penyimpanan | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [memuat, setMemuat] = useState(true);
  const [sudahMasuk, setSudahMasuk] = useState(false);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null);
  const [progres, setProgres] = useState<Record<number, Progres>>({});

  const idRef = useRef<string | null>(null);
  const pengaturanRef = useRef<Pengaturan | null>(null);

  const terapkan = useCallback((p: Pengaturan | null) => {
    pengaturanRef.current = p;
    setPengaturan(p);
  }, []);

  const muatData = useCallback(async () => {
    const [pr, pg] = await Promise.all([api.ambilProfil(), api.ambilProgres()]);
    setProfil(pr);
    setProgres(pg);
  }, []);

  /**
   * Pengaturan dimuat SEKALI per akun yang masuk. Pilihan di perangkat langsung berlaku dan disimpan
   * lokal; database hanya cadangan lintas perangkat. Pemuatan ulang berkala TIDAK menimpa pengaturan,
   * jadi musik yang dibisukan tidak bisa menyala sendiri.
   */
  const muatPengaturan = useCallback(
    async (id: string) => {
      const lokal = bacaLokal(id, penyimpanan());
      const jauh = await api.ambilPengaturan();
      if (idRef.current !== id) return; // akun berganti selama menunggu
      const gabung = gabungkan(lokal, jauh);
      terapkan(gabung);
      tulisLokal(id, gabung, penyimpanan(), Math.max(lokal?.ts ?? 0, jauh?.ts ?? 0) || Date.now());
      if (!jauh || (lokal && lokal.ts > jauh.ts)) void api.simpanPengaturan(gabung);
    },
    [terapkan],
  );

  const masukUntuk = useCallback(
    async (id: string) => {
      if (idRef.current === id) return; // sesi yang sama (mis. token diperbarui): jangan muat ulang apa pun
      idRef.current = id;
      await Promise.all([muatData(), muatPengaturan(id)]);
    },
    [muatData, muatPengaturan],
  );

  const bersihkanSesi = useCallback(() => {
    idRef.current = null;
    setProfil(null);
    setProgres({});
    terapkan(null);
  }, [terapkan]);

  useEffect(() => {
    let batal = false;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (batal) return;
      const sesi = data.session;
      setSudahMasuk(Boolean(sesi));
      if (sesi) await masukUntuk(sesi.user.id);
      if (!batal) setMemuat(false);
    });
    const { data: langganan } = supabase.auth.onAuthStateChange((_event, sesi) => {
      setSudahMasuk(Boolean(sesi));
      // jangan memanggil Supabase langsung di dalam callback ini
      setTimeout(() => {
        if (sesi) void masukUntuk(sesi.user.id);
        else bersihkanSesi();
      }, 0);
    });
    return () => {
      batal = true;
      langganan.subscription.unsubscribe();
    };
  }, [masukUntuk, bersihkanSesi]);

  // Satu-satunya tempat audio diatur: selalu mengikuti pengaturan terbaru.
  // Tanpa akun yang masuk, musik dimatikan.
  useEffect(() => {
    if (pengaturan) aturAudio({ musikAktif: pengaturan.bgmAktif, lagu: pengaturan.musik, sfx: pengaturan.sfxAktif });
    else aturAudio({ musikAktif: false, lagu: LAGU_AWAL, sfx: false });
  }, [pengaturan]);

  const ubahPengaturan = useCallback(
    async (p: Partial<Pengaturan>) => {
      const baru: Pengaturan = { ...(pengaturanRef.current ?? PENGATURAN_AWAL), ...p };
      terapkan(baru); // langsung berlaku, tidak menunggu jaringan
      if (idRef.current) tulisLokal(idRef.current, baru, penyimpanan());
      await api.simpanPengaturan(baru);
    },
    [terapkan],
  );

  const keluar = useCallback(async () => {
    await api.keluar();
    bersihkanSesi();
  }, [bersihkanSesi]);

  const nilai = useMemo<NilaiAuth>(
    () => ({ memuat, sudahMasuk, profil, pengaturan, progres, muatUlang: muatData, ubahPengaturan, keluar }),
    [memuat, sudahMasuk, profil, pengaturan, progres, muatData, ubahPengaturan, keluar],
  );

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}
