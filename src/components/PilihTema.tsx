'use client';

import { TEMA, URUTAN_TEMA } from '@/lib/tema';
import { sfx } from '@/lib/audio';
import { useAuth } from './AuthProvider';
import { Ikon, IKON_D } from './gambar';

const IKON_TEMA = { cerah: IKON_D.matahari, malam: IKON_D.bulan, hutan: IKON_D.pohon } as const;

/** Tiga tombol tema (Cerah, Malam, Hutan). Dipakai di Peta dan Game supaya sama. */
export function PilihTema() {
  const { pengaturan, ubahPengaturan } = useAuth();
  if (!pengaturan) return null;

  return (
    <div className="flex items-center gap-2.5 px-1" role="group" aria-label="Pilih tema latar">
      {URUTAN_TEMA.map((t) => {
        const dipilih = pengaturan.tema === t;
        return (
          <button
            key={t}
            type="button"
            aria-label={`Tema ${TEMA[t].label}`}
            title={`Tema ${TEMA[t].label}`}
            aria-pressed={dipilih}
            onClick={() => {
              sfx('klik');
              void ubahPengaturan({ tema: t });
            }}
            className={`flex size-12 items-center justify-center rounded-full border-[3px] border-ink ${dipilih ? 'shadow-[0_0_0_3px_#fff,0_0_0_6px_#F6C02B]' : ''}`}
            style={{ background: TEMA[t].swatch }}
          >
            <Ikon d={IKON_TEMA[t]} warna={t === 'malam' ? '#fff' : '#14342B'} />
          </button>
        );
      })}
    </div>
  );
}
