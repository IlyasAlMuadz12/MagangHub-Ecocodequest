'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useWajibMasuk } from '@/components/useWajibMasuk';
import { DasborGuru } from '@/components/DasborGuru';
import { Memuat } from '@/components/ui';

export default function HalamanGuru() {
  const router = useRouter();
  const menunggu = useWajibMasuk();
  const { profil, keluar } = useAuth();

  if (menunggu) return <Memuat />;

  // Pembatas sebenarnya ada di database (RLS); pemeriksaan ini hanya agar siswa tidak melihat halaman kosong.
  if (profil?.peran !== 'guru') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-mint p-6 text-center">
        <p className="font-display text-3xl font-bold">Halaman ini khusus guru</p>
        <p className="max-w-md text-lg font-bold text-ink-lembut">Akunmu adalah akun siswa. Minta guru atau admin untuk mengubah peran akunmu bila kamu seorang guru.</p>
        <Link href="/peta" className="rounded-2xl border-[3px] border-ink bg-kuning px-6 py-3 text-xl font-extrabold shadow-[0_4px_0_var(--color-ink)]">
          Kembali ke Peta
        </Link>
      </main>
    );
  }

  return <DasborGuru namaGuru={profil.namaPanggilan} onKeluar={() => void keluar().then(() => router.replace('/masuk'))} />;
}
