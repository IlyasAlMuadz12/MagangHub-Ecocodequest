'use client';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Blok, BlokUlangi, Program } from '@/lib/game/types.ts';
import type { JenisSorotan, Sorotan } from '@/lib/game/program.ts';
import { buatBlok, hapusBlok, N_MAKS, N_MIN, pindahkan, tambahKe, ubahN } from '@/lib/game/editor.ts';
import type { TipeBlok } from '@/lib/game/editor.ts';
import { sfx } from '@/lib/audio';
import { Ikon, IKON_D } from './gambar';

const BIRU = '#2468B5';
const ORANYE = '#B8560A';
const UNGU = '#7A3FB5';
const KERTAS = '#F3F8F5';

const LABEL: Record<TipeBlok, string> = {
  maju: 'Maju',
  mundur: 'Mundur',
  kanan: 'Belok Kanan',
  kiri: 'Belok Kiri',
  ambil: 'Ambil',
  buang: 'Buang',
  ulangi: 'Ulangi',
};
const WARNA: Record<TipeBlok, string> = { maju: BIRU, mundur: BIRU, kanan: BIRU, kiri: BIRU, ambil: ORANYE, buang: ORANYE, ulangi: UNGU };
const URUTAN_PALET: TipeBlok[] = ['maju', 'mundur', 'kanan', 'kiri', 'ambil', 'buang', 'ulangi'];

interface Konteks {
  program: Program;
  setProgram: (p: Program) => void;
  fokus: string | null;
  setFokus: (id: string | null) => void;
  seret: boolean;
  setSeret: (b: boolean) => void;
  terkunci: boolean;
  sorotan: Sorotan | null;
}
const K = createContext<Konteks | null>(null);
function useEditor(): Konteks {
  const k = useContext(K);
  if (!k) throw new Error('Di luar RuangBlok');
  return k;
}

/** Cangkang blok bergaya puzzle: takik di atas, tonjolan di bawah. */
const GAYA_SOROT: Record<JenisSorotan, string> = {
  jalan: 'z-[3] outline outline-[5px] outline-offset-2 outline-kuning',
  tanya: 'z-[3] outline outline-[5px] outline-offset-2 outline-kuning motion-safe:animate-pulse',
  galat: 'z-[3] goyang outline outline-[5px] outline-offset-2 outline-merah',
};
const LENCANA: Record<JenisSorotan, { teks: string; gaya: string }> = {
  jalan: { teks: 'Sedang jalan', gaya: 'bg-kuning text-ink' },
  tanya: { teks: 'Menunggu pilihanmu', gaya: 'bg-white text-ink' },
  galat: { teks: '✕ Salah di sini', gaya: 'bg-merah text-white' },
};

/** Cangkang blok bergaya puzzle: takik di atas, tonjolan di bawah. `sorot` menandai blok yang sedang berjalan atau yang salah. */
function Kulit({
  warna,
  takik,
  children,
  className = '',
  sorot = null,
  ...sisa
}: { warna: string; takik: string; children: ReactNode; className?: string; sorot?: JenisSorotan | null } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...sisa}
      aria-current={sorot ? 'step' : undefined}
      className={`relative flex min-h-12 items-center gap-2 rounded-lg px-4 text-lg font-extrabold text-white ${className} ${sorot ? GAYA_SOROT[sorot] : ''}`}
      style={{ background: warna }}
    >
      <span aria-hidden="true" className="absolute left-[15px] top-0 z-[1] h-1.5 w-[26px] rounded-b-md" style={{ background: takik }} />
      <span aria-hidden="true" className="absolute -bottom-1.5 left-[17px] z-[2] h-1.5 w-[22px] rounded-b-md" style={{ background: warna }} />
      {sorot && (
        <span className={`absolute -top-3.5 right-14 z-[4] whitespace-nowrap rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-extrabold ${LENCANA[sorot].gaya}`} role="status">
          {LENCANA[sorot].teks}
        </span>
      )}
      {children}
    </div>
  );
}

