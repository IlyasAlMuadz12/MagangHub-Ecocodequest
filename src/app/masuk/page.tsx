'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { daftar, masuk } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Logo, TongSvg, RobotSvg } from '@/components/gambar';
import { Tombol } from '@/components/ui';

type Mode = 'masuk' | 'daftar';

const MASUKAN = 'min-h-[52px] w-full rounded-2xl border-[3px] border-ink bg-white px-4 text-lg font-bold text-ink';

export default function HalamanMasuk() {
  const router = useRouter();
  const { memuat, sudahMasuk } = useAuth();
  const [mode, setMode] = useState<Mode>('masuk');
  const [username, setUsername] = useState('');
  const [sandi, setSandi] = useState('');
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState<5 | 6>(5);
  const [sekolah, setSekolah] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    if (!memuat && sudahMasuk) router.replace('/peta');
  }, [memuat, sudahMasuk, router]);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setGalat(null);
    setSibuk(true);
    try {
      if (mode === 'daftar') {
        await daftar({ username, sandi, namaPanggilan: nama || username, kelas, namaSekolah: sekolah });
        await masuk(username, sandi);
      } else {
        await masuk(username, sandi);
      }
      router.replace('/peta');
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Terjadi masalah. Coba lagi.');
    } finally {
      setSibuk(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-wrap items-center justify-center gap-12 bg-mint p-6 sm:p-12">
      <div className="flex max-w-[560px] flex-1 basis-[440px] flex-col gap-5">
        <div className="flex items-center gap-3">
          <Logo ukuran={48} />
          <span className="font-display text-4xl font-bold tracking-tight">EcoCode Quest</span>
        </div>
        <p className="text-xl font-bold leading-relaxed text-ink-lembut">Susun blok perintah, ajak si robot memilah sampah, dan jadilah Pahlawan Lingkungan!</p>
        <div className="flex items-end justify-center gap-4 rounded-[28px] border-[3px] border-ink bg-white p-5">
          <RobotSvg hadap="kanan" className="w-32" />
          <TongSvg jenis="organik" className="w-24" />
          <TongSvg jenis="anorganik" className="w-24" />
          <TongSvg jenis="b3" className="w-24" />
        </div>
      </div>

      <form onSubmit={kirim} className="flex max-w-[460px] flex-1 basis-[380px] flex-col gap-5 rounded-[28px] border-[3px] border-ink bg-white p-8 shadow-[0_8px_0_var(--color-ink)]">
        <div className="flex gap-1.5 rounded-full bg-mint p-1.5" role="tablist">
          {(['masuk', 'daftar'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setGalat(null);
              }}
              className={`min-h-12 flex-1 rounded-full text-lg font-extrabold ${mode === m ? 'bg-hijau text-white' : 'text-ink'}`}
            >
              {m === 'masuk' ? 'Masuk' : 'Daftar'}
            </button>
          ))}
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold">Halo, Teman Bumi!</h1>
          <p className="font-bold text-ink-lembut">Yuk lanjutkan misi memilah sampahmu.</p>
        </div>

        {mode === 'daftar' && (
          <>
            <label className="flex flex-col gap-1.5 font-extrabold">
              Nama panggilan
              <input className={MASUKAN} value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Rani" maxLength={30} required />
            </label>
            <label className="flex flex-col gap-1.5 font-extrabold">
              Kelas
              <select className={MASUKAN} value={kelas} onChange={(e) => setKelas(Number(e.target.value) === 6 ? 6 : 5)}>
                <option value={5}>Kelas 5</option>
                <option value={6}>Kelas 6</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 font-extrabold">
              Nama sekolah (boleh dikosongkan)
              <input className={MASUKAN} value={sekolah} onChange={(e) => setSekolah(e.target.value)} maxLength={60} />
            </label>
          </>
        )}

        <label className="flex flex-col gap-1.5 font-extrabold">
          Nama pengguna
          <input
            className={MASUKAN}
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="huruf kecil dan angka, mis. rani5"
            autoComplete="username"
            autoCapitalize="none"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 font-extrabold">
          Kata sandi
          <input
            className={MASUKAN}
            type="password"
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
            placeholder="Minimal 6 karakter"
            autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
        </label>

        {galat && (
          <p role="alert" className="rounded-2xl border-[3px] border-merah bg-[#FADAD7] px-4 py-2 font-bold text-merah-tua">
            {galat}
          </p>
        )}

        <Tombol type="submit" varian="kuning" besar disabled={sibuk}>
          {sibuk ? 'Tunggu sebentar...' : mode === 'masuk' ? 'Masuk dan Main' : 'Buat Akun dan Mulai'}
        </Tombol>
        <p className="text-center text-[15px] font-bold text-ink-lembut">Lupa kata sandi? Tanyakan kepada gurumu.</p>
      </form>
    </main>
  );
}
