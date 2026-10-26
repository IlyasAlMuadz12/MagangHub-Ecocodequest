/**
 * Harus sama persis dengan fungsi SQL `kirim_percobaan`.
 * Bintang = jumlah kriteria yang terpenuhi:
 *   +1 selesai | +1 memakai Ulangi | +1 tanpa kesalahan | +1 langkah terpendek DAN tanpa kesalahan
 * Nyawa 4 bintang: 4 kesalahan = gagal.
 */
export const NYAWA_AWAL = 4;

export interface MasukanBintang {
  berhasil: boolean;
  /** jumlah nyawa yang hilang selama level ini (0..4) */
  kesalahan: number;
  pakaiUlangi: boolean;
  /** jumlah langkah dasar pada percobaan yang berhasil */
  langkah: number;
  langkahOptimal: number;
}

export function hitungBintang(m: MasukanBintang): number {
  if (!m.berhasil || m.kesalahan > NYAWA_AWAL - 1) return 0;
  return (
    1 +
    (m.pakaiUlangi ? 1 : 0) +
    (m.kesalahan === 0 ? 1 : 0) +
    (m.kesalahan === 0 && m.langkah <= m.langkahOptimal ? 1 : 0)
  );
}

/** skor = bintang x 100 + bonus kecepatan (0..100); pembagian bulat ke bawah seperti di SQL */
export function hitungSkor(bintang: number, waktuDetik: number, waktuTargetDetik: number): number {
  if (bintang <= 0) return 0;
  return bintang * 100 + Math.max(0, 100 - Math.floor((waktuDetik * 50) / waktuTargetDetik));
}