function Slot({ indukId, indeks }: { indukId: string | null; indeks: number }) {
  const { program, setProgram, seret, setSeret } = useEditor();
  const [atas, setAtas] = useState(false);
  const jatuh = (data: string) => {
    setSeret(false);
    if (data.startsWith('palet:')) {
      setProgram(tambahKe(program, indukId, indeks, buatBlok(data.slice(6) as TipeBlok)));
      sfx('ambil');
    } else if (data.startsWith('ruang:')) {
      setProgram(pindahkan(program, data.slice(6), indukId, indeks));
      sfx('ambil');
    }
  };
  return (
    <div className="relative h-0">
      <div
        className={`absolute inset-x-0 -top-3 z-10 h-6 ${seret ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
          setAtas(true);
        }}
        onDragLeave={() => setAtas(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAtas(false);
          jatuh(e.dataTransfer.getData('text/plain'));
        }}
      />
      {atas && <div className="pointer-events-none absolute inset-x-0 -top-0.5 z-20 h-1.5 rounded bg-kuning" />}
    </div>
  );
}

function TombolHapus({ blok }: { blok: Blok }) {
  const { program, setProgram, terkunci, fokus, setFokus } = useEditor();
  return (
    <button
      type="button"
      disabled={terkunci}
      aria-label={`Hapus blok ${LABEL[blok.tipe]}`}
      onClick={(e) => {
        e.stopPropagation();
        setProgram(hapusBlok(program, blok.id).program);
        if (fokus === blok.id) setFokus(null);
        sfx('klik');
      }}
      className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-white/25 hover:bg-white/40"
    >
      <Ikon d={IKON_D.tutup} ukuran={16} warna="#fff" tebal={3} />
    </button>
  );
}

function BisaSeret({ id, children }: { id: string; children: (p: React.HTMLAttributes<HTMLDivElement>) => ReactNode }) {
  const { setSeret, terkunci } = useEditor();
  return (
    <>
      {children({
        draggable: !terkunci,
        onDragStart: (e) => {
          e.stopPropagation();
          e.dataTransfer.setData('text/plain', `ruang:${id}`);
          e.dataTransfer.effectAllowed = 'move';
          setSeret(true);
        },
        onDragEnd: () => setSeret(false),
      })}
    </>
  );
}

function Daftar({ daftar, indukId }: { daftar: Blok[]; indukId: string | null }) {
  return (
    <>
      {daftar.map((b, i) => (
        <div key={b.id}>
          <Slot indukId={indukId} indeks={i} />
          <BlokTampil blok={b} />
        </div>
      ))}
      <Slot indukId={indukId} indeks={daftar.length} />
    </>
  );
}

function BlokTampil({ blok }: { blok: Blok }) {
  const { program, setProgram, fokus, setFokus, terkunci, sorotan } = useEditor();

  if (blok.tipe !== 'ulangi') {
    const sorot = sorotan && sorotan.blokId === blok.id ? sorotan.jenis : null;
    return (
      <BisaSeret id={blok.id}>
        {(p) => (
          <Kulit {...p} id={`blok-${blok.id}`} sorot={sorot} warna={WARNA[blok.tipe]} takik={KERTAS} className={terkunci ? '' : 'cursor-grab'}>
            <Ikon d={IKON_D[blok.tipe]} ukuran={22} warna="#fff" tebal={2.8} />
            <span>{LABEL[blok.tipe]}</span>
            <TombolHapus blok={blok} />
          </Kulit>
        )}
      </BisaSeret>
    );
  }

  const u: BlokUlangi = blok;
  const terfokus = fokus === u.id;
  const putaran = sorotan?.ulangi.find((x) => x.id === u.id) ?? null;
  return (
    <div>
      <BisaSeret id={u.id}>
        {(p) => (
          <Kulit
            {...p}
            warna={UNGU}
            takik={KERTAS}
            className={`rounded-b-none ${terkunci ? '' : 'cursor-grab'} ${terfokus || putaran ? 'outline outline-4 outline-offset-1 outline-kuning' : ''}`}
            onClick={() => setFokus(terfokus ? null : u.id)}
          >
            <Ikon d={IKON_D.ulangi} ukuran={22} warna="#fff" tebal={2.8} />
            <span>Ulangi</span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                disabled={terkunci || u.n <= N_MIN}
                aria-label="Kurangi jumlah pengulangan"
                onClick={(e) => {
                  e.stopPropagation();
                  setProgram(ubahN(program, u.id, u.n - 1));
                }}
                className="flex size-8 items-center justify-center rounded-full bg-white/25 text-xl leading-none"
              >
                −
              </button>
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-2 text-ink" aria-label={`${u.n} kali`}>
                {u.n}
              </span>
              <button
                type="button"
                disabled={terkunci || u.n >= N_MAKS}
                aria-label="Tambah jumlah pengulangan"
                onClick={(e) => {
                  e.stopPropagation();
                  setProgram(ubahN(program, u.id, u.n + 1));
                }}
                className="flex size-8 items-center justify-center rounded-full bg-white/25 text-xl leading-none"
              >
                +
              </button>
            </span>
            <span>kali</span>
            {putaran && (
              <span className="rounded-full border-2 border-ink bg-kuning px-2.5 py-0.5 text-sm font-extrabold text-ink" role="status">
                putaran {putaran.ke} dari {putaran.dari}
              </span>
            )}
            <TombolHapus blok={u} />
          </Kulit>
        )}
      </BisaSeret>
      <div className="flex">
        <div className="w-[22px] shrink-0" style={{ background: UNGU }} />
        <div className="min-h-9 min-w-0 flex-1">
          <Daftar daftar={u.isi} indukId={u.id} />
          {u.isi.length === 0 && <p className="px-3 py-1.5 text-sm font-bold text-ink-lembut">Tempelkan blok di sini</p>}
        </div>
      </div>
      <div className="relative min-h-[26px] rounded-b-lg" style={{ background: UNGU }}>
        <span aria-hidden="true" className="absolute -bottom-1.5 left-[17px] z-[2] h-1.5 w-[22px] rounded-b-md" style={{ background: UNGU }} />
      </div>
    </div>
  );
}

interface Props {
  program: Program;
  setProgram: (p: Program) => void;
  fokus: string | null;
  setFokus: (id: string | null) => void;
  terkunci: boolean;
  /** blok yang sedang berjalan atau yang menyebabkan kesalahan */
  sorotan?: Sorotan | null;
}

export function RuangBlok({ program, setProgram, fokus, setFokus, terkunci, sorotan = null }: Props) {
  const [seret, setSeret] = useState(false);
  const nilai: Konteks = { program, setProgram, fokus, setFokus, seret, setSeret, terkunci, sorotan };

  const tambahDariPalet = (tipe: TipeBlok) => {
    if (terkunci) return;
    const baru = buatBlok(tipe);
    setProgram(tambahKe(program, fokus, null, baru));
    if (tipe === 'ulangi') setFokus(baru.id);
    sfx('ambil');
  };

  return (
    <K.Provider value={nilai}>
      <div className="flex flex-wrap gap-5">
        {/* Kotak blok */}
        <div
          className="flex shrink-0 basis-[230px] flex-col gap-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const d = e.dataTransfer.getData('text/plain');
            if (d.startsWith('ruang:')) {
              setProgram(hapusBlok(program, d.slice(6)).program);
              if (fokus === d.slice(6)) setFokus(null);
            }
            setSeret(false);
          }}
        >
          <h2 className="font-display text-xl font-bold">Kotak Blok</h2>
          <div className="flex flex-col gap-3.5 pb-2">
            {URUTAN_PALET.map((tipe) => (
              <div
                key={tipe}
                draggable={!terkunci}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', `palet:${tipe}`);
                  e.dataTransfer.effectAllowed = 'copy';
                  setSeret(true);
                }}
                onDragEnd={() => setSeret(false)}
              >
                <button type="button" disabled={terkunci} onClick={() => tambahDariPalet(tipe)} className="block w-full text-left" aria-label={`Tambah blok ${LABEL[tipe]}`}>
                  <Kulit warna={WARNA[tipe]} takik="#FFFFFF" className={terkunci ? '' : 'cursor-grab'}>
                    <Ikon d={IKON_D[tipe]} ukuran={22} warna="#fff" tebal={2.8} />
                    <span>{LABEL[tipe]}</span>
                    {tipe === 'ulangi' && <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-base text-ink">n</span>}
                  </Kulit>
                </button>
              </div>
            ))}
          </div>
          <p className="text-sm font-bold text-ink-lembut">Seret blok ke kanan, atau ketuk blok untuk menambahkannya.</p>
        </div>

        {/* Programmu */}
        <div className="flex min-w-0 flex-1 basis-[260px] flex-col gap-3">
          <h2 className="font-display text-xl font-bold">Programmu</h2>
          <div
            className="min-h-[400px] rounded-2xl border-[3px] border-dashed border-[#7C9A8B] p-4"
            style={{ background: KERTAS }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const d = e.dataTransfer.getData('text/plain');
              setSeret(false);
              if (d.startsWith('palet:')) setProgram(tambahKe(program, null, null, buatBlok(d.slice(6) as TipeBlok)));
              else if (d.startsWith('ruang:')) setProgram(pindahkan(program, d.slice(6), null, program.length));
            }}
          >
            <button
              type="button"
              onClick={() => setFokus(null)}
              className="mb-3 flex min-h-9 w-fit items-center gap-2 rounded-[18px_18px_18px_4px] bg-hijau px-3.5 text-base font-extrabold text-white"
            >
              <Ikon d={IKON_D.main} ukuran={18} warna="#fff" tebal={2} />
              Saat Mulai
            </button>
            <Daftar daftar={program} indukId={null} />
            <div className="mt-6 flex min-h-12 items-center justify-center rounded-xl border-[3px] border-dashed border-[#9DB5A8] text-center text-[15px] font-bold text-[#4A5A53]">
              Seret blok ke sini, lalu tempelkan
            </div>
          </div>
          <p className="text-sm font-bold text-ink-lembut" aria-live="polite">
            {fokus ? 'Blok baru yang diketuk masuk ke dalam blok Ulangi.' : 'Blok baru yang diketuk masuk ke bagian utama.'}
          </p>
        </div>
      </div>
    </K.Provider>
  );
}
