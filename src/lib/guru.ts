/**
 * Logika dasbor guru (murni, tanpa React/Supabase, supaya mudah diuji).
 * Mengubah baris mentah profil dan level_progress menjadi ringkasan per siswa,
 * menentukan siapa yang tertinggal, menyaring, mengurutkan, dan membuat CSV.
 */

export const JUMLAH_LEVEL = 15;

export interface SiswaMentah {
  id: string;
  username: string;
  namaPanggilan: string;
  kelas: number | null;
  namaSekolah: string | null;
}

export interface ProgresMentah {
  userId: string;
  levelId: number;
  bintang: number;
  skor: number;
  waktuTerbaikDetik: number | null;
  percobaan: number;
  /** waktu terakhir siswa mencoba level ini (ISO) */
  diperbarui: string;
}

export interface RingkasanSiswa {
  id: string;
  username: string;
  namaPanggilan: string;
  kelas: number | null;
  namaSekolah: string | null;
  /** jumlah level yang sudah selesai (minimal 1 bintang) */
  levelSelesai: number;
  /** nomor level tertinggi yang sudah selesai (0 bila belum ada) */
  levelTertinggi: number;
  totalBintang: number;
  /** jumlah waktu terbaik dari level-level yang selesai (detik) */
  totalWaktuDetik: number;
  totalSkor: number;
  percobaan: number;
  /** waktu terakhir bermain (ms), null bila belum pernah mencoba */
  terakhirMain: number | null;
  /** indeks 0 = level 1; null = belum pernah dicoba */
  perLevel: (ProgresMentah | null)[];
}

export function ringkasSiswa(siswa: SiswaMentah[], progres: ProgresMentah[], jumlahLevel: number = JUMLAH_LEVEL): RingkasanSiswa[] {
  const peta = new Map<string, ProgresMentah[]>();
  for (const p of progres) {
    const daftar = peta.get(p.userId);
    if (daftar) daftar.push(p);
    else peta.set(p.userId, [p]);
  }
  return siswa.map((s) => {
    const perLevel: (ProgresMentah | null)[] = Array.from({ length: jumlahLevel }, () => null);
    for (const b of peta.get(s.id) ?? []) {
      if (b.levelId >= 1 && b.levelId <= jumlahLevel) perLevel[b.levelId - 1] = b;
    }
    let levelSelesai = 0;
    let levelTertinggi = 0;
    let totalBintang = 0;
    let totalWaktuDetik = 0;
    let totalSkor = 0;
    let percobaan = 0;
    let terakhirMain: number | null = null;
    perLevel.forEach((b, i) => {
      if (!b) return;
      percobaan += b.percobaan;
      const t = Date.parse(b.diperbarui);
      if (!Number.isNaN(t) && (terakhirMain === null || t > terakhirMain)) terakhirMain = t;
      if (b.bintang >= 1) {
        levelSelesai += 1;
        levelTertinggi = i + 1;
        totalBintang += b.bintang;
        totalSkor += b.skor;
        totalWaktuDetik += b.waktuTerbaikDetik ?? 0;
      }
    });
    return {
      id: s.id,
      username: s.username,
      namaPanggilan: s.namaPanggilan,
      kelas: s.kelas,
      namaSekolah: s.namaSekolah,
      levelSelesai,
      levelTertinggi,
      totalBintang,
      totalWaktuDetik,
      totalSkor,
      percobaan,
      terakhirMain,
      perLevel,
    };
  });
}

