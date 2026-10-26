'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LEVELS } from '@/lib/game/levels.ts';
import { KATALOG } from '@/lib/game/catalog.ts';
import type { Dunia, JenisSampah, Level } from '@/lib/game/types.ts';
import { TEMA } from '@/lib/tema';
import { sfx } from '@/lib/audio';
import { useAuth } from '@/components/AuthProvider';
import { useWajibMasuk } from '@/components/useWajibMasuk';
import { Adegan, Bintang, BarisBintang, IKON_D, Logo } from '@/components/gambar';
import { Memuat, Tombol, TombolIkon } from '@/components/ui';
import { KontrolMusik } from '@/components/KontrolMusik';
import { PilihTema } from '@/components/PilihTema';
import { Peringkat } from '@/components/Peringkat';
import { Tutorial } from '@/components/Tutorial';

const DUNIA: { kunci: Dunia; nama: string; deskripsi: string; judulDaftar: string; latar: string; dari: number; sampai: number }[] = [
  { kunci: 'rumah', nama: 'Di Rumah', deskripsi: 'Sampah dapur dan ruang keluarga', judulDaftar: 'Sampah di rumah, per level', latar: '#FFF0C2', dari: 1, sampai: 5 },
  { kunci: 'sekolah', nama: 'Di Sekolah', deskripsi: 'Sampah kelas, kantin, dan halaman', judulDaftar: 'Sampah di sekolah, per level', latar: '#D3E9FB', dari: 6, sampai: 10 },
  { kunci: 'hutan', nama: 'Di Hutan', deskripsi: 'Sampah di alam terbuka', judulDaftar: 'Sampah di hutan, per level', latar: '#D6F2DD', dari: 11, sampai: 15 },
];

const KOLOM_JENIS: { jenis: JenisSampah; label: string; bg: string; fg: string; angka: string }[] = [
  { jenis: 'organik', label: 'Organik', bg: '#187A41', fg: '#FFFFFF', angka: '#187A41' },
  { jenis: 'anorganik', label: 'Anorganik', bg: '#F6C02B', fg: '#14342B', angka: '#8A6200' },
  { jenis: 'b3', label: 'B3', bg: '#D93A32', fg: '#FFFFFF', angka: '#B02A23' },
];

function namaSampah(level: Level, jenis: JenisSampah): string {
  const s = level.config.sampah.find((x) => KATALOG[x.item].jenis === jenis);
  return s ? KATALOG[s.item].nama : '';
}

