'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LEVELS } from '@/lib/game/levels.ts';
import { ambilDataGuru } from '@/lib/api';
import {
  ATURAN_AWAL,
  JUMLAH_LEVEL,
  NAMA_STATUS,
  bangunDasbor,
  buatCsv,
  formatTerakhir,
  formatWaktu,
  hitungRingkasanKelas,
  saring,
  urutkan,
} from '@/lib/guru.ts';
import type { Aturan, KolomUrut, ProgresMentah, SiswaMentah, SiswaStatus, Status } from '@/lib/guru.ts';
import { Bintang, BarisBintang, Ikon, IKON_D, Logo } from './gambar';
import { Tombol } from './ui';

const GAYA_STATUS: Record<Status, string> = {
  selesai: 'bg-hijau text-white',
  aktif: 'bg-[#D3E9FB] text-ink',
  tertinggal: 'bg-kuning text-ink',
  'belum-mulai': 'bg-[#C9D3CE] text-ink',
};

const WARNA_SEL: Record<number, { bg: string; fg: string }> = {
  0: { bg: '#FFE9A8', fg: '#14342B' },
  1: { bg: '#CFEFD8', fg: '#14342B' },
  2: { bg: '#9EDDB1', fg: '#14342B' },
  3: { bg: '#5FC285', fg: '#14342B' },
  4: { bg: '#187A41', fg: '#FFFFFF' },
};

const DUNIA_LATAR: Record<string, string> = { rumah: '#FFF0C2', sekolah: '#D3E9FB', hutan: '#D6F2DD' };
const DUNIA_NAMA: Record<string, string> = { rumah: 'Di Rumah', sekolah: 'Di Sekolah', hutan: 'Di Hutan' };

const KOLAM = 'min-h-11 rounded-2xl border-[3px] border-ink bg-white px-3 text-base font-bold text-ink';

function ChipStatus({ status }: { status: Status }) {
  return <span className={`inline-block rounded-full border-2 border-ink px-3 py-0.5 text-sm font-extrabold ${GAYA_STATUS[status]}`}>{NAMA_STATUS[status]}</span>;
}

function Kartu({ judul, nilai, catatan, latar }: { judul: string; nilai: string; catatan: string; latar: string }) {
  return (
    <div className="flex-1 basis-[220px] rounded-[20px] border-[3px] border-ink px-5 py-4" style={{ background: latar }}>
      <p className="text-[15px] font-extrabold text-ink-lembut">{judul}</p>
      <p className="font-display text-4xl font-bold leading-tight">{nilai}</p>
      <p className="text-sm font-bold text-ink-lembut">{catatan}</p>
    </div>
  );
}

function DetailLevel({ s, sekarang }: { s: SiswaStatus; sekarang: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
      {LEVELS.map((l) => {
        const b = s.perLevel[l.id - 1];
        return (
          <div key={l.id} className="rounded-xl border-2 border-ink bg-white px-3 py-2">
            <p className="text-sm font-extrabold">
              Level {l.id} <span className="font-bold text-ink-lembut">{l.judul}</span>
            </p>
            {b ? (
              <>
                <BarisBintang jumlah={b.bintang} ukuran={16} />
                <p className="text-xs font-bold text-ink-lembut">
                  {b.bintang >= 1 ? `Waktu terbaik ${formatWaktu(b.waktuTerbaikDetik ?? 0)}` : 'Belum berhasil'} · {b.percobaan}x coba
                </p>
              </>
            ) : (
              <p className="text-xs font-bold text-ink-lembut">Belum dicoba</p>
            )}
          </div>
        );
      })}
      <p className="col-span-full text-xs font-bold text-ink-lembut">Terakhir bermain: {formatTerakhir(s.terakhirMain, sekarang)} · Median kelas: {s.medianKelas} level</p>
    </div>
  );
}

