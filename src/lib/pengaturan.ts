/** Pengaturan siswa dan penyimpanannya. Tanpa React/Supabase supaya mudah diuji. */
import { LAGU_AWAL, adalahIdLagu } from './lagu.ts';
import type { IdLagu } from './lagu.ts';

export type Tema = 'cerah' | 'malam' | 'hutan';

export interface Pengaturan {
  tema: Tema;
  /** true = musik latar menyala */
  bgmAktif: boolean;
  sfxAktif: boolean;
  tutorialSelesai: boolean;
  /** lagu pilihan siswa */
  musik: IdLagu;
}

export const PENGATURAN_AWAL: Pengaturan = {
  tema: 'cerah',
  bgmAktif: true,
  sfxAktif: true,
  tutorialSelesai: false,
  musik: LAGU_AWAL,
};

export function adalahTema(x: unknown): x is Tema {
  return x === 'cerah' || x === 'malam' || x === 'hutan';
}

/** Mengubah data yang tidak dipercaya (localStorage, database) menjadi Pengaturan yang utuh dan valid. */
export function bersihkan(mentah: unknown): Pengaturan {
  const m = (mentah && typeof mentah === 'object' ? mentah : {}) as Record<string, unknown>;
  return {
    tema: adalahTema(m.tema) ? m.tema : PENGATURAN_AWAL.tema,
    bgmAktif: typeof m.bgmAktif === 'boolean' ? m.bgmAktif : PENGATURAN_AWAL.bgmAktif,
    sfxAktif: typeof m.sfxAktif === 'boolean' ? m.sfxAktif : PENGATURAN_AWAL.sfxAktif,
    tutorialSelesai: typeof m.tutorialSelesai === 'boolean' ? m.tutorialSelesai : PENGATURAN_AWAL.tutorialSelesai,
    musik: adalahIdLagu(m.musik) ? m.musik : PENGATURAN_AWAL.musik,
  };
}

/** Pengaturan beserta waktu terakhir diubah (ms), untuk memilih yang terbaru. */
export interface Tersimpan {
  nilai: Pengaturan;
  ts: number;
}

/** Yang lebih baru menang. Pilihan di perangkat langsung berlaku, database menjadi cadangan lintas perangkat. */
export function gabungkan(lokal: Tersimpan | null, jauh: Tersimpan | null): Pengaturan {
  if (!lokal && !jauh) return { ...PENGATURAN_AWAL };
  if (!lokal) return (jauh as Tersimpan).nilai;
  if (!jauh) return lokal.nilai;
  return jauh.ts > lokal.ts ? jauh.nilai : lokal.nilai;
}

export interface Penyimpanan {
  getItem(kunci: string): string | null;
  setItem(kunci: string, nilai: string): void;
}

const kunci = (idPengguna: string) => `ecocode.pengaturan.v1.${idPengguna}`;

export function bacaLokal(idPengguna: string, st: Penyimpanan | null): Tersimpan | null {
  if (!st) return null;
  try {
    const mentah = st.getItem(kunci(idPengguna));
    if (!mentah) return null;
    const o = JSON.parse(mentah) as { nilai?: unknown; ts?: unknown };
    return { nilai: bersihkan(o.nilai), ts: typeof o.ts === 'number' ? o.ts : 0 };
  } catch {
    return null;
  }
}

export function tulisLokal(idPengguna: string, nilai: Pengaturan, st: Penyimpanan | null, ts: number = Date.now()): void {
  if (!st) return;
  try {
    st.setItem(kunci(idPengguna), JSON.stringify({ nilai, ts }));
  } catch {
    /* penyimpanan penuh atau diblokir: pengaturan tetap berlaku selama halaman terbuka */
  }
}