export default function HalamanPeta() {
  const router = useRouter();
  const menunggu = useWajibMasuk();
  const { profil, pengaturan, progres, ubahPengaturan, keluar } = useAuth();
  const [peringkat, setPeringkat] = useState(false);
  const [tutorial, setTutorial] = useState(false);

  const selesai = (n: number) => (progres[n]?.bintang ?? 0) >= 1;
  const jumlahSelesai = LEVELS.filter((l) => selesai(l.id)).length;
  const levelBerikutnya = LEVELS.find((l) => !selesai(l.id))?.id ?? null;
  const totalBintang = useMemo(() => LEVELS.reduce((a, l) => a + (progres[l.id]?.bintang ?? 0), 0), [progres]);
  const semuaSelesai = jumlahSelesai === LEVELS.length;

  if (menunggu || !pengaturan) return <Memuat />;

  const tampilkanTutorial = tutorial || !pengaturan.tutorialSelesai;
  const tema = pengaturan.tema;

  return (
    <div className="min-h-screen" style={{ background: TEMA[tema].latar }}>
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col gap-6 px-6 pb-10 pt-8 sm:px-10">
      {tampilkanTutorial && (
        <Tutorial
          onSelesai={() => {
            setTutorial(false);
            if (!pengaturan.tutorialSelesai) void ubahPengaturan({ tutorialSelesai: true });
          }}
        />
      )}
      {peringkat && <Peringkat onTutup={() => setPeringkat(false)} levelSaatIni={levelBerikutnya ?? 15} kelasSaya={profil?.kelas ?? null} />}

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 rounded-[20px] border-[3px] border-ink bg-white px-4 py-2">
          <Logo ukuran={44} />
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight">Peta Misi</h1>
            <p className="font-bold text-ink-lembut">
              Halo, {profil?.namaPanggilan ?? 'Teman'}!{profil?.kelas ? ` Kelas ${profil.kelas}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-h-12 items-center gap-2 rounded-full border-[3px] border-ink bg-white px-4 text-[17px] font-extrabold">
            <Bintang isi ukuran={24} />
            <span>{totalBintang} dari {LEVELS.length * 4} bintang</span>
          </div>
          {profil?.peran === 'guru' && (
            <Link href="/guru" onClick={() => sfx('klik')} className="inline-flex min-h-12 items-center rounded-2xl border-[3px] border-ink bg-kuning px-5 text-lg font-extrabold shadow-[0_4px_0_var(--color-ink)]">
              Dasbor Guru
            </Link>
          )}
          <Tombol onClick={() => setPeringkat(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14342B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={IKON_D.piala} /></svg>
            Peringkat
          </Tombol>
          <TombolIkon label="Cara bermain" d="M12 17h.01M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" onClick={() => setTutorial(true)} />
          <KontrolMusik />
          <PilihTema />
          <Tombol onClick={() => void keluar().then(() => router.replace('/masuk'))}>Keluar</Tombol>
        </div>
      </header>

      <section className="flex flex-wrap items-center gap-4 rounded-[20px] border-[3px] border-ink bg-white px-5 py-4">
        <span className="text-[17px] font-extrabold">Level selesai: {jumlahSelesai} dari {LEVELS.length}</span>
        <div className="h-[18px] min-w-60 flex-1 overflow-hidden rounded-full border-[3px] border-ink bg-mint" role="progressbar" aria-valuemin={0} aria-valuemax={LEVELS.length} aria-valuenow={jumlahSelesai}>
          <div className="h-full bg-hijau" style={{ width: `${(jumlahSelesai / LEVELS.length) * 100}%` }} />
        </div>
        {semuaSelesai ? (
          <Link href="/sertifikat" onClick={() => sfx('klik')} className="rounded-2xl border-[3px] border-ink bg-kuning px-5 py-2 text-lg font-extrabold shadow-[0_4px_0_var(--color-ink)]">
            Ambil Sertifikat
          </Link>
        ) : (
          <span className="text-[15px] font-bold text-ink-lembut">Selesaikan semua level untuk membuka Sertifikat</span>
        )}
      </section>

      <div className="flex flex-col gap-5">
        {DUNIA.map((d) => {
          const levels = LEVELS.filter((l) => l.id >= d.dari && l.id <= d.sampai);
          return (
            <section key={d.kunci} className="flex flex-wrap gap-6 rounded-3xl border-[3px] border-ink px-6 py-5" style={{ background: d.latar }}>
              <div className="flex max-w-full shrink basis-[300px] flex-col gap-3">
                <div>
                  <h2 className="font-display text-3xl font-bold leading-tight">{d.nama}</h2>
                  <p className="mt-1 text-[15px] font-bold text-ink-lembut">Level {d.dari} sampai {d.sampai} · {d.deskripsi}</p>
                </div>
                <div className="overflow-hidden rounded-[18px] border-[3px] border-ink leading-[0]">
                  <Adegan dunia={d.kunci} />
                </div>
              </div>

              <div className="flex min-w-0 flex-1 basis-[520px] flex-col gap-5">
                <div className="flex flex-wrap gap-x-[18px] gap-y-5">
                  {levels.map((l) => {
                    const bintang = progres[l.id]?.bintang ?? 0;
                    const sudah = selesai(l.id);
                    const sekarang = l.id === levelBerikutnya;
                    const buka = sudah || sekarang;
                    return (
                      <div key={l.id} className="flex w-[88px] flex-col items-center gap-1.5">
                        {buka ? (
                          <button
                            aria-label={sudah ? `Level ${l.id}, ${l.judul}, selesai, ${bintang} bintang` : `Level ${l.id}, ${l.judul}, level berikutnya`}
                            onClick={() => {
                              sfx('klik');
                              router.push(`/main/${l.id}`);
                            }}
                            className={`size-[72px] rounded-full border-[3px] border-ink font-display text-3xl font-bold ${
                              sudah ? 'bg-hijau text-white shadow-[0_4px_0_var(--color-ink)]' : 'bg-kuning text-ink shadow-[0_0_0_6px_#fff,0_0_0_9px_var(--color-ink)]'
                            }`}
                          >
                            {l.id}
                          </button>
                        ) : (
                          <button
                            disabled
                            aria-label={`Level ${l.id}, terkunci`}
                            className="flex size-[72px] flex-col items-center justify-center rounded-full border-[3px] border-dashed border-[#4A5A53] bg-[#C9D3CE] text-[#4A5A53]"
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A5A53" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={IKON_D.kunci} /></svg>
                            <span className="font-display text-[15px] font-bold leading-none">{l.id}</span>
                          </button>
                        )}
                        <span className="text-center text-xs font-bold leading-tight text-ink-lembut">{l.judul}</span>
                        <BarisBintang jumlah={bintang} />
                      </div>
                    );
                  })}
                </div>

                <div>
                  <h3 className="mb-2 text-base font-extrabold">{d.judulDaftar}</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {KOLOM_JENIS.map((k) => (
                      <div key={k.jenis} className="min-w-0 flex-1 basis-[150px] rounded-[14px] border-[3px] border-ink bg-white px-2.5 py-2">
                        <div className="mb-1.5 inline-block rounded-full px-3 text-sm font-extrabold" style={{ background: k.bg, color: k.fg }}>
                          {k.label}
                        </div>
                        {levels.map((l) => (
                          <div key={l.id} className="flex gap-2 text-sm font-bold leading-normal">
                            <b className="min-w-[18px] shrink-0" style={{ color: k.angka }}>{l.id}</b>
                            <span>{namaSampah(l, k.jenis)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-[560px] rounded-2xl border-[3px] border-ink bg-white px-4 py-2 text-[15px] font-bold text-ink-lembut">Bintang: 1 selesai, 2 pakai Ulangi, 3 tanpa salah, 4 jalur terpendek tanpa salah.</p>
        {levelBerikutnya && (
          <Tombol varian="kuning" besar onClick={() => router.push(`/main/${levelBerikutnya}`)}>
            Main Level {levelBerikutnya}
          </Tombol>
        )}
      </footer>
    </main>
    </div>
  );
}
