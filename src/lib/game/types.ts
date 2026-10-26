export type Arah = 'kanan' | 'bawah' | 'kiri' | 'atas';
export type JenisSampah = 'organik' | 'anorganik' | 'b3';
export type Dunia = 'rumah' | 'sekolah' | 'hutan';

/** x = kolom (K1..K6), y = baris (B1..B6), keduanya mulai dari 1 */
export interface Petak {
  x: number;
  y: number;
}

export interface LevelConfig {
  robot: Petak & { hadap: Arah };
  sampah: (Petak & { item: string })[];
  tong: (Petak & { jenis: JenisSampah })[];
  rintangan: Petak[];
  finish: Petak;
}

export interface Level {
  id: number;
  dunia: Dunia;
  judul: string;
  ukuranGrid: number;
  jumlahRintangan: number;
  langkahOptimal: number;
  waktuTargetDetik: number;
  config: LevelConfig;
}

/** Perintah dasar; tiap eksekusi dihitung 1 langkah. */
export type Perintah = 'maju' | 'mundur' | 'kanan' | 'kiri' | 'ambil' | 'buang';

export type BlokBiasa = { id: string; tipe: Perintah };
export type BlokUlangi = { id: string; tipe: 'ulangi'; n: number; isi: Blok[] };
export type Blok = BlokBiasa | BlokUlangi;
export type Program = Blok[];
