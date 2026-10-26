/** Operasi murni pada susunan blok (tanpa React) supaya mudah diuji. */
import type { Blok, Perintah, Program } from './types.ts';

let hitung = 0;
export function uid(): string {
  hitung += 1;
  return `b${Date.now().toString(36)}${hitung.toString(36)}`;
}

export type TipeBlok = Perintah | 'ulangi';

export function buatBlok(tipe: TipeBlok): Blok {
  return tipe === 'ulangi' ? { id: uid(), tipe, n: 2, isi: [] } : { id: uid(), tipe };
}

export function temukan(program: Program, id: string): Blok | null {
  for (const b of program) {
    if (b.id === id) return b;
    if (b.tipe === 'ulangi') {
      const d = temukan(b.isi, id);
      if (d) return d;
    }
  }
  return null;
}

/** apakah `id` berada di dalam `blok` (pada tingkat mana pun) */
export function adalahTurunan(blok: Blok, id: string): boolean {
  if (blok.tipe !== 'ulangi') return false;
  return blok.isi.some((c) => c.id === id || adalahTurunan(c, id));
}

function sisipDaftar(daftar: Blok[], indeks: number | null, blok: Blok): Blok[] {
  const i = indeks === null ? daftar.length : Math.max(0, Math.min(indeks, daftar.length));
  return [...daftar.slice(0, i), blok, ...daftar.slice(i)];
}

/** indukId null = tingkat paling atas; indeks null = tambahkan di akhir */
export function tambahKe(program: Program, indukId: string | null, indeks: number | null, blok: Blok): Program {
  if (indukId === null) return sisipDaftar(program, indeks, blok);
  let ketemu = false;
  const proses = (daftar: Blok[]): Blok[] =>
    daftar.map((b) => {
      if (b.tipe !== 'ulangi') return b;
      if (b.id === indukId) {
        ketemu = true;
        return { ...b, isi: sisipDaftar(b.isi, indeks, blok) };
      }
      return { ...b, isi: proses(b.isi) };
    });
  const baru = proses(program);
  // induk tidak ada (mis. sudah dihapus): letakkan di tingkat atas
  return ketemu ? baru : sisipDaftar(program, indeks, blok);
}

export interface Asal {
  indukId: string | null;
  indeks: number;
}

export function hapusBlok(program: Program, id: string): { program: Program; blok: Blok | null; asal: Asal | null } {
  let blok: Blok | null = null;
  let asal: Asal | null = null;
  const proses = (daftar: Blok[], indukId: string | null): Blok[] => {
    const i = daftar.findIndex((b) => b.id === id);
    if (i >= 0) {
      blok = daftar[i];
      asal = { indukId, indeks: i };
      return [...daftar.slice(0, i), ...daftar.slice(i + 1)];
    }
    return daftar.map((b) => (b.tipe === 'ulangi' ? { ...b, isi: proses(b.isi, b.id) } : b));
  };
  const baru = proses(program, null);
  return { program: baru, blok, asal };
}

export function pindahkan(program: Program, id: string, indukIdTujuan: string | null, indeksTujuan: number): Program {
  const blok = temukan(program, id);
  if (!blok) return program;
  if (blok.tipe === 'ulangi' && (indukIdTujuan === id || (indukIdTujuan !== null && adalahTurunan(blok, indukIdTujuan)))) {
    return program; // tidak boleh memasukkan blok ke dalam dirinya sendiri
  }
  const { program: tanpa, asal } = hapusBlok(program, id);
  let idx = indeksTujuan;
  if (asal && asal.indukId === indukIdTujuan && asal.indeks < idx) idx -= 1;
  return tambahKe(tanpa, indukIdTujuan, idx, blok);
}

export const N_MIN = 2;
export const N_MAKS = 9;

export function ubahN(program: Program, id: string, n: number): Program {
  const nn = Math.max(N_MIN, Math.min(N_MAKS, n));
  return program.map((b) => {
    if (b.tipe !== 'ulangi') return b;
    return b.id === id ? { ...b, n: nn } : { ...b, isi: ubahN(b.isi, id, n) };
  });
}
