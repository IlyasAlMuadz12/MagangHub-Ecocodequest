/**
 * Mesin game EcoCode Quest. Fungsi murni tanpa React, jadi mudah diuji.
 * Aturan HARUS sama dengan scripts/ecocode_solver.py.
 *
 * - START di K1,B1 (robot menghadap kanan), FINIS di K6,B6.
 * - Ambil: robot harus MASUK ke petak sampah dulu; sampah masuk ke tas robot (boleh banyak).
 * - Buang: hanya setelah SEMUA sampah diambil. Robot harus berdiri di petak tong. Sistem lalu bertanya
 *   "mana sampah <jenis tong>?" dari isi tas, dan siswa memilih. Pilihan benar = sampah masuk tong.
 * - Petak sampah dan petak tong boleh diinjak; hanya rintangan dan tepi papan yang tidak.
 * - Satu kali "Jalankan" berhenti pada kesalahan pertama (nyawa -1, papan kembali ke awal).
 * - Misi selesai bila semua sampah masuk tong yang benar DAN robot berada di petak finis.
 */
import type { Arah, JenisSampah, Level, Perintah } from './types.ts';
import { KATALOG, jenisDari } from './catalog.ts';

export const ARAH: Arah[] = ['kanan', 'bawah', 'kiri', 'atas'];
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

/** Batas langkah satu kali jalan, supaya Ulangi bersarang tidak membuat game macet. */
export const BATAS_LANGKAH = 300;

export interface Keadaan {
  x: number;
  y: number;
  hadap: Arah;
  /** indeks sampah yang ada di tas robot, urut sesuai pengambilan */
  bawa: number[];
  /** sisa[i] = sampah ke-i masih tergeletak di papan */
  sisa: boolean[];
  /** jumlah sampah yang sudah masuk tong yang benar */
  masuk: number;
}

export type Kejadian =
  | 'maju'
  | 'mundur'
  | 'belok'
  | 'ambil'
  | 'tanya'
  | 'buang-benar'
  | 'tabrak'
  | 'ambil-salah'
  | 'buang-salah';

/** Pertanyaan saat Buang: pilih sampah yang cocok dengan tong dari isi tas. */
export interface Pertanyaan {
  jenisTong: JenisSampah;
  /** indeks sampah di tas yang boleh dipilih */
  pilihan: number[];
}

export interface Langkah {
  /** urutan perintah ini pada program (mulai dari 0) */
  indeks: number;
  perintah: Perintah;
  kejadian: Kejadian;
  keadaan: Keadaan;
  pesan?: string;
  pertanyaan?: Pertanyaan;
  /** indeks sampah yang dipilih siswa pada pertanyaan */
  jawaban?: number;
}

export interface Hasil {
  langkah: Langkah[];
  /** true bila berhenti karena kesalahan (nyawa berkurang) */
  galat: boolean;
  pesan: string | null;
  /** true bila misi selesai pada akhir program */
  selesaiMisi: boolean;
  /** jumlah langkah dasar yang berhasil dijalankan */
  jumlahLangkah: number;
  keadaanAkhir: Keadaan;
  /** true bila program dipotong karena melewati BATAS_LANGKAH */
  terpotong: boolean;
}

export function keadaanAwal(level: Level): Keadaan {
  const { robot, sampah } = level.config;
  return { x: robot.x, y: robot.y, hadap: robot.hadap, bawa: [], sisa: sampah.map(() => true), masuk: 0 };
}

export function labelJenis(j: JenisSampah): string {
  return j === 'b3' ? 'B3' : j;
}

type Halangan = 'tepi' | 'rintangan';

function cariHalangan(level: Level, x: number, y: number): Halangan | null {
  const n = level.ukuranGrid;
  if (x < 1 || y < 1 || x > n || y > n) return 'tepi';
  if (level.config.rintangan.some((r) => r.x === x && r.y === y)) return 'rintangan';
  return null; // petak sampah dan petak tong boleh diinjak
}

const PESAN_TABRAK: Record<Halangan, string> = {
  tepi: 'Ups, robot keluar dari papan!',
  rintangan: 'Ups, robot menabrak rintangan!',
};

export interface HasilLangkahTunggal {
  keadaan: Keadaan;
  kejadian: Kejadian;
  pesan?: string;
  pertanyaan?: Pertanyaan;
}

