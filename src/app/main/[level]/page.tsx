'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ambilLevel, LEVELS } from '@/lib/game/levels.ts';
import type { Level, Program } from '@/lib/game/types.ts';
import { Penjalan, keadaanAwal } from '@/lib/game/engine.ts';
import type { Hasil, Keadaan, LangkahBerikut, Pertanyaan } from '@/lib/game/engine.ts';
import { KATALOG } from '@/lib/game/catalog.ts';
import { pakaiUlangi, ratakanBerjejak } from '@/lib/game/program.ts';
import type { LangkahProgram, Sorotan } from '@/lib/game/program.ts';
import { hitungBintang, hitungSkor, NYAWA_AWAL } from '@/lib/game/scoring.ts';
import { kirimPercobaan } from '@/lib/api';
import type { HasilPercobaan } from '@/lib/api';
import { TEMA } from '@/lib/tema';
import { sfx } from '@/lib/audio';
import { useAuth } from '@/components/AuthProvider';
import { useWajibMasuk } from '@/components/useWajibMasuk';
import { Bintang, BarisBintang, IKON_D, Ikon } from '@/components/gambar';
import { Memuat, Modal, Tombol, TombolIkon } from '@/components/ui';
import { KontrolMusik } from '@/components/KontrolMusik';
import { PilihTema } from '@/components/PilihTema';
import { Papan } from '@/components/Papan';
import { PertanyaanBuang } from '@/components/PertanyaanBuang';
import { RuangBlok } from '@/components/RuangBlok';

type Status = 'siap' | 'jalan' | 'menang' | 'kalah';
type Simpan = 'menyimpan' | 'tersimpan' | 'gagal';

function format(detik: number): string {
  return `${String(Math.floor(detik / 60)).padStart(2, '0')}:${String(detik % 60).padStart(2, '0')}`;
}

const JEDA_LANGKAH = 520; // cukup lama agar blok yang disorot sempat terbaca

export default function HalamanLevel() {
  const params = useParams<{ level: string }>();
  const menunggu = useWajibMasuk();
  const { progres } = useAuth();
  const n = Number(params.level);
  const level = Number.isInteger(n) ? ambilLevel(n) : undefined;

  if (menunggu) return <Memuat />;
  if (!level) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-display text-3xl font-bold">Level tidak ditemukan</p>
        <Link href="/peta" className="rounded-2xl border-[3px] border-ink bg-kuning px-6 py-3 text-xl font-extrabold">Kembali ke Peta</Link>
      </main>
    );
  }
  if (level.id > 1 && (progres[level.id - 1]?.bintang ?? 0) < 1) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-display text-3xl font-bold">Level {level.id} masih terkunci</p>
        <p className="text-lg font-bold">Selesaikan level {level.id - 1} dulu, ya!</p>
        <Link href="/peta" className="rounded-2xl border-[3px] border-ink bg-kuning px-6 py-3 text-xl font-extrabold">Kembali ke Peta</Link>
      </main>
    );
  }
  return <LayarGame key={level.id} level={level} />;
}

