'use client';

import type { Level } from '@/lib/game/types.ts';
import { labelJenis } from '@/lib/game/engine.ts';
import type { Pertanyaan } from '@/lib/game/engine.ts';
import { KATALOG } from '@/lib/game/catalog.ts';
import { sfx } from '@/lib/audio';
import { TongSvg } from './gambar';
import { Modal } from './ui';

/** Muncul saat blok Buang dijalankan di petak tong: siswa memilih sampah yang cocok dari tas robot. */
export function PertanyaanBuang({ level, pertanyaan, onJawab }: { level: Level; pertanyaan: Pertanyaan; onJawab: (indeks: number) => void }) {
  const jenis = labelJenis(pertanyaan.jenisTong);
  return (
    <Modal judul="Pilih sampah yang tepat!" lebar="max-w-xl">
      <div className="flex flex-col items-center gap-4 text-center">
        <TongSvg jenis={pertanyaan.jenisTong} className="w-28" />
        <p className="text-xl font-bold leading-relaxed">
          Robot ada di tong <b className="font-extrabold">{jenis}</b>.
          <br />
          Mana yang termasuk sampah <b className="font-extrabold">{jenis}</b>?
        </p>
        <div className="grid w-full gap-3 sm:grid-cols-3" role="group" aria-label="Sampah di tas robot">
          {pertanyaan.pilihan.map((idx, urut) => {
            const item = KATALOG[level.config.sampah[idx].item];
            return (
              <button
                key={idx}
                type="button"
                autoFocus={urut === 0}
                onClick={() => {
                  sfx('klik');
                  onJawab(idx);
                }}
                className="flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border-[3px] border-ink bg-white p-3 text-lg font-extrabold shadow-[0_4px_0_var(--color-ink)] active:translate-y-1 active:shadow-none"
              >
                <span className="text-5xl" aria-hidden="true">
                  {item.ikon}
                </span>
                {item.nama}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