/**
 * Menjalankan SATU perintah. Untuk 'buang' yang sah, hasilnya 'tanya' (keadaan tidak berubah) sampai
 * `jawaban` (indeks sampah pilihan siswa) diberikan pada pemanggilan berikutnya.
 */
export function langkahTunggal(level: Level, k: Keadaan, p: Perintah, jawaban?: number): HasilLangkahTunggal {
  const i = ARAH.indexOf(k.hadap);
  const gagal = (kejadian: Kejadian, pesan: string): HasilLangkahTunggal => ({ keadaan: k, kejadian, pesan });
  switch (p) {
    case 'maju':
    case 'mundur': {
      const d = p === 'maju' ? 1 : -1;
      const nx = k.x + d * DX[i];
      const ny = k.y + d * DY[i];
      const h = cariHalangan(level, nx, ny);
      if (h) return gagal('tabrak', PESAN_TABRAK[h]);
      return { keadaan: { ...k, x: nx, y: ny }, kejadian: p };
    }
    case 'kanan':
      return { keadaan: { ...k, hadap: ARAH[(i + 1) % 4] }, kejadian: 'belok' };
    case 'kiri':
      return { keadaan: { ...k, hadap: ARAH[(i + 3) % 4] }, kejadian: 'belok' };
    case 'ambil': {
      // sampah diambil dari petak yang sedang diinjak robot
      const idx = level.config.sampah.findIndex((s, j) => k.sisa[j] && s.x === k.x && s.y === k.y);
      if (idx < 0) return gagal('ambil-salah', 'Tidak ada sampah di petak ini. Masuklah ke petak sampah dulu!');
      const sisa = k.sisa.slice();
      sisa[idx] = false;
      return { keadaan: { ...k, bawa: [...k.bawa, idx], sisa }, kejadian: 'ambil' };
    }
    case 'buang': {
      const tong = level.config.tong.find((t) => t.x === k.x && t.y === k.y);
      if (!tong) return gagal('buang-salah', 'Di petak ini tidak ada tong sampah. Masuklah ke petak tong dulu!');
      if (k.bawa.length === 0) return gagal('buang-salah', 'Robot belum membawa sampah.');
      if (k.sisa.some(Boolean)) return gagal('buang-salah', 'Ambil semua sampah dulu sebelum membuang!');
      const adaCocok = k.bawa.some((b) => jenisDari(level.config.sampah[b].item) === tong.jenis);
      if (!adaCocok) return gagal('buang-salah', `Robot tidak membawa sampah ${labelJenis(tong.jenis)}.`);
      if (jawaban === undefined) {
        return { keadaan: k, kejadian: 'tanya', pertanyaan: { jenisTong: tong.jenis, pilihan: [...k.bawa] } };
      }
      if (!k.bawa.includes(jawaban)) return gagal('buang-salah', 'Pilihan itu tidak ada di tas robot.');
      const item = level.config.sampah[jawaban].item;
      const jenisItem = jenisDari(item);
      if (jenisItem !== tong.jenis) {
        return gagal('buang-salah', `Salah! ${KATALOG[item].nama} termasuk sampah ${labelJenis(jenisItem)}, bukan sampah ${labelJenis(tong.jenis)}.`);
      }
      return { keadaan: { ...k, bawa: k.bawa.filter((b) => b !== jawaban), masuk: k.masuk + 1 }, kejadian: 'buang-benar' };
    }
  }
}

export function misiSelesai(level: Level, k: Keadaan): boolean {
  const f = level.config.finish;
  return k.masuk === level.config.sampah.length && k.bawa.length === 0 && k.x === f.x && k.y === f.y;
}

/** Pilihan yang benar untuk sebuah pertanyaan (dipakai pengujian dan solver). */
export function jawabBenar(level: Level, q: Pertanyaan): number {
  const benar = q.pilihan.find((b) => jenisDari(level.config.sampah[b].item) === q.jenisTong);
  return benar ?? q.pilihan[0];
}

export type LangkahBerikut =
  | { status: 'langkah'; langkah: Langkah }
  | { status: 'tanya'; pertanyaan: Pertanyaan }
  | { status: 'galat'; langkah: Langkah; pesan: string }
  | { status: 'selesai' };

const KEJADIAN_GALAT: Kejadian[] = ['tabrak', 'ambil-salah', 'buang-salah'];

