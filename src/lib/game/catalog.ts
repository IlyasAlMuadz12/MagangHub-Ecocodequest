// DIHASILKAN oleh scripts/bangun_data_ts.py dari skema SQL. Jangan diedit tangan.
// Ikon masih emoji sebagai pengganti sementara; ganti dengan gambar sendiri bila sudah ada.
import type { JenisSampah } from './types.ts';

export interface ItemSampah { nama: string; jenis: JenisSampah; ikon: string }

export const KATALOG: Record<string, ItemSampah> = {
  'kulit-pisang': { nama: 'Kulit pisang', jenis: 'organik', ikon: '🍌' },
  'botol-plastik': { nama: 'Botol plastik', jenis: 'anorganik', ikon: '🧴' },
  'baterai-bekas': { nama: 'Baterai bekas', jenis: 'b3', ikon: '🔋' },
  'sisa-nasi': { nama: 'Sisa nasi', jenis: 'organik', ikon: '🍚' },
  'kaleng-minuman': { nama: 'Kaleng minuman', jenis: 'anorganik', ikon: '🥫' },
  'lampu-bekas': { nama: 'Lampu bekas', jenis: 'b3', ikon: '💡' },
  'kulit-telur': { nama: 'Kulit telur', jenis: 'organik', ikon: '🥚' },
  'kantong-plastik': { nama: 'Kantong plastik', jenis: 'anorganik', ikon: '🛍️' },
  'obat-kedaluwarsa': { nama: 'Obat kedaluwarsa', jenis: 'b3', ikon: '💊' },
  'sayur-busuk': { nama: 'Sayur busuk', jenis: 'organik', ikon: '🥬' },
  'gelas-plastik': { nama: 'Gelas plastik', jenis: 'anorganik', ikon: '🥤' },
  'obat-nyamuk-semprot': { nama: 'Obat nyamuk semprot', jenis: 'b3', ikon: '🦟' },
  'ampas-teh': { nama: 'Ampas teh', jenis: 'organik', ikon: '🍵' },
  'botol-kaca': { nama: 'Botol kaca', jenis: 'anorganik', ikon: '🍾' },
  'charger-rusak': { nama: 'Charger rusak', jenis: 'b3', ikon: '🔌' },
  'daun-kering': { nama: 'Daun kering', jenis: 'organik', ikon: '🍂' },
  'botol-minum-plastik': { nama: 'Botol minum plastik', jenis: 'anorganik', ikon: '🚰' },
  'baterai-jam-dinding': { nama: 'Baterai jam dinding', jenis: 'b3', ikon: '🔋' },
  'sisa-bekal': { nama: 'Sisa bekal', jenis: 'organik', ikon: '🍱' },
  'bungkus-jajan': { nama: 'Bungkus jajan', jenis: 'anorganik', ikon: '🍬' },
  'tinta-printer-bekas': { nama: 'Tinta printer bekas', jenis: 'b3', ikon: '🖨️' },
  'kulit-jeruk': { nama: 'Kulit jeruk', jenis: 'organik', ikon: '🍊' },
  'kertas-bekas': { nama: 'Kertas bekas', jenis: 'anorganik', ikon: '📄' },
  'lampu-neon-bekas': { nama: 'Lampu neon bekas', jenis: 'b3', ikon: '💡' },
  'rumput-potong': { nama: 'Rumput potong', jenis: 'organik', ikon: '🌱' },
  'penggaris-plastik': { nama: 'Penggaris plastik', jenis: 'anorganik', ikon: '📏' },
  'kaleng-cat-bekas': { nama: 'Kaleng cat bekas', jenis: 'b3', ikon: '🎨' },
  'sisa-sayur-kantin': { nama: 'Sisa sayur kantin', jenis: 'organik', ikon: '🥕' },
  'kotak-bekal-plastik': { nama: 'Kotak bekal plastik', jenis: 'anorganik', ikon: '🥡' },
  'mouse-komputer-rusak': { nama: 'Mouse komputer rusak', jenis: 'b3', ikon: '🖱️' },
  'daun-gugur': { nama: 'Daun gugur', jenis: 'organik', ikon: '🍁' },
  'baterai-senter-bekas': { nama: 'Baterai senter bekas', jenis: 'b3', ikon: '🔋' },
  'ranting-patah': { nama: 'Ranting patah', jenis: 'organik', ikon: '🌿' },
  'bungkus-camilan': { nama: 'Bungkus camilan', jenis: 'anorganik', ikon: '🍿' },
  'korek-gas-bekas': { nama: 'Korek gas bekas', jenis: 'b3', ikon: '🔥' },
  'buah-jatuh': { nama: 'Buah jatuh', jenis: 'organik', ikon: '🍎' },
  'kaleng-sarden': { nama: 'Kaleng sarden', jenis: 'anorganik', ikon: '🐟' },
  'semprotan-serangga': { nama: 'Semprotan serangga', jenis: 'b3', ikon: '🐛' },
  'kayu-lapuk': { nama: 'Kayu lapuk', jenis: 'organik', ikon: '🪵' },
  'tali-rafia': { nama: 'Tali rafia', jenis: 'anorganik', ikon: '🧵' },
  'oli-bekas': { nama: 'Oli bekas', jenis: 'b3', ikon: '🛢️' },
  'bunga-layu': { nama: 'Bunga layu', jenis: 'organik', ikon: '🥀' },
  'sedotan-plastik': { nama: 'Sedotan plastik', jenis: 'anorganik', ikon: '🧃' },
  'power-bank-rusak': { nama: 'Power bank rusak', jenis: 'b3', ikon: '📱' },
};

export function jenisDari(item: string): JenisSampah {
  const d = KATALOG[item];
  if (!d) throw new Error('Item sampah tidak dikenal: ' + item);
  return d.jenis;
}
