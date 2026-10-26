/** Daftar musik latar yang bisa dipilih siswa. Berkasnya ada di /public/audio. Id internal tidak diubah agar database lama tetap cocok. */
export type IdLagu = 'pagi-ceria' | 'bintang-malam' | 'hutan-hijau';

export interface Lagu {
  /** id internal (tersimpan di database); tidak ditampilkan kepada siswa */
  id: IdLagu;
  /** nama yang ditampilkan: sengaja hanya nomor, tanpa judul atau deskripsi */
  judul: string;
  berkas: string;
}

export const DAFTAR_LAGU: Lagu[] = [
  { id: 'pagi-ceria', judul: 'Lagu 1', berkas: '/audio/bgm-cerah.mp3' },
  { id: 'bintang-malam', judul: 'Lagu 2', berkas: '/audio/bgm-malam.mp3' },
  { id: 'hutan-hijau', judul: 'Lagu 3', berkas: '/audio/bgm-hutan.mp3' },
];

export const LAGU_AWAL: IdLagu = 'pagi-ceria';

export function adalahIdLagu(x: unknown): x is IdLagu {
  return typeof x === 'string' && DAFTAR_LAGU.some((l) => l.id === x);
}

export function berkasLagu(id: IdLagu): string {
  const l = DAFTAR_LAGU.find((x) => x.id === id);
  if (!l) throw new Error('Lagu tidak dikenal: ' + id);
  return l.berkas;
}