function Matriks({ daftar }: { daftar: SiswaStatus[] }) {
  const kelompok = (['rumah', 'sekolah', 'hutan'] as const).map((d) => ({ dunia: d, level: LEVELS.filter((l) => l.dunia === d) }));
  return (
    <div className="overflow-x-auto rounded-[20px] border-[3px] border-ink bg-white p-3">
      <table className="min-w-[760px] border-separate border-spacing-1 text-center">
        <caption className="sr-only">Bintang tiap siswa pada setiap level</caption>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white" />
            {kelompok.map((k) => (
              <th key={k.dunia} colSpan={k.level.length} className="rounded-lg border-2 border-ink px-2 py-1 text-sm font-extrabold" style={{ background: DUNIA_LATAR[k.dunia] }}>
                {DUNIA_NAMA[k.dunia]}
              </th>
            ))}
          </tr>
          <tr>
            <th scope="col" className="sticky left-0 z-10 bg-white px-2 text-left text-sm font-extrabold">Siswa</th>
            {LEVELS.map((l) => (
              <th key={l.id} scope="col" className="min-w-9 text-sm font-extrabold" title={`Level ${l.id}: ${l.judul}`}>{l.id}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {daftar.map((s) => (
            <tr key={s.id}>
              <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 text-left text-sm font-extrabold">
                {s.namaPanggilan}
                {s.kelas ? <span className="font-bold text-ink-lembut"> · K{s.kelas}</span> : null}
              </th>
              {LEVELS.map((l) => {
                const b = s.perLevel[l.id - 1];
                if (!b) {
                  return (
                    <td key={l.id} className="h-9 rounded-lg bg-[#EEF3F0] text-sm font-bold text-[#4A5A53]" aria-label={`${s.namaPanggilan}, level ${l.id}: belum dicoba`}>
                      ·
                    </td>
                  );
                }
                const w = WARNA_SEL[b.bintang] ?? WARNA_SEL[0];
                return (
                  <td
                    key={l.id}
                    className="h-9 rounded-lg border-2 border-ink text-sm font-extrabold"
                    style={{ background: w.bg, color: w.fg }}
                    title={`${s.namaPanggilan}, level ${l.id}: ${b.bintang >= 1 ? `${b.bintang} bintang` : 'sudah dicoba, belum berhasil'}`}
                    aria-label={`${s.namaPanggilan}, level ${l.id}: ${b.bintang >= 1 ? `${b.bintang} bintang` : 'belum berhasil'}`}
                  >
                    {b.bintang}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-sm font-bold">
        <span className="flex items-center gap-1.5"><i className="inline-block size-5 rounded border-2 border-ink" style={{ background: WARNA_SEL[4].bg }} /> 4 bintang</span>
        <span className="flex items-center gap-1.5"><i className="inline-block size-5 rounded border-2 border-ink" style={{ background: WARNA_SEL[3].bg }} /> 3</span>
        <span className="flex items-center gap-1.5"><i className="inline-block size-5 rounded border-2 border-ink" style={{ background: WARNA_SEL[2].bg }} /> 2</span>
        <span className="flex items-center gap-1.5"><i className="inline-block size-5 rounded border-2 border-ink" style={{ background: WARNA_SEL[1].bg }} /> 1</span>
        <span className="flex items-center gap-1.5"><i className="inline-block size-5 rounded border-2 border-ink" style={{ background: WARNA_SEL[0].bg }} /> 0 = sudah dicoba, belum berhasil</span>
        <span className="flex items-center gap-1.5"><i className="inline-block size-5 rounded bg-[#EEF3F0]" /> · = belum dicoba</span>
      </div>
    </div>
  );
}

interface Props {
  namaGuru: string;
  onKeluar: () => void;
}

export function DasborGuru({ namaGuru, onKeluar }: Props) {
  const [data, setData] = useState<{ siswa: SiswaMentah[]; progres: ProgresMentah[]; waktu: number } | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const [aturan, setAturan] = useState<Aturan>(ATURAN_AWAL);
  const [kelas, setKelas] = useState<number | null>(null);
  const [cari, setCari] = useState('');
  const [hanyaPerhatian, setHanyaPerhatian] = useState(false);
  const [urut, setUrut] = useState<{ kolom: KolomUrut; naik: boolean }>({ kolom: 'perhatian', naik: true });
  const [tab, setTab] = useState<'ringkasan' | 'level'>('ringkasan');
  const [terbuka, setTerbuka] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    setGalat(null);
    try {
      const d = await ambilDataGuru();
      setData({ ...d, waktu: Date.now() });
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal memuat data.');
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const dasbor = useMemo(() => (data ? bangunDasbor(data.siswa, data.progres, data.waktu, aturan) : []), [data, aturan]);
  const tampil = useMemo(() => urutkan(saring(dasbor, { kelas, cari, hanyaPerhatian }), urut.kolom, urut.naik), [dasbor, kelas, cari, hanyaPerhatian, urut]);
  const ringkasan = useMemo(() => hitungRingkasanKelas(saring(dasbor, { kelas, cari: '', hanyaPerhatian: false })), [dasbor, kelas]);
  const daftarKelas = useMemo(() => Array.from(new Set((data?.siswa ?? []).map((s) => s.kelas).filter((k): k is number => k !== null))).sort((a, b) => a - b), [data]);
  const sekarang = data?.waktu ?? Date.now();

  function ubahUrut(kolom: KolomUrut) {
    setUrut((u) => (u.kolom === kolom ? { kolom, naik: !u.naik } : { kolom, naik: kolom === 'nama' || kolom === 'perhatian' }));
  }

  function unduhCsv() {
    const isi = '\uFEFF' + buatCsv(tampil, sekarang);
    const url = URL.createObjectURL(new Blob([isi], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecocode-progres-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const aturAngka = (kunci: keyof Aturan, nilai: string, maks: number) => {
    const n = Math.max(1, Math.min(maks, Math.round(Number(nilai)) || 1));
    setAturan((a) => ({ ...a, [kunci]: n }));
  };

  const kepala = (kolom: KolomUrut, teks: string, rata = '') => (
    <th scope="col" aria-sort={urut.kolom === kolom ? (urut.naik ? 'ascending' : 'descending') : 'none'} className={`px-3 pb-1 text-sm font-extrabold text-ink-lembut ${rata}`}>
      <button type="button" onClick={() => ubahUrut(kolom)} className="inline-flex min-h-9 items-center gap-1 font-extrabold">
        {teks}
        <span aria-hidden="true">{urut.kolom === kolom ? (urut.naik ? '▲' : '▼') : ''}</span>
      </button>
    </th>
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col gap-5 bg-mint px-5 pb-12 pt-8 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 rounded-[20px] border-[3px] border-ink bg-white px-4 py-2">
          <Logo ukuran={44} />
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight">Dasbor Guru</h1>
            <p className="font-bold text-ink-lembut">Halo, {namaGuru}!</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tombol onClick={() => void muat()} disabled={memuat}>{memuat ? 'Memuat...' : 'Muat ulang'}</Tombol>
          <Tombol onClick={unduhCsv} disabled={tampil.length === 0}>
            <Ikon d={IKON_D.unduh} tebal={2.6} />
            Unduh CSV
          </Tombol>
          <Link href="/peta" className="inline-flex min-h-12 items-center rounded-2xl border-[3px] border-ink bg-white px-5 text-lg font-extrabold">Lihat Game</Link>
          <Tombol onClick={onKeluar}>Keluar</Tombol>
        </div>
      </header>

      {memuat && !data && <p className="rounded-2xl border-[3px] border-ink bg-white px-4 py-6 text-center text-lg font-bold">Memuat data siswa...</p>}

      {galat && (
        <p role="alert" className="rounded-2xl border-[3px] border-merah bg-[#FADAD7] px-4 py-3 text-lg font-bold text-merah-tua">
          {galat}
        </p>
      )}

      {!galat && !memuat && data && data.siswa.length === 0 && (
        <p className="rounded-2xl border-[3px] border-ink bg-white px-4 py-6 text-center text-lg font-bold">Belum ada siswa yang mendaftar. Setelah siswa membuat akun dan bermain, progresnya muncul di sini.</p>
      )}

      {data && data.siswa.length > 0 && (
        <>
          <section className="flex flex-wrap gap-4" aria-label="Ringkasan">
            <Kartu judul="Jumlah siswa" nilai={String(ringkasan.jumlah)} catatan={kelas ? `Kelas ${kelas}` : 'Semua kelas'} latar="#FFFFFF" />
            <Kartu judul="Rata-rata level selesai" nilai={`${String(ringkasan.rataLevel).replace('.', ',')} / ${JUMLAH_LEVEL}`} catatan={`${ringkasan.aktif} aktif bermain`} latar="#D3E9FB" />
            <Kartu judul="Selesai semua level" nilai={String(ringkasan.selesai)} catatan="Berhak mengambil sertifikat" latar="#D6F2DD" />
            <Kartu judul="Perlu perhatian" nilai={String(ringkasan.tertinggal + ringkasan.belumMulai)} catatan={`${ringkasan.tertinggal} tertinggal · ${ringkasan.belumMulai} belum mulai`} latar="#FFF0C2" />
          </section>

          <section className="flex flex-col gap-3 rounded-[20px] border-[3px] border-ink bg-white p-4" aria-label="Penyaring">
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex flex-col gap-1 text-sm font-extrabold">
                Kelas
                <select className={KOLAM} value={kelas ?? ''} onChange={(e) => setKelas(e.target.value === '' ? null : Number(e.target.value))}>
                  <option value="">Semua kelas</option>
                  {daftarKelas.map((k) => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm font-extrabold">
                Cari siswa
                <input className={KOLAM} type="search" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Nama atau nama pengguna" />
              </label>
              <label className="flex min-h-11 items-center gap-2 text-base font-extrabold">
                <input type="checkbox" className="size-5 accent-hijau" checked={hanyaPerhatian} onChange={(e) => setHanyaPerhatian(e.target.checked)} />
                Hanya yang perlu perhatian
              </label>
            </div>
            <details className="rounded-2xl bg-kertas px-4 py-2">
              <summary className="min-h-9 cursor-pointer text-base font-extrabold">Aturan &quot;tertinggal&quot;</summary>
              <p className="mt-2 text-sm font-bold text-ink-lembut">
                Siswa yang belum menyelesaikan semua level ditandai tertinggal bila salah satu benar: level selesainya jauh di bawah median teman sekelasnya, atau sudah lama tidak bermain. Median hanya dihitung dari siswa yang sudah mulai bermain.
              </p>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm font-extrabold">
                  Selisih dari median kelas
                  <input className={`${KOLAM} w-20`} type="number" min={1} max={14} value={aturan.ambangLevel} onChange={(e) => aturAngka('ambangLevel', e.target.value, 14)} />
                  level atau lebih
                </label>
                <label className="flex items-center gap-2 text-sm font-extrabold">
                  Tidak bermain
                  <input className={`${KOLAM} w-20`} type="number" min={1} max={90} value={aturan.ambangHari} onChange={(e) => aturAngka('ambangHari', e.target.value, 90)} />
                  hari atau lebih
                </label>
              </div>
            </details>
          </section>

          <div className="flex w-fit gap-1.5 rounded-full bg-white p-1.5 ring-[3px] ring-ink" role="tablist">
            {([['ringkasan', 'Ringkasan'], ['level', 'Per level']] as const).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`min-h-11 rounded-full px-5 text-[17px] font-extrabold ${tab === id ? 'bg-hijau text-white' : 'text-ink'}`}>
                {label}
              </button>
            ))}
          </div>

          {tampil.length === 0 && <p className="rounded-2xl border-[3px] border-ink bg-white px-4 py-6 text-center text-lg font-bold">Tidak ada siswa yang cocok dengan penyaringnya.</p>}

          {tampil.length > 0 && tab === 'level' && <Matriks daftar={tampil} />}

          {tampil.length > 0 && tab === 'ringkasan' && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-separate border-spacing-y-2">
                <caption className="sr-only">Progres tiap siswa</caption>
                <thead>
                  <tr className="text-left">
                    {kepala('nama', 'Siswa')}
                    <th scope="col" className="px-3 pb-1 text-sm font-extrabold text-ink-lembut">Kelas</th>
                    {kepala('level', 'Level tertinggi')}
                    {kepala('bintang', 'Bintang')}
                    {kepala('waktu', 'Total waktu')}
                    {kepala('terakhir', 'Terakhir main')}
                    {kepala('perhatian', 'Status')}
                  </tr>
                </thead>
                <tbody>
                  {tampil.map((s) => {
                    const buka = terbuka === s.id;
                    const sel = 'border-y-[3px] border-ink bg-white px-3 py-2 align-top';
                    return (
                      <Fragment key={s.id}>
                        <tr>
                          <td className={`${sel} rounded-l-2xl border-l-[3px]`}>
                            <button type="button" aria-expanded={buka} onClick={() => setTerbuka(buka ? null : s.id)} className="flex min-h-9 items-center gap-2 text-left">
                              <span aria-hidden="true" className="text-sm">{buka ? '▼' : '▶'}</span>
                              <span>
                                <span className="block text-lg font-extrabold leading-tight">{s.namaPanggilan}</span>
                                <span className="block text-sm font-bold text-ink-lembut">@{s.username}</span>
                              </span>
                            </button>
                          </td>
                          <td className={`${sel} font-bold`}>{s.kelas ?? '-'}</td>
                          <td className={sel}>
                            <p className="font-bold">
                              <span className="font-display text-2xl font-bold">{s.levelTertinggi}</span> <span className="text-ink-lembut">dari {JUMLAH_LEVEL}</span>
                            </p>
                            <div className="mt-1 h-2.5 w-32 overflow-hidden rounded-full border-2 border-ink bg-mint">
                              <div className="h-full bg-hijau" style={{ width: `${(s.levelSelesai / JUMLAH_LEVEL) * 100}%` }} />
                            </div>
                          </td>
                          <td className={`${sel} font-bold`}>
                            <span className="inline-flex items-center gap-1">
                              <Bintang isi={s.totalBintang > 0} ukuran={20} />
                              {s.totalBintang} / {JUMLAH_LEVEL * 4}
                            </span>
                          </td>
                          <td className={`${sel} font-bold`}>{s.levelSelesai > 0 ? formatWaktu(s.totalWaktuDetik) : '-'}</td>
                          <td className={`${sel} font-bold`}>{formatTerakhir(s.terakhirMain, sekarang)}</td>
                          <td className={`${sel} rounded-r-2xl border-r-[3px]`}>
                            <ChipStatus status={s.info.status} />
                            {s.info.alasan.map((a) => (
                              <p key={a} className="mt-1 text-xs font-bold text-ink-lembut">{a}</p>
                            ))}
                          </td>
                        </tr>
                        {buka && (
                          <tr>
                            <td colSpan={7} className="rounded-2xl border-[3px] border-ink bg-kertas px-4 py-3">
                              <DetailLevel s={s} sekarang={sekarang} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
