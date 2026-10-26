'use client';

import { useEffect, useState } from 'react';
import { ambilPeringkat } from '@/lib/api';
import type { BarisPeringkat } from '@/lib/api';
import { Bintang, Ikon, IKON_D } from './gambar';
import { Modal } from './ui';

type Tab = 'semua' | 'level' | 'kelas';

function waktu(detik: number): string {
  const m = Math.floor(detik / 60);
  const s = detik % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const KOLOM = 'grid grid-cols-[72px_minmax(0,1fr)_84px_96px_92px_92px] items-center gap-2';
const MEDALI = ['#F6C02B', '#D3DADF', '#E7A97A'];

export function Peringkat({ onTutup, levelSaatIni, kelasSaya }: { onTutup: () => void; levelSaatIni: number; kelasSaya: number | null }) {
  const [tab, setTab] = useState<Tab>('semua');
  const [baris, setBaris] = useState<BarisPeringkat[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    setMemuat(true);
    setGalat(null);
    ambilPeringkat({ levelId: tab === 'level' ? levelSaatIni : undefined, kelas: tab === 'kelas' && kelasSaya ? kelasSaya : undefined })
      .then((d) => {
        if (!batal) setBaris(d);
      })
      .catch((e: Error) => {
        if (!batal) setGalat(e.message);
      })
      .finally(() => {
        if (!batal) setMemuat(false);
      });
    return () => {
      batal = true;
    };
  }, [tab, levelSaatIni, kelasSaya]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'semua', label: 'Semua Level' },
    { id: 'level', label: `Level ${levelSaatIni}` },
    ...(kelasSaya ? [{ id: 'kelas' as Tab, label: 'Kelasku' }] : []),
  ];

  return (
    <Modal judul="Papan Peringkat" onTutup={onTutup} lebar="max-w-3xl">
      <div className="mb-4 flex w-fit max-w-full flex-wrap gap-1.5 rounded-full bg-mint p-1.5" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-11 rounded-full px-5 text-[17px] font-extrabold ${tab === t.id ? 'bg-hijau text-white' : 'text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {memuat && <p className="py-8 text-center text-lg font-bold">Memuat peringkat...</p>}
      {galat && <p className="py-8 text-center text-lg font-bold text-merah-tua">{galat}</p>}
      {!memuat && !galat && baris.length === 0 && <p className="py-8 text-center text-lg font-bold">Belum ada yang bermain. Jadilah yang pertama!</p>}

      {!memuat && !galat && baris.length > 0 && (
        <div className="overflow-x-auto">
          <div className="flex min-w-[560px] flex-col gap-2">
            <div className={`${KOLOM} px-3.5 text-sm font-extrabold text-ink-lembut`}>
              <span>Peringkat</span>
              <span>Nama</span>
              <span>Level</span>
              <span>Bintang</span>
              <span>Waktu</span>
              <span className="text-right">Poin</span>
            </div>
            {baris.map((b, i) => {
              const loncat = i > 0 && b.peringkat > baris[i - 1].peringkat + 1;
              return (
                <div key={`${b.peringkat}-${b.namaPanggilan}`} className="flex flex-col gap-2">
                  {loncat && (
                    <div className="text-center text-xl font-extrabold leading-none text-[#4A5A53]" aria-hidden="true">
                      · · ·
                    </div>
                  )}
                  <div
                    className={`${KOLOM} min-h-14 rounded-2xl border-[3px] border-ink px-3.5 text-[17px] font-bold ${b.adalahSaya ? 'bg-[#FFF0C2] shadow-[0_4px_0_var(--color-ink)]' : 'bg-kertas'}`}
                  >
                    <span
                      className="flex size-10 items-center justify-center rounded-full border-[3px] border-ink font-display text-lg font-bold"
                      style={{ background: MEDALI[b.peringkat - 1] ?? '#FFFFFF' }}
                    >
                      {b.peringkat}
                    </span>
                    <span className="min-w-0 truncate">
                      <b className="font-extrabold">{b.namaPanggilan}</b>{' '}
                      <span className="text-sm text-ink-lembut">
                        {b.kelas ? `Kelas ${b.kelas}` : ''}
                        {b.adalahSaya ? ' · Kamu' : ''}
                      </span>
                    </span>
                    <span>{tab === 'level' ? `Level ${levelSaatIni}` : `${b.levelSelesai} / 15`}</span>
                    <span className="flex items-center gap-1">
                      <Bintang isi ukuran={18} />
                      {b.totalBintang}
                    </span>
                    <span>{waktu(b.totalWaktuDetik)}</span>
                    <span className="text-right font-display text-lg font-semibold">{b.totalSkor.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-4 flex items-center gap-2 text-[15px] font-bold text-ink-lembut">
        <Ikon d={IKON_D.piala} ukuran={18} />
        Poin naik jika bintangmu banyak dan waktumu cepat.
      </p>
    </Modal>
  );
}