/**
 * Menjalankan program selangkah demi selangkah. Berhenti pada 'tanya' sampai siswa menjawab (jawab),
 * dan berhenti pada 'galat' (kesalahan pertama). Dipakai antarmuka agar animasi bisa dijeda.
 */
export class Penjalan {
  readonly langkah: Langkah[] = [];
  readonly terpotong: boolean;
  private readonly level: Level;
  private readonly perintah: Perintah[];
  private k: Keadaan;
  private i = 0;
  private jumlah = 0;
  private menunggu: Pertanyaan | null = null;
  private galat = false;
  private pesanGalat: string | null = null;
  private selesai = false;

  constructor(level: Level, perintahPenuh: Perintah[]) {
    this.level = level;
    this.terpotong = perintahPenuh.length > BATAS_LANGKAH;
    this.perintah = this.terpotong ? perintahPenuh.slice(0, BATAS_LANGKAH) : perintahPenuh;
    this.k = keadaanAwal(level);
  }

  get keadaan(): Keadaan {
    return this.k;
  }

  get pertanyaan(): Pertanyaan | null {
    return this.menunggu;
  }

  /** indeks perintah yang sedang dijalankan atau sedang menunggu jawaban */
  get indeks(): number {
    return this.i;
  }

  berikut(): LangkahBerikut {
    if (this.galat) return { status: 'galat', langkah: this.langkah[this.langkah.length - 1], pesan: this.pesanGalat ?? '' };
    if (this.selesai) return { status: 'selesai' };
    if (this.menunggu) return { status: 'tanya', pertanyaan: this.menunggu };
    if (this.i >= this.perintah.length) {
      this.selesai = true;
      return { status: 'selesai' };
    }
    return this.terapkan(langkahTunggal(this.level, this.k, this.perintah[this.i]), undefined, undefined);
  }

  /** Jawaban siswa (indeks sampah yang dipilih) untuk pertanyaan yang sedang menunggu. */
  jawab(indeks: number): LangkahBerikut {
    if (!this.menunggu) throw new Error('Tidak ada pertanyaan yang menunggu jawaban');
    const q = this.menunggu;
    this.menunggu = null;
    return this.terapkan(langkahTunggal(this.level, this.k, this.perintah[this.i], indeks), q, indeks);
  }

  private terapkan(r: HasilLangkahTunggal, pertanyaan: Pertanyaan | undefined, jawaban: number | undefined): LangkahBerikut {
    if (r.kejadian === 'tanya' && r.pertanyaan) {
      this.menunggu = r.pertanyaan;
      return { status: 'tanya', pertanyaan: r.pertanyaan };
    }
    const l: Langkah = { indeks: this.i, perintah: this.perintah[this.i], kejadian: r.kejadian, keadaan: r.keadaan, pesan: r.pesan, pertanyaan, jawaban };
    this.langkah.push(l);
    if (KEJADIAN_GALAT.includes(r.kejadian)) {
      this.galat = true;
      this.pesanGalat = r.pesan ?? null;
      return { status: 'galat', langkah: l, pesan: r.pesan ?? '' };
    }
    this.k = r.keadaan;
    this.jumlah += 1;
    this.i += 1;
    return { status: 'langkah', langkah: l };
  }

  hasil(): Hasil {
    return {
      langkah: this.langkah,
      galat: this.galat,
      pesan: this.pesanGalat,
      selesaiMisi: !this.galat && !this.terpotong && this.i >= this.perintah.length && !this.menunggu && misiSelesai(this.level, this.k),
      jumlahLangkah: this.jumlah,
      keadaanAkhir: this.k,
      terpotong: this.terpotong,
    };
  }
}

export type Penjawab = (level: Level, pertanyaan: Pertanyaan) => number;

/** Menjalankan seluruh program sekaligus. `penjawab` menjawab pertanyaan Buang (bawaan: selalu benar). */
export function jalankan(level: Level, perintah: Perintah[], penjawab: Penjawab = jawabBenar): Hasil {
  const pj = new Penjalan(level, perintah);
  let r = pj.berikut();
  while (r.status !== 'selesai' && r.status !== 'galat') {
    r = r.status === 'tanya' ? pj.jawab(penjawab(level, r.pertanyaan)) : pj.berikut();
  }
  return pj.hasil();
}
