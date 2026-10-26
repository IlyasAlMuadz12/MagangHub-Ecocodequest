'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { sfx } from '@/lib/audio';
import { Ikon } from './gambar';
import { IKON_D } from './gambar';

type Varian = 'kuning' | 'hijau' | 'putih';

const GAYA: Record<Varian, string> = {
  kuning: 'bg-kuning text-ink shadow-[0_4px_0_var(--color-ink)]',
  hijau: 'bg-hijau text-white shadow-[0_4px_0_var(--color-ink)]',
  putih: 'bg-white text-ink',
};

interface PropsTombol extends ButtonHTMLAttributes<HTMLButtonElement> {
  varian?: Varian;
  besar?: boolean;
}

export function Tombol({ varian = 'putih', besar = false, className = '', onClick, children, ...sisa }: PropsTombol) {
  return (
    <button
      {...sisa}
      onClick={(e) => {
        sfx('klik');
        onClick?.(e);
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border-[3px] border-ink font-extrabold ${
        besar ? 'min-h-14 px-7 font-display text-xl' : 'min-h-12 px-5 text-lg'
      } ${GAYA[varian]} ${className}`}
    >
      {children}
    </button>
  );
}

export function TombolIkon({ label, d, aktif = false, className = '', children, ...sisa }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; d?: string; aktif?: boolean }) {
  return (
    <button
      {...sisa}
      aria-label={label}
      title={label}
      onClick={(e) => {
        sfx('klik');
        sisa.onClick?.(e);
      }}
      className={`flex size-12 items-center justify-center rounded-full border-[3px] border-ink bg-white ${aktif ? 'ring-4 ring-kuning' : ''} ${className}`}
    >
      {children ?? (d ? <Ikon d={d} /> : null)}
    </button>
  );
}

export function Modal({ judul, onTutup, children, lebar = 'max-w-3xl' }: { judul: string; onTutup?: () => void; children: ReactNode; lebar?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/60 p-4" role="dialog" aria-modal="true" aria-label={judul}>
      <div className={`w-full ${lebar} rounded-[28px] border-[3px] border-ink bg-white p-6 shadow-[0_10px_0_var(--color-ink)] sm:p-7`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl font-bold">{judul}</h2>
          {onTutup && (
            <button aria-label="Tutup" onClick={onTutup} className="flex size-12 shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-white">
              <Ikon d={IKON_D.tutup} tebal={2.8} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Memuat({ teks = 'Memuat...' }: { teks?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mint">
      <p className="font-display text-2xl font-semibold">{teks}</p>
    </div>
  );
}
