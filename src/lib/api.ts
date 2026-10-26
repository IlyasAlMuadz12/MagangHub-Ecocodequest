import { supabase } from './supabase';
import type { Program } from './game/types.ts';
import { bersihkan } from './pengaturan.ts';
import type { ProgresMentah, SiswaMentah } from './guru.ts';
import type { Pengaturan, Tersimpan } from './pengaturan.ts';

export type { Tema, Pengaturan } from './pengaturan.ts';

export interface Profil {
  id: string;
  username: string;
  namaPanggilan: string;
  kelas: number | null;
  namaSekolah: string | null;
  peran: 'siswa' | 'guru';
}
export interface Progres {
  levelId: number;
  bintang: number;
  skor: number;
  waktuTerbaikDetik: number | null;
  langkahTerbaik: number | null;
}
export interface BarisPeringkat {
  peringkat: number;
  namaPanggilan: string;
  kelas: number | null;
  levelSelesai: number;
  totalBintang: number;
  totalWaktuDetik: number;
  totalSkor: number;
  adalahSaya: boolean;
}
export interface HasilPercobaan {
  bintang: number;
  skor: number;
  rekorBaru: boolean;
}
export interface DataSertifikat {
  kode: string;
  totalBintang: number;
  diterbitkanAt: string;
  namaPanggilan: string;
  kelas: number | null;
  namaSekolah: string | null;
}

/** Siswa SD login dengan nama pengguna; Supabase Auth membutuhkan email, jadi dipetakan. */
const DOMAIN = 'ecocode.siswa';
export const POLA_USERNAME = /^[a-z0-9_.]{3,30}$/;

