'use client';

import { useEffect, useState } from 'react';
import type { JenisSampah } from '@/lib/game/types.ts';
import { BarisBintang, IKON_D, Ikon, NAMA_JENIS, RobotSvg, TongSvg } from './gambar';
import { LANGKAH_TUTORIAL } from '@/lib/narasi.ts';
import { Modal, Tombol } from './ui';
import { useSuara } from './useSuara';

const CONTOH: { jenis: JenisSampah; ikon: string; nama: string; kata: string }[] = [
  { jenis: 'organik', ikon: '🍌', nama: 'Kulit pisang', kata: 'Berasal dari makhluk hidup dan bisa membusuk, seperti daun dan sisa makanan.' },
  { jenis: 'anorganik', ikon: '🧴', nama: 'Botol plastik', kata: 'Tidak mudah membusuk, seperti plastik, kaleng, kaca, dan kertas.' },
  { jenis: 'b3', ikon: '🔋', nama: 'Baterai bekas', kata: 'Berbahaya dan beracun, seperti baterai, lampu bekas, dan elektronik rusak.' },
];

function Langkah({ i }: { i: number }) {
  if (i === 0) {
    return (
      <div className="space-y-3">
        <p className="text-lg font-bold">Susun blok perintah supaya robot bergerak. Blok bisa ditempel satu per satu, seperti Scratch.</p>
        <ul className="space-y-2 text-lg font-bold">
          <li className="flex items-center gap-3"><span className="inline-flex min-w-36 items-center gap-2 rounded-lg bg-biru px-3 py-2 text-white"><Ikon d={IKON_D.maju} warna="#fff" tebal={2.8} />Maju</span> robot melangkah 1 petak.</li>
          <li className="flex items-center gap-3"><span className="inline-flex min-w-36 items-center gap-2 rounded-lg bg-oranye px-3 py-2 text-white"><Ikon d={IKON_D.ambil} warna="#fff" tebal={2.8} />Ambil</span> mengambil sampah di petak yang sedang diinjak robot. Ambil semua dulu!</li>
          <li className="flex items-center gap-3"><span className="inline-flex min-w-36 items-center gap-2 rounded-lg bg-oranye px-3 py-2 text-white"><Ikon d={IKON_D.buang} warna="#fff" tebal={2.8} />Buang</span> di petak tong, kamu diminta memilih sampah yang cocok.</li>
          <li className="flex items-center gap-3"><span className="inline-flex min-w-36 items-center gap-2 rounded-lg bg-ungu px-3 py-2 text-white"><Ikon d={IKON_D.ulangi} warna="#fff" tebal={2.8} />Ulangi n</span> mengulang blok di dalamnya.</li>
        </ul>
        <p className="text-base font-bold">Robot selalu mulai dari START (kiri atas) dan harus berakhir di FINIS (kanan bawah). Masuk ke petak sampah lalu pakai Ambil. Setelah semua sampah diambil, masuk ke petak tong lalu pakai Buang: kamu akan ditanya, mana sampah yang cocok dengan tong itu.</p>
        <p className="text-base font-bold text-ink-lembut">Seret blok dari Kotak Blok ke Programmu, atau ketuk blok untuk menambahkannya.</p>
      </div>
    );
  }
  if (i === 1) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {CONTOH.map((c) => (
          <div key={c.jenis} className="rounded-2xl border-[3px] border-ink bg-kertas p-3 text-center">
            <div className="text-5xl" aria-hidden="true">{c.ikon}</div>
            <p className="font-display text-xl font-bold">{NAMA_JENIS[c.jenis]}</p>
            <p className="text-sm font-bold text-ink-lembut">Contoh: {c.nama}</p>
            <p className="mt-1 text-sm font-bold">{c.kata}</p>
          </div>
        ))}
      </div>
    );
  }
  if (i === 2) {
    return (
      <div className="space-y-3">
        <p className="text-lg font-bold">Tong hijau untuk sampah organik, tong kuning untuk anorganik, dan tong merah untuk B3. Saat membuang, kamu akan ditanya sampah mana yang cocok dengan tong itu.</p>
        <div className="grid grid-cols-3 gap-3">
          {(['organik', 'anorganik', 'b3'] as JenisSampah[]).map((j) => (
            <div key={j} className="text-center">
              <TongSvg jenis={j} className="mx-auto w-24" />
              <p className="font-extrabold">{j === 'organik' ? 'Hijau' : j === 'anorganik' ? 'Kuning' : 'Merah'}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (i === 3) {
    return (
      <div className="space-y-3">
        <p className="text-lg font-bold">Panah merah menunjukkan arah robot. Maju selalu mengikuti arah panah.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border-[3px] border-ink bg-kertas p-3 text-center">
            <RobotSvg hadap="kanan" className="mx-auto w-24" />
            <p className="font-bold">Awalnya menghadap kanan. Maju berarti bergerak dari K1 ke K6.</p>
          </div>
          <div className="rounded-2xl border-[3px] border-ink bg-kertas p-3 text-center">
            <RobotSvg hadap="bawah" className="mx-auto w-24" />
            <p className="font-bold">Setelah Belok Kanan, maju berarti bergerak dari B1 ke B6.</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2 text-lg font-bold">
      <p>Setiap level punya 4 bintang nyawa. Menabrak atau salah membuang sampah mengurangi 1 bintang.</p>
      <ul className="space-y-1.5">
        <li className="flex items-center gap-2"><BarisBintang jumlah={1} /> Selesaikan misi</li>
        <li className="flex items-center gap-2"><BarisBintang jumlah={2} /> Pakai blok Ulangi</li>
        <li className="flex items-center gap-2"><BarisBintang jumlah={3} /> Tanpa kesalahan</li>
        <li className="flex items-center gap-2"><BarisBintang jumlah={4} /> Langkah terpendek, tanpa kesalahan</li>
      </ul>
    </div>
  );
}

const KUNCI_SUARA = 'ecocode.suaraTutorial';

function bacaSuaraAktif(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(KUNCI_SUARA) !== 'mati';
  } catch {
    return true;
  }
}

export function Tutorial({ onSelesai }: { onSelesai: () => void }) {
  const [i, setI] = useState(0);
  const [suaraAktif, setSuaraAktif] = useState(bacaSuaraAktif);
  const { didukung, adaSuaraId, berbicara, ditolak, ucapkan, berhenti } = useSuara();
  const jumlah = LANGKAH_TUTORIAL.length;
  const langkah = LANGKAH_TUTORIAL[i];
  const terakhir = i === jumlah - 1;

  // Setiap pindah langkah, narasinya dibacakan (bila suara otomatis menyala); pindah atau mematikan = suara sebelumnya berhenti.
  useEffect(() => {
    if (!didukung) return;
    if (suaraAktif) ucapkan(LANGKAH_TUTORIAL[i].narasi);
    else berhenti();
  }, [i, suaraAktif, didukung, ucapkan, berhenti]);

  function ubahSuara() {
    const baru = !suaraAktif;
    setSuaraAktif(baru);
    try {
      window.localStorage.setItem(KUNCI_SUARA, baru ? 'nyala' : 'mati');
    } catch {
      /* penyimpanan diblokir: pilihan tetap berlaku selama tutorial terbuka */
    }
  }

  return (
    <Modal judul={`Cara Bermain (${i + 1}/${jumlah}): ${langkah.judul}`} onTutup={onSelesai} lebar="max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border-[3px] border-ink bg-kertas px-3 py-2">
        {didukung ? (
          <>
            <button
              type="button"
              onClick={() => (berbicara ? berhenti() : ucapkan(langkah.narasi))}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-[3px] border-ink bg-kuning px-4 text-base font-extrabold shadow-[0_3px_0_var(--color-ink)]"
            >
              <Ikon d={IKON_D.suara} />
              {berbicara ? 'Berhenti' : 'Dengarkan'}
            </button>
            <button type="button" role="switch" aria-checked={suaraAktif} onClick={ubahSuara} className="flex min-h-11 items-center gap-2 text-base font-extrabold">
              <span className={`relative inline-block h-7 w-12 rounded-full border-[3px] border-ink ${suaraAktif ? 'bg-hijau' : 'bg-[#C9D3CE]'}`}>
                <span className={`absolute top-0 size-5 rounded-full border-2 border-ink bg-white transition-all ${suaraAktif ? 'left-[22px]' : 'left-0'}`} />
              </span>
              Suara otomatis: {suaraAktif ? 'Nyala' : 'Mati'}
            </button>
            {ditolak && <p className="basis-full text-sm font-bold text-merah-tua" role="status">Peramban menahan suara otomatis. Ketuk tombol Dengarkan.</p>}
            {adaSuaraId === false && (
              <p className="basis-full text-sm font-bold text-ink-lembut" role="status">
                Perangkat ini belum punya suara bahasa Indonesia, jadi suaranya mungkin terdengar kurang pas. Ikuti juga petunjuk tertulis.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm font-bold text-ink-lembut">Peramban ini belum mendukung suara bacaan. Ikuti petunjuk tertulis.</p>
        )}
      </div>

      <div className="min-h-64">
        <Langkah i={i} />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Tombol onClick={() => setI(i - 1)} disabled={i === 0}>
          Kembali
        </Tombol>
        {terakhir ? (
          <Tombol varian="kuning" besar onClick={onSelesai}>
            Mulai Main
          </Tombol>
        ) : (
          <Tombol varian="hijau" onClick={() => setI(i + 1)}>
            Lanjut
          </Tombol>
        )}
      </div>
    </Modal>
  );
}
