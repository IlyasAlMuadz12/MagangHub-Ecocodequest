'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LEVELS } from '@/lib/game/levels.ts';
import { klaimSertifikat } from '@/lib/api';
import type { DataSertifikat } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useWajibMasuk } from '@/components/useWajibMasuk';
import { Ikon, IKON_D, Logo } from '@/components/gambar';
import { Memuat, Tombol } from '@/components/ui';

function DaunSudut({ kelas }: { kelas: string }) {
  return (
    <svg width="70" height="70" viewBox="0 0 48 48" className={`absolute ${kelas}`} aria-hidden="true">
      <path d="M6 42C4 22 16 8 42 6c0 22-12 34-30 34" fill="#4FAF66" stroke="#14342B" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M6 42C16 30 26 22 36 12" fill="none" stroke="#14342B" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function MiniTong({ badan, tutup, label }: { badan: string; tutup: string; label: string }) {
  return (
    <svg width="54" height="60" viewBox="0 0 64 70" role="img" aria-label={label}>
      <rect x="6" y="4" width="52" height="12" rx="5" fill={tutup} stroke="#14342B" strokeWidth="3" />
      <path d="M10 16h44l-4 50H14z" fill={badan} stroke="#14342B" strokeWidth="3.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function HalamanSertifikat() {
  const menunggu = useWajibMasuk();
  const { progres, profil } = useAuth();
  const [data, setData] = useState<DataSertifikat | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const semuaSelesai = LEVELS.every((l) => (progres[l.id]?.bintang ?? 0) >= 1);

  useEffect(() => {
    if (menunggu || !semuaSelesai) return;
    let batal = false;
    klaimSertifikat()
      .then((d) => {
        if (!batal) setData(d);
      })
      .catch((e: Error) => {
        if (!batal) setGalat(e.message);
      });
    return () => {
      batal = true;
    };
  }, [menunggu, semuaSelesai]);

  if (menunggu) return <Memuat />;

  if (!semuaSelesai) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-display text-3xl font-bold">Sertifikat belum terbuka</p>
        <p className="text-lg font-bold">Selesaikan semua {LEVELS.length} level untuk mengambil sertifikatmu.</p>
        <Link href="/peta" className="rounded-2xl border-[3px] border-ink bg-kuning px-6 py-3 text-xl font-extrabold">Kembali ke Peta</Link>
      </main>
    );
  }
  if (galat) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p role="alert" className="text-xl font-bold text-merah-tua">{galat}</p>
        <Link href="/peta" className="rounded-2xl border-[3px] border-ink bg-kuning px-6 py-3 text-xl font-extrabold">Kembali ke Peta</Link>
      </main>
    );
  }
  if (!data) return <Memuat teks="Menyiapkan sertifikat..." />;

  const tanggal = new Date(data.diterbitkanAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const kelasSekolah = [data.kelas ? `Kelas ${data.kelas}` : '', data.namaSekolah ?? ''].filter(Boolean).join(' · ');

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-mint px-4 py-8">
      <div className="w-full max-w-[1059px] overflow-x-auto">
        <div className="area-cetak relative mx-auto box-border h-[720px] w-[1059px] rounded-[20px] border-8 border-hijau bg-white p-3.5">
          <div className="relative box-border flex h-full w-full flex-col items-center justify-between rounded-xl border-[3px] border-kuning px-14 py-7">
            <DaunSudut kelas="left-2.5 top-2.5" />
            <DaunSudut kelas="right-2.5 top-2.5 -scale-x-100" />
            <DaunSudut kelas="bottom-2.5 left-2.5 -scale-y-100" />
            <DaunSudut kelas="bottom-2.5 right-2.5 -scale-100" />

            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2.5">
                <Logo ukuran={40} />
                <span className="font-display text-[26px] font-bold">EcoCode Quest</span>
              </div>
              <h1 className="mt-1.5 font-display text-[58px] font-bold leading-[1.05] text-hijau">Sertifikat Kelulusan</h1>
              <p className="text-[22px] font-extrabold text-ink-lembut">Pahlawan Pilah Sampah</p>
            </div>

            <div className="flex w-full flex-col items-center gap-2">
              <p className="text-[19px] font-bold">Diberikan dengan bangga kepada</p>
              <div className="w-[70%] border-b-4 border-ink pb-1 text-center">
                <span className="font-display text-[50px] font-semibold">{data.namaPanggilan || profil?.namaPanggilan}</span>
              </div>
              {kelasSekolah && <p className="mt-1 text-lg font-bold text-ink-lembut">{kelasSekolah}</p>}
              <p className="mt-2 max-w-[760px] text-center text-xl font-bold leading-normal">
                telah menyelesaikan seluruh {LEVELS.length} level EcoCode Quest. Ia berhasil menyusun blok perintah untuk memilah sampah organik, anorganik, dan B3 ke tong yang tepat.
              </p>
            </div>

            <div className="flex items-center justify-center gap-7">
              <MiniTong badan="#187A41" tutup="#0F5A2F" label="Tong organik" />
              <MiniTong badan="#F6C02B" tutup="#C48F0A" label="Tong anorganik" />
              <div className="flex size-28 flex-col items-center justify-center rounded-full border-[5px] border-ink bg-kuning shadow-[0_0_0_6px_#fff,0_0_0_9px_var(--color-ink)]">
                <svg width="46" height="46" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="#fff" stroke="#14342B" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                <span className="font-display text-[17px] font-bold leading-tight">{LEVELS.length} Level</span>
              </div>
              <MiniTong badan="#D93A32" tutup="#A52A23" label="Tong B3" />
            </div>

            <div className="flex w-full items-end justify-between gap-6">
              <div className="w-[260px] text-center">
                <div className="border-b-[3px] border-ink pb-1 text-[19px] font-extrabold">{tanggal}</div>
                <div className="mt-1 text-[15px] font-bold text-ink-lembut">Tanggal selesai</div>
              </div>
              <div className="text-center text-base font-extrabold">
                {data.totalBintang} dari {LEVELS.length * 4} bintang
                <div className="mt-1 text-xs font-bold text-ink-lembut">Kode: {data.kode}</div>
              </div>
              <div className="w-[260px] text-center">
                <div className="h-[29px] border-b-[3px] border-ink" />
                <div className="mt-1 text-[15px] font-bold text-ink-lembut">Guru pendamping</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tanpa-cetak flex flex-wrap justify-center gap-3.5">
        <Tombol varian="kuning" besar onClick={() => window.print()}>
          <Ikon d={IKON_D.unduh} tebal={2.6} />
          Unduh Sertifikat
        </Tombol>
        <Link href="/peta" className="inline-flex min-h-14 items-center rounded-2xl border-[3px] border-ink bg-white px-6 text-lg font-extrabold">Kembali ke Peta</Link>
      </div>
      <p className="tanpa-cetak max-w-lg text-center text-sm font-bold text-ink-lembut">Pada jendela cetak, pilih &quot;Simpan sebagai PDF&quot; dan atur kertas ke A4 lanskap.</p>
    </main>
  );
}