export function keEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${DOMAIN}`;
}

function terjemahkan(pesan: string): string {
  const p = pesan.toLowerCase();
  if (p.includes('invalid login')) return 'Nama pengguna atau kata sandi salah.';
  if (p.includes('already registered') || p.includes('already been registered')) return 'Nama pengguna ini sudah dipakai. Coba nama lain.';
  if (p.includes('password') && p.includes('6')) return 'Kata sandi minimal 6 karakter.';
  if (p.includes('rate limit')) return 'Terlalu sering mencoba. Tunggu sebentar, lalu coba lagi.';
  if (p.includes('terkunci')) return 'Level ini masih terkunci.';
  if (p.includes('failed to fetch') || p.includes('network')) return 'Tidak bisa terhubung ke internet.';
  return pesan;
}

export async function daftar(a: { username: string; sandi: string; namaPanggilan: string; kelas: 5 | 6; namaSekolah?: string }): Promise<void> {
  if (!POLA_USERNAME.test(a.username.trim().toLowerCase())) {
    throw new Error('Nama pengguna 3 sampai 30 karakter: huruf kecil, angka, titik, atau garis bawah.');
  }
  const { error } = await supabase.auth.signUp({
    email: keEmail(a.username),
    password: a.sandi,
    options: {
      data: {
        username: a.username.trim().toLowerCase(),
        nama_panggilan: a.namaPanggilan.trim(),
        kelas: String(a.kelas),
        nama_sekolah: a.namaSekolah?.trim() ?? '',
      },
    },
  });
  if (error) throw new Error(terjemahkan(error.message));
}

export async function masuk(username: string, sandi: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: keEmail(username), password: sandi });
  if (error) throw new Error(terjemahkan(error.message));
}

export async function keluar(): Promise<void> {
  await supabase.auth.signOut();
}

export async function ambilProfil(): Promise<Profil | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', u.user.id).maybeSingle();
  if (error || !data) return null;
  return { id: data.id, username: data.username, namaPanggilan: data.nama_panggilan, kelas: data.kelas, namaSekolah: data.nama_sekolah, peran: data.peran };
}

export async function ambilPengaturan(): Promise<Tersimpan | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', u.user.id).maybeSingle();
  if (error) {
    console.warn('Gagal membaca pengaturan:', error.message);
    return null;
  }
  if (!data) return null;
  return {
    nilai: bersihkan({ tema: data.tema, bgmAktif: data.bgm_aktif, sfxAktif: data.sfx_aktif, tutorialSelesai: data.tutorial_selesai, musik: data.musik }),
    ts: Date.parse(data.updated_at) || 0,
  };
}

/** Menyimpan seluruh pengaturan. Mengembalikan false bila gagal (pengaturan tetap berlaku di perangkat). */
export async function simpanPengaturan(p: Pengaturan): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const dasar = {
    user_id: u.user.id,
    tema: p.tema,
    bgm_aktif: p.bgmAktif,
    sfx_aktif: p.sfxAktif,
    tutorial_selesai: p.tutorialSelesai,
    updated_at: new Date().toISOString(),
  };
  let { error } = await supabase.from('user_settings').upsert({ ...dasar, musik: p.musik }, { onConflict: 'user_id' });
  if (error && /musik/i.test(error.message)) {
    console.warn('Kolom "musik" belum ada di database. Jalankan supabase/03-migrasi-musik.sql. Pilihan lagu sementara hanya tersimpan di perangkat ini.');
    ({ error } = await supabase.from('user_settings').upsert(dasar, { onConflict: 'user_id' }));
  }
  if (error) {
    console.warn('Gagal menyimpan pengaturan:', error.message);
    return false;
  }
  return true;
}

export async function ambilProgres(): Promise<Record<number, Progres>> {
  const { data } = await supabase.from('level_progress').select('*');
  const hasil: Record<number, Progres> = {};
  for (const r of data ?? []) {
    hasil[r.level_id] = { levelId: r.level_id, bintang: r.bintang, skor: r.skor, waktuTerbaikDetik: r.waktu_terbaik_detik, langkahTerbaik: r.langkah_terbaik };
  }
  return hasil;
}

export async function kirimPercobaan(a: {
  levelId: number;
  berhasil: boolean;
  waktuDetik: number;
  langkah: number;
  kesalahan: number;
  pakaiUlangi: boolean;
  program: Program;
}): Promise<HasilPercobaan> {
  const { data, error } = await supabase.rpc('kirim_percobaan', {
    p_level_id: a.levelId,
    p_berhasil: a.berhasil,
    p_waktu_detik: Math.round(a.waktuDetik),
    p_langkah: a.langkah,
    p_kesalahan: a.kesalahan,
    p_pakai_ulangi: a.pakaiUlangi,
    p_program: a.program,
  });
  if (error) throw new Error(terjemahkan(error.message));
  const d = data as { bintang: number; skor: number; rekor_baru: boolean };
  return { bintang: d.bintang, skor: d.skor, rekorBaru: d.rekor_baru };
}

export async function ambilPeringkat(opsi: { levelId?: number; kelas?: number; batas?: number } = {}): Promise<BarisPeringkat[]> {
  const { data, error } = await supabase.rpc('papan_peringkat', {
    p_level_id: opsi.levelId ?? null,
    p_kelas: opsi.kelas ?? null,
    p_batas: opsi.batas ?? 20,
  });
  if (error) throw new Error(terjemahkan(error.message));
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    peringkat: Number(r.peringkat),
    namaPanggilan: String(r.nama_panggilan),
    kelas: (r.kelas as number | null) ?? null,
    levelSelesai: Number(r.level_selesai),
    totalBintang: Number(r.total_bintang),
    totalWaktuDetik: Number(r.total_waktu_detik),
    totalSkor: Number(r.total_skor),
    adalahSaya: Boolean(r.adalah_saya),
  }));
}

export async function klaimSertifikat(): Promise<DataSertifikat> {
  const { data, error } = await supabase.rpc('klaim_sertifikat');
  if (error) throw new Error(terjemahkan(error.message));
  const d = data as Record<string, unknown>;
  return {
    kode: String(d.kode),
    totalBintang: Number(d.total_bintang),
    diterbitkanAt: String(d.diterbitkan_at),
    namaPanggilan: String(d.nama_panggilan),
    kelas: (d.kelas as number | null) ?? null,
    namaSekolah: (d.nama_sekolah as string | null) ?? null,
  };
}

/* ---------- Dasbor guru ---------- */

type Halaman = PromiseLike<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;

/** Supabase membatasi 1000 baris per permintaan, jadi diambil per halaman sampai habis. */
async function ambilSemua(bangun: (dari: number, sampai: number) => Halaman): Promise<Record<string, unknown>[]> {
  const UKURAN = 1000;
  const semua: Record<string, unknown>[] = [];
  for (let dari = 0; ; dari += UKURAN) {
    const { data, error } = await bangun(dari, dari + UKURAN - 1);
    if (error) throw new Error(terjemahkan(error.message));
    const baris = data ?? [];
    semua.push(...baris);
    if (baris.length < UKURAN) break;
  }
  return semua;
}

/**
 * Data seluruh siswa untuk dasbor guru. Pembatasan ada di database (RLS): akun siswa yang memanggil
 * ini hanya akan mendapat datanya sendiri, hanya akun berperan "guru" yang mendapat semua siswa.
 */
export async function ambilDataGuru(): Promise<{ siswa: SiswaMentah[]; progres: ProgresMentah[] }> {
  const dataSiswa = await ambilSemua((dari, sampai) =>
    supabase.from('profiles').select('id, username, nama_panggilan, kelas, nama_sekolah').eq('peran', 'siswa').order('id').range(dari, sampai),
  );
  const dataProgres = await ambilSemua((dari, sampai) =>
    supabase
      .from('level_progress')
      .select('user_id, level_id, bintang, skor, waktu_terbaik_detik, percobaan, diperbarui_at')
      .order('user_id')
      .order('level_id')
      .range(dari, sampai),
  );
  return {
    siswa: dataSiswa.map((r) => ({
      id: String(r.id),
      username: String(r.username),
      namaPanggilan: String(r.nama_panggilan),
      kelas: typeof r.kelas === 'number' ? r.kelas : null,
      namaSekolah: typeof r.nama_sekolah === 'string' ? r.nama_sekolah : null,
    })),
    progres: dataProgres.map((r) => ({
      userId: String(r.user_id),
      levelId: Number(r.level_id),
      bintang: Number(r.bintang),
      skor: Number(r.skor),
      waktuTerbaikDetik: typeof r.waktu_terbaik_detik === 'number' ? r.waktu_terbaik_detik : null,
      percobaan: Number(r.percobaan),
      diperbarui: String(r.diperbarui_at),
    })),
  };
}