export function median(angka: number[]): number {
  if (angka.length === 0) return 0;
  const s = [...angka].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export type Status = 'selesai' | 'belum-mulai' | 'tertinggal' | 'aktif';

export interface StatusInfo {
  status: Status;
  alasan: string[];
}

export interface Aturan {
  /** tertinggal bila level selesainya sekian level di bawah median kelasnya */
  ambangLevel: number;
  /** tertinggal bila sekian hari atau lebih tidak bermain (dan belum selesai semua) */
  ambangHari: number;
}

export const ATURAN_AWAL: Aturan = { ambangLevel: 2, ambangHari: 7 };

const SEHARI = 86_400_000;

export function hariTidakMain(terakhir: number | null, sekarang: number): number | null {
  if (terakhir === null) return null;
  return Math.max(0, Math.floor((sekarang - terakhir) / SEHARI));
}

function angkaId(x: number): string {
  return String(Math.round(x * 10) / 10).replace('.', ',');
}

export function tentukanStatus(s: RingkasanSiswa, medianKelas: number, sekarang: number, a: Aturan, jumlahLevel: number = JUMLAH_LEVEL): StatusInfo {
  if (s.levelSelesai >= jumlahLevel) return { status: 'selesai', alasan: [] };
  if (s.terakhirMain === null) return { status: 'belum-mulai', alasan: ['Belum pernah bermain'] };
  const alasan: string[] = [];
  const selisih = medianKelas - s.levelSelesai;
  if (selisih >= a.ambangLevel) alasan.push(`${angkaId(selisih)} level di bawah median kelas`);
  const hari = hariTidakMain(s.terakhirMain, sekarang);
  if (hari !== null && hari >= a.ambangHari) alasan.push(`${hari} hari tidak bermain`);
  return alasan.length > 0 ? { status: 'tertinggal', alasan } : { status: 'aktif', alasan: [] };
}

export interface SiswaStatus extends RingkasanSiswa {
  info: StatusInfo;
  /** median level selesai pada kelasnya (hanya siswa yang sudah mulai) */
  medianKelas: number;
}

export function bangunDasbor(siswa: SiswaMentah[], progres: ProgresMentah[], sekarang: number, aturan: Aturan = ATURAN_AWAL): SiswaStatus[] {
  const ringkas = ringkasSiswa(siswa, progres);
  const perKelas = new Map<string, number[]>();
  for (const r of ringkas) {
    if (r.terakhirMain === null) continue; // median hanya dari siswa yang sudah mulai
    const kunci = String(r.kelas);
    const d = perKelas.get(kunci);
    if (d) d.push(r.levelSelesai);
    else perKelas.set(kunci, [r.levelSelesai]);
  }
  const medianPerKelas = new Map<string, number>();
  perKelas.forEach((v, k) => medianPerKelas.set(k, median(v)));
  return ringkas.map((r) => {
    const m = medianPerKelas.get(String(r.kelas)) ?? 0;
    return { ...r, medianKelas: m, info: tentukanStatus(r, m, sekarang, aturan) };
  });
}

export interface RingkasanKelas {
  jumlah: number;
  selesai: number;
  aktif: number;
  tertinggal: number;
  belumMulai: number;
  /** rata-rata level selesai, satu desimal */
  rataLevel: number;
}

export function hitungRingkasanKelas(d: SiswaStatus[]): RingkasanKelas {
  const hitung = (st: Status) => d.filter((s) => s.info.status === st).length;
  const jumlah = d.length;
  const rata = jumlah === 0 ? 0 : d.reduce((a, s) => a + s.levelSelesai, 0) / jumlah;
  return {
    jumlah,
    selesai: hitung('selesai'),
    aktif: hitung('aktif'),
    tertinggal: hitung('tertinggal'),
    belumMulai: hitung('belum-mulai'),
    rataLevel: Math.round(rata * 10) / 10,
  };
}

export interface Saringan {
  kelas: number | null;
  cari: string;
  /** hanya yang tertinggal atau belum mulai */
  hanyaPerhatian: boolean;
}

export function saring(d: SiswaStatus[], f: Saringan): SiswaStatus[] {
  const q = f.cari.trim().toLowerCase();
  return d.filter(
    (s) =>
      (f.kelas === null || s.kelas === f.kelas) &&
      (q === '' || s.namaPanggilan.toLowerCase().includes(q) || s.username.toLowerCase().includes(q)) &&
      (!f.hanyaPerhatian || s.info.status === 'tertinggal' || s.info.status === 'belum-mulai'),
  );
}

export type KolomUrut = 'perhatian' | 'nama' | 'level' | 'bintang' | 'waktu' | 'terakhir';

const URUTAN_STATUS: Record<Status, number> = { tertinggal: 0, 'belum-mulai': 1, aktif: 2, selesai: 3 };

export function urutkan(d: SiswaStatus[], kolom: KolomUrut, naik: boolean): SiswaStatus[] {
  const arah = naik ? 1 : -1;
  const nama = (a: SiswaStatus, b: SiswaStatus) => a.namaPanggilan.localeCompare(b.namaPanggilan, 'id');
  const bandingkan = (a: SiswaStatus, b: SiswaStatus): number => {
    switch (kolom) {
      case 'perhatian':
        return URUTAN_STATUS[a.info.status] - URUTAN_STATUS[b.info.status] || a.levelSelesai - b.levelSelesai;
      case 'nama':
        return nama(a, b);
      case 'level':
        return a.levelTertinggi - b.levelTertinggi;
      case 'bintang':
        return a.totalBintang - b.totalBintang;
      case 'waktu':
        return a.totalWaktuDetik - b.totalWaktuDetik;
      case 'terakhir':
        return (a.terakhirMain ?? -Infinity) === (b.terakhirMain ?? -Infinity) ? 0 : (a.terakhirMain ?? -Infinity) < (b.terakhirMain ?? -Infinity) ? -1 : 1;
    }
  };
  return [...d].sort((a, b) => arah * bandingkan(a, b) || nama(a, b));
}

export function formatWaktu(detik: number): string {
  const d = Math.max(0, Math.round(detik));
  const jam = Math.floor(d / 3600);
  const menit = Math.floor((d % 3600) / 60);
  const sisa = d % 60;
  const dua = (n: number) => String(n).padStart(2, '0');
  return jam > 0 ? `${jam}:${dua(menit)}:${dua(sisa)}` : `${dua(menit)}:${dua(sisa)}`;
}

export function formatTerakhir(terakhir: number | null, sekarang: number): string {
  const hari = hariTidakMain(terakhir, sekarang);
  if (hari === null) return 'Belum pernah';
  if (hari === 0) return 'Hari ini';
  if (hari === 1) return 'Kemarin';
  if (hari < 14) return `${hari} hari lalu`;
  if (hari < 60) return `${Math.floor(hari / 7)} minggu lalu`;
  return `${Math.floor(hari / 30)} bulan lalu`;
}

export const NAMA_STATUS: Record<Status, string> = {
  selesai: 'Selesai semua',
  aktif: 'Aktif',
  tertinggal: 'Tertinggal',
  'belum-mulai': 'Belum mulai',
};

/** Sel CSV aman: tanda kutip digandakan; awalan = + - @ diberi apostrof agar tidak dibaca sebagai rumus di Excel. */
export function selCsv(nilai: string | number | null): string {
  let t = nilai === null ? '' : String(nilai);
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export function buatCsv(d: SiswaStatus[], sekarang: number): string {
  const kepala = ['Nama panggilan', 'Nama pengguna', 'Kelas', 'Level tertinggi', 'Level selesai', 'Total bintang', 'Total waktu (detik)', 'Total poin', 'Terakhir main', 'Status', 'Keterangan'];
  const baris = d.map((s) =>
    [
      s.namaPanggilan,
      s.username,
      s.kelas,
      s.levelTertinggi,
      s.levelSelesai,
      s.totalBintang,
      s.totalWaktuDetik,
      s.totalSkor,
      s.terakhirMain === null ? '' : new Date(s.terakhirMain).toISOString().slice(0, 10),
      NAMA_STATUS[s.info.status],
      s.info.alasan.join('; '),
    ]
      .map(selCsv)
      .join(','),
  );
  void sekarang;
  return [kepala.map(selCsv).join(','), ...baris].join('\r\n');
}
