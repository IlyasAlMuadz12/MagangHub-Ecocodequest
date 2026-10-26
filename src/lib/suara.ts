/** Bantuan untuk suara bacaan (Web Speech). Murni, tanpa DOM, supaya mudah diuji. */

export interface SuaraLike {
  lang: string;
  name: string;
}

function normal(lang: string): string {
  return lang.toLowerCase().replace('_', '-');
}

/**
 * Memilih suara bahasa Indonesia dari daftar suara perangkat.
 * Mengenali id-ID, id_ID, id, dan in-ID (kode lama yang dipakai sebagian Android). Bahasa Melayu (ms) tidak dianggap.
 * Bila ada beberapa, yang namanya menyebut Indonesia/Gadis/Andika didahulukan. Bila tidak ada, null.
 */
export function pilihSuara<T extends SuaraLike>(daftar: T[]): T | null {
  const cocok = daftar.filter((s) => {
    const l = normal(s.lang);
    return l === 'id' || l.startsWith('id-') || l === 'in' || l.startsWith('in-');
  });
  if (cocok.length === 0) return null;
  const petunjuk = /indonesia|gadis|andika|damayanti/i;
  return cocok.find((s) => normal(s.lang) === 'id-id' && petunjuk.test(s.name)) ?? cocok.find((s) => petunjuk.test(s.name)) ?? cocok.find((s) => normal(s.lang) === 'id-id') ?? cocok[0];
}

/** Memecah teks menjadi kalimat. Kalimat pendek diucapkan lebih lancar dan menghindari bug Chrome yang memotong ucapan panjang. */
export function pecahKalimat(teks: string): string[] {
  return (teks.match(/[^.!?]+[.!?]*/g) ?? []).map((k) => k.trim()).filter((k) => k.length > 0);
}