function LayarGame({ level }: { level: Level }) {
  const router = useRouter();
  const { pengaturan, ubahPengaturan, muatUlang } = useAuth();
  const tema = TEMA[pengaturan?.tema ?? 'cerah'];

  const [program, setProgram] = useState<Program>([]);
  const [fokus, setFokus] = useState<string | null>(null);
  const [keadaan, setKeadaan] = useState<Keadaan>(() => keadaanAwal(level));
  const [nyawa, setNyawa] = useState(NYAWA_AWAL);
  const [status, setStatus] = useState<Status>('siap');
  const [pesan, setPesan] = useState<string | null>(null);
  const [goyang, setGoyang] = useState(false);
  const [detik, setDetik] = useState(0);
  const [hasil, setHasil] = useState<HasilPercobaan | null>(null);
  const [ringkasan, setRingkasan] = useState<{ kesalahan: number; pakai: boolean; langkah: number; waktu: number } | null>(null);
  const [simpan, setSimpan] = useState<Simpan>('menyimpan');
  const [pesanSimpan, setPesanSimpan] = useState<string | null>(null);
  const [pertanyaan, setPertanyaan] = useState<Pertanyaan | null>(null);
  const [sorotan, setSorotan] = useState<Sorotan | null>(null);

  const nyawaRef = useRef(NYAWA_AWAL);
  const mulaiRef = useRef(Date.now());
  const berhentiRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const penjalanRef = useRef<Penjalan | null>(null);
  const jejakRef = useRef<LangkahProgram[]>([]);

  // timer: berjalan sejak game dimulai, tanpa batas waktu
  useEffect(() => {
    const id = setInterval(() => {
      if (!berhentiRef.current) setDetik(Math.floor((Date.now() - mulaiRef.current) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  // gulir ke blok yang sedang disorot supaya tetap terlihat pada program yang panjang
  useEffect(() => {
    if (!sorotan) return;
    const el = document.getElementById(`blok-${sorotan.blokId}`);
    if (!el) return;
    const kurangiGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'nearest', behavior: kurangiGerak ? 'auto' : 'smooth' });
  }, [sorotan]);

  const bisaEdit = status === 'siap';

  function ulangDariAwal() {
    if (timerRef.current) clearTimeout(timerRef.current);
    penjalanRef.current = null;
    setPertanyaan(null);
    setKeadaan(keadaanAwal(level));
    setStatus('siap');
  }

  function tundaUlang(ms: number) {
    timerRef.current = setTimeout(ulangDariAwal, ms);
  }

  function kalahkan() {
    berhentiRef.current = true;
    setStatus('kalah');
    void kirimPercobaan({
      levelId: level.id,
      berhasil: false,
      waktuDetik: Math.floor((Date.now() - mulaiRef.current) / 1000),
      langkah: 0,
      kesalahan: NYAWA_AWAL,
      pakaiUlangi: pakaiUlangi(program),
      program,
    }).catch(() => undefined);
  }

  function menangkan(h: Hasil) {
    berhentiRef.current = true;
    const waktu = Math.floor((Date.now() - mulaiRef.current) / 1000);
    const kesalahan = NYAWA_AWAL - nyawaRef.current;
    const pakai = pakaiUlangi(program);
    const bintang = hitungBintang({ berhasil: true, kesalahan, pakaiUlangi: pakai, langkah: h.jumlahLangkah, langkahOptimal: level.langkahOptimal });
    setDetik(waktu);
    setRingkasan({ kesalahan, pakai, langkah: h.jumlahLangkah, waktu });
    setHasil({ bintang, skor: hitungSkor(bintang, waktu, level.waktuTargetDetik), rekorBaru: false });
    setSimpan('menyimpan');
    setPesanSimpan(null);
    setStatus('menang');
    sfx('menang');
    kirimPercobaan({ levelId: level.id, berhasil: true, waktuDetik: waktu, langkah: h.jumlahLangkah, kesalahan, pakaiUlangi: pakai, program })
      .then((r) => {
        setHasil(r);
        setSimpan('tersimpan');
        void muatUlang();
      })
      .catch((e: Error) => {
        setSimpan('gagal');
        setPesanSimpan(e.message);
      });
  }

  function selesaiJalan(h: Hasil) {
    if (h.galat) {
      const sisa = nyawaRef.current - 1;
      nyawaRef.current = sisa;
      setNyawa(sisa);
      setPesan(h.pesan);
      if (sisa <= 0) kalahkan();
      else tundaUlang(1000);
    } else if (h.selesaiMisi) {
      menangkan(h);
    } else {
      setPesan(h.terpotong ? 'Programmu terlalu panjang. Coba buat lebih singkat!' : 'Programmu sudah selesai, tapi misinya belum. Ayo coba lagi!');
      tundaUlang(1300);
    }
  }

  /** Penanda untuk perintah ke-`indeks`: blok mana yang sedang jalan, dan putaran Ulangi-nya. */
  function buatSorotan(indeks: number, jenis: Sorotan['jenis']): Sorotan | null {
    const j = jejakRef.current[indeks];
    if (!j) return null;
    return { blokId: j.blokId, ulangi: j.ulangi, jenis, nomor: indeks + 1, total: jejakRef.current.length };
  }

  /** Mengubah susunan blok oleh siswa; penanda kesalahan lama dihapus karena programnya sudah berubah. */
  function ubahProgram(p: Program) {
    setProgram(p);
    setSorotan(null);
  }

  /** Memproses hasil satu langkah. Berhenti menunggu siswa bila ada pertanyaan Buang. */
  function proses(r: LangkahBerikut) {
    const pj = penjalanRef.current;
    if (!pj) return;
    if (r.status === 'tanya') {
      setSorotan(buatSorotan(pj.indeks, 'tanya'));
      setPertanyaan(r.pertanyaan); // jeda sampai siswa memilih sampah
      return;
    }
    if (r.status === 'selesai') {
      setSorotan(null);
      selesaiJalan(pj.hasil());
      return;
    }
    if (r.status === 'galat') {
      setSorotan(buatSorotan(r.langkah.indeks, 'galat')); // tetap menyala sampai siswa mengubah program
      sfx('salah');
      setGoyang(true);
      setTimeout(() => setGoyang(false), 450);
      timerRef.current = setTimeout(() => selesaiJalan(pj.hasil()), JEDA_LANGKAH);
      return;
    }
    setSorotan(buatSorotan(r.langkah.indeks, 'jalan'));
    setKeadaan(r.langkah.keadaan);
    sfx(r.langkah.kejadian === 'ambil' ? 'ambil' : r.langkah.kejadian === 'buang-benar' ? 'buang' : 'gerak');
    timerRef.current = setTimeout(() => proses(pj.berikut()), JEDA_LANGKAH);
  }

  function jalankanProgram() {
    if (status !== 'siap') return;
    const jejak = ratakanBerjejak(program);
    const rata = jejak.map((l) => l.perintah);
    if (rata.length === 0) {
      setPesan('Susun blokmu dulu, ya!');
      return;
    }
    const pj = new Penjalan(level, rata);
    penjalanRef.current = pj;
    jejakRef.current = jejak;
    setSorotan(null);
    setPesan(null);
    setPertanyaan(null);
    setStatus('jalan');
    setKeadaan(keadaanAwal(level));
    timerRef.current = setTimeout(() => proses(pj.berikut()), 250);
  }

  function jawabPertanyaan(indeks: number) {
    const pj = penjalanRef.current;
    if (!pj) return;
    setPertanyaan(null);
    proses(pj.jawab(indeks));
  }

  function mulaiLagi(resetNyawa: boolean) {
    if (resetNyawa) {
      nyawaRef.current = NYAWA_AWAL;
      setNyawa(NYAWA_AWAL);
    }
    mulaiRef.current = Date.now();
    berhentiRef.current = false;
    setDetik(0);
    setHasil(null);
    setRingkasan(null);
    setPesan(null);
    setSorotan(null);
    ulangDariAwal();
  }

  const adaBerikutnya = LEVELS.some((l) => l.id === level.id + 1);

  return (
    <main className="min-h-screen px-4 pb-8 pt-6 sm:px-8" style={{ background: tema.latar }}>
      {/* bilah atas */}
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <TombolIkon label="Kembali ke peta level" d={IKON_D.kembali} onClick={() => router.push('/peta')} />
          <div className="rounded-[18px] border-[3px] border-ink bg-white px-4 py-1.5">
            <h1 className="font-display text-2xl font-bold leading-tight">Level {level.id}: {level.judul}</h1>
            <p className="text-[15px] font-bold text-ink-lembut">Ambil semua sampah, pilih sampah yang tepat di tiap tong, lalu ke FINIS</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-h-12 items-center gap-2 rounded-full border-[3px] border-ink bg-white px-4" role="img" aria-label={`Nyawa: ${nyawa} dari ${NYAWA_AWAL} bintang`}>
            <span className="font-extrabold">Nyawa</span>
            {Array.from({ length: NYAWA_AWAL }, (_, i) => (
              <Bintang key={i} isi={i < nyawa} ukuran={28} />
            ))}
          </div>
          <div className="flex min-h-12 items-center gap-2 rounded-full border-[3px] border-ink bg-white px-4 font-display text-[22px] font-semibold" aria-label={`Waktu ${format(detik)}`}>
            <Ikon d={IKON_D.jam} />
            <span>{format(detik)}</span>
          </div>
          <PilihTema />
          <KontrolMusik />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-start gap-6">
        {/* ruang kerja blok */}
        <section className="flex min-w-0 flex-[1_1_540px] flex-col gap-4 rounded-3xl border-[3px] border-ink bg-white p-5">
          <RuangBlok program={program} setProgram={ubahProgram} fokus={fokus} setFokus={setFokus} terkunci={!bisaEdit} sorotan={sorotan} />
          <div className="flex flex-wrap items-center gap-3">
            <Tombol varian="hijau" besar onClick={jalankanProgram} disabled={status !== 'siap'}>
              <Ikon d={IKON_D.main} warna="#fff" tebal={2} />
              Jalankan
            </Tombol>
            <Tombol onClick={ulangDariAwal} disabled={status === 'menang' || status === 'kalah'}>Ulang dari awal</Tombol>
            <Tombol onClick={() => { ubahProgram([]); setFokus(null); setPesan(null); }} disabled={!bisaEdit}>Hapus semua</Tombol>
          </div>
          <p className="min-h-7 text-lg font-extrabold text-merah-tua" role="status" aria-live="polite">{pesan}</p>
          {sorotan && sorotan.jenis !== 'galat' && status === 'jalan' && (
            <p className="text-base font-bold text-ink-lembut" aria-live="polite">
              Menjalankan langkah {sorotan.nomor} dari {sorotan.total}
              {sorotan.jenis === 'tanya' ? ': menunggu pilihanmu' : ''}
            </p>
          )}
          {sorotan?.jenis === 'galat' && (
            <p className="text-base font-extrabold text-merah-tua">
              Blok yang salah ditandai merah di Programmu (langkah ke-{sorotan.nomor}). Perbaiki susunannya lalu jalankan lagi.
            </p>
          )}
        </section>

        {/* papan */}
        <section className="flex min-w-0 flex-[1.2_1_560px] flex-col gap-3.5 lg:max-w-[680px]">
          <Papan level={level} keadaan={keadaan} tema={tema} goyang={goyang} />
          <div className="rounded-[18px] border-[3px] border-ink bg-white px-3.5 py-3" aria-live="polite">
            <p className="text-[15px] font-extrabold">Tas robot ({keadaan.bawa.length} sampah)</p>
            {keadaan.bawa.length === 0 ? (
              <p className="text-sm font-bold text-ink-lembut">Tas masih kosong. Ambil semua sampah dulu.</p>
            ) : (
              <div className="mt-1 flex flex-wrap gap-2">
                {keadaan.bawa.map((i) => {
                  const it = KATALOG[level.config.sampah[i].item];
                  return (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-kertas px-3 py-1 text-sm font-extrabold">
                      <span aria-hidden="true">{it.ikon}</span>
                      {it.nama}
                    </span>
                  );
                })}
              </div>
            )}
            <p className="mt-1 text-sm font-bold text-ink-lembut">Sudah dibuang: {keadaan.masuk} dari {level.config.sampah.length}</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2.5 rounded-[18px] border-[3px] border-ink bg-white px-3.5 py-3 text-[15px] font-extrabold">
            <span className="flex items-center gap-1.5"><i className="inline-block size-[18px] rounded-[5px] border-2 border-ink bg-hijau" />Organik</span>
            <span className="flex items-center gap-1.5"><i className="inline-block size-[18px] rounded-[5px] border-2 border-ink bg-kuning" />Anorganik</span>
            <span className="flex items-center gap-1.5"><i className="inline-block size-[18px] rounded-[5px] border-2 border-ink bg-merah" />B3</span>
            <span className="flex items-center gap-1.5"><i className="inline-block size-[18px] rounded-[5px] border-2 border-ink" style={{ background: 'repeating-linear-gradient(45deg,#3A2E3F 0,#3A2E3F 4px,#F2A33A 4px,#F2A33A 8px)' }} />Rintangan</span>
            <span className="flex items-center gap-1.5"><i className="inline-block size-[18px] rounded-[5px] border-2 border-ink bg-white" />Finis</span>
          </div>
          <div className="rounded-[18px] border-[3px] border-ink bg-white px-3.5 py-3 text-[15px] font-bold text-ink-lembut">
            <p>Robot mulai dari START (kiri atas) dan harus berakhir di FINIS (kanan bawah).</p>
            <p>Ambil: masuk dulu ke petak sampah. Ambil semua sampah sebelum membuang.</p>
            <p>Buang: masuk dulu ke petak tong, lalu pilih sampah yang tepat.</p>
            <p>Panah merah = arah hadap robot. Maju ke kanan (K1 ke K6). Setelah Belok Kanan, maju ke bawah (B1 ke B6).</p>
          </div>
        </section>
      </div>

      {status === 'menang' && hasil && ringkasan && (
        <Modal judul={`Level ${level.id} selesai!`} lebar="max-w-xl">
          <div className="flex flex-col items-center gap-3 text-center">
            <BarisBintang jumlah={hasil.bintang} ukuran={56} />
            <p className="font-display text-3xl font-bold">{hasil.skor} poin{hasil.rekorBaru ? ' · Rekor baru!' : ''}</p>
            <ul className="w-full space-y-1.5 rounded-2xl border-[3px] border-ink bg-kertas p-4 text-left text-lg font-bold">
              <li>Bintang 1: misi selesai</li>
              <li className={ringkasan.pakai ? '' : 'text-ink-lembut'}>{ringkasan.pakai ? 'Bintang 2: memakai blok Ulangi' : 'Bintang 2: coba pakai blok Ulangi'}</li>
              <li className={ringkasan.kesalahan === 0 ? '' : 'text-ink-lembut'}>{ringkasan.kesalahan === 0 ? 'Bintang 3: tanpa kesalahan' : `Bintang 3: kamu salah ${ringkasan.kesalahan} kali, coba tanpa salah`}</li>
              <li className={ringkasan.kesalahan === 0 && ringkasan.langkah <= level.langkahOptimal ? '' : 'text-ink-lembut'}>
                {ringkasan.kesalahan === 0 && ringkasan.langkah <= level.langkahOptimal
                  ? 'Bintang 4: langkah terpendek'
                  : `Bintang 4: langkahmu ${ringkasan.langkah}, yang terpendek ${level.langkahOptimal}`}
              </li>
            </ul>
            <p className="text-base font-bold text-ink-lembut">Waktu {format(ringkasan.waktu)}</p>
            {simpan === 'gagal' && <p role="alert" className="font-bold text-merah-tua">Hasilmu belum tersimpan{pesanSimpan ? `: ${pesanSimpan}` : '.'}</p>}
            {simpan === 'menyimpan' && <p className="font-bold text-ink-lembut">Menyimpan hasil...</p>}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Tombol onClick={() => mulaiLagi(true)}>Main lagi</Tombol>
              <Tombol onClick={() => router.push('/peta')}>Peta</Tombol>
              {adaBerikutnya ? (
                <Tombol varian="kuning" besar disabled={simpan === 'menyimpan'} onClick={() => router.push(`/main/${level.id + 1}`)}>Level berikutnya</Tombol>
              ) : (
                <Tombol varian="kuning" besar disabled={simpan === 'menyimpan'} onClick={() => router.push('/sertifikat')}>Ambil Sertifikat</Tombol>
              )}
            </div>
          </div>
        </Modal>
      )}

      {pertanyaan && <PertanyaanBuang level={level} pertanyaan={pertanyaan} onJawab={jawabPertanyaan} />}

      {status === 'kalah' && (
        <Modal judul="Nyawa habis" lebar="max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-xl font-bold">Tidak apa-apa! Perhatikan arah panah robot dan warna tongnya, lalu coba lagi.</p>
            <Tombol varian="kuning" besar onClick={() => mulaiLagi(true)}>Coba lagi</Tombol>
            <Tombol onClick={() => router.push('/peta')}>Kembali ke Peta</Tombol>
          </div>
        </Modal>
      )}
    </main>
  );
}
