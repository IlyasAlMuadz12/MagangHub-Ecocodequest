'use client';

import { DAFTAR_LAGU } from '@/lib/lagu.ts';
import type { IdLagu } from '@/lib/lagu.ts';
import { sfx } from '@/lib/audio';
import { useAuth } from './AuthProvider';
import { Ikon, IKON_D } from './gambar';
import { Modal } from './ui';

const WARNA_LAGU: Record<IdLagu, string> = {
  'pagi-ceria': '#F6C02B',
  'bintang-malam': '#8FA8D8',
  'hutan-hijau': '#7FCB8F',
};

export function PilihMusik({ onTutup }: { onTutup: () => void }) {
  const { pengaturan, ubahPengaturan } = useAuth();
  if (!pengaturan) return null;
  const aktif = pengaturan.bgmAktif;

  return (
    <Modal judul="Pilih Musikmu" onTutup={onTutup} lebar="max-w-xl">
      <div className="flex items-center justify-between gap-3 rounded-2xl border-[3px] border-ink bg-kertas px-4 py-3">
        <div>
          <p className="text-lg font-extrabold">Musik latar</p>
          <p className="text-sm font-bold text-ink-lembut" aria-live="polite">
            {aktif ? 'Sedang menyala' : 'Sedang dimatikan'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={aktif}
          aria-label="Musik latar"
          onClick={() => {
            sfx('klik');
            void ubahPengaturan({ bgmAktif: !aktif });
          }}
          className="flex min-h-12 items-center gap-3 rounded-full px-1"
        >
          <span className={`relative inline-block h-8 w-14 rounded-full border-[3px] border-ink ${aktif ? 'bg-hijau' : 'bg-[#C9D3CE]'}`}>
            <span className={`absolute top-0.5 size-6 rounded-full border-2 border-ink bg-white transition-all ${aktif ? 'left-[26px]' : 'left-0.5'}`} />
          </span>
          <span className="w-12 text-left text-lg font-extrabold">{aktif ? 'Nyala' : 'Mati'}</span>
        </button>
      </div>

      <p className="mb-2 mt-4 text-base font-extrabold">Pilih lagu yang ingin kamu dengar (ketuk untuk memutar)</p>
      <div role="radiogroup" aria-label="Pilih lagu" className="flex flex-col gap-3">
        {DAFTAR_LAGU.map((l) => {
          const dipilih = pengaturan.musik === l.id;
          const berbunyi = dipilih && aktif;
          return (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={dipilih}
              onClick={() => {
                sfx('klik');
                void ubahPengaturan({ musik: l.id, bgmAktif: true });
              }}
              className={`flex items-center gap-4 rounded-2xl border-[3px] border-ink p-3 text-left ${dipilih ? 'bg-[#FFF0C2] shadow-[0_4px_0_var(--color-ink)]' : 'bg-white'}`}
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full border-[3px] border-ink" style={{ background: WARNA_LAGU[l.id] }}>
                <Ikon d={IKON_D.musik} ukuran={28} />
              </span>
              <span className="min-w-0 flex-1 font-display text-2xl font-bold leading-tight">{l.judul}</span>
              {dipilih && (
                <span className="shrink-0 rounded-full border-2 border-ink bg-hijau px-3 py-1 text-sm font-extrabold text-white">
                  {berbunyi ? 'Sedang diputar' : 'Dipilih'}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-sm font-bold text-ink-lembut">Lagu pilihanmu diputar di semua level dan tersimpan untuk akunmu.</p>
    </Modal>
  );
}
