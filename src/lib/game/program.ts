import type { Blok, Perintah, Program } from './types.ts';
import { BATAS_LANGKAH } from './engine.ts';

/** Satu putaran Ulangi yang sedang berjalan: blok Ulangi mana, putaran ke berapa dari berapa. */
export interface JejakUlangi {
  id: string;
  ke: number;
  dari: number;
}

/** Satu perintah dasar beserta blok yang menghasilkannya, supaya antarmuka bisa menyorot blok yang sedang jalan. */
export interface LangkahProgram {
  perintah: Perintah;
  blokId: string;
  /** Ulangi yang membungkus blok ini, dari luar ke dalam */
  ulangi: JejakUlangi[];
}

export type JenisSorotan = 'jalan' | 'tanya' | 'galat';

/** Penanda yang ditampilkan di susunan blok saat program berjalan. */
export interface Sorotan {
  blokId: string;
  ulangi: JejakUlangi[];
  jenis: JenisSorotan;
  /** langkah ke berapa (mulai dari 1) dan dari berapa langkah seluruhnya */
  nomor: number;
  total: number;
}

/** Meratakan susunan blok (termasuk Ulangi) menjadi urutan perintah dasar, lengkap dengan blok asalnya. */
export function ratakanBerjejak(program: Program, batas: number = BATAS_LANGKAH + 1): LangkahProgram[] {
  const hasil: LangkahProgram[] = [];
  const isi = (daftar: Blok[], induk: JejakUlangi[]): void => {
    for (const b of daftar) {
      if (hasil.length >= batas) return;
      if (b.tipe === 'ulangi') {
        for (let i = 0; i < b.n; i++) {
          if (hasil.length >= batas) return;
          isi(b.isi, [...induk, { id: b.id, ke: i + 1, dari: b.n }]);
        }
      } else {
        hasil.push({ perintah: b.tipe, blokId: b.id, ulangi: induk });
      }
    }
  };
  isi(program, []);
  return hasil;
}

/** Meratakan susunan blok menjadi urutan perintah dasar saja. */
export function ratakan(program: Program, batas: number = BATAS_LANGKAH + 1): Perintah[] {
  return ratakanBerjejak(program, batas).map((l) => l.perintah);
}

function punyaPerintah(daftar: Blok[]): boolean {
  return daftar.some((b) => (b.tipe === 'ulangi' ? punyaPerintah(b.isi) : true));
}

/** Bintang 2: memakai blok Ulangi yang benar-benar berisi perintah. */
export function pakaiUlangi(program: Program): boolean {
  return program.some((b) => b.tipe === 'ulangi' && punyaPerintah(b.isi));
}

export function hitungBlok(program: Program): number {
  return program.reduce((n, b) => n + 1 + (b.tipe === 'ulangi' ? hitungBlok(b.isi) : 0), 0);
}
