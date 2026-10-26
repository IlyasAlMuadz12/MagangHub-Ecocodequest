import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PengelolaMusik } from '../src/lib/musik.ts';
import type { ElemenAudio } from '../src/lib/musik.ts';
import { DAFTAR_LAGU, adalahIdLagu, berkasLagu } from '../src/lib/lagu.ts';

/** Audio palsu yang meniru peramban: paused menjadi false segera setelah play() dipanggil. */
class AudioPalsu implements ElemenAudio {
  loop = false;
  volume = 1;
  paused = true;
  currentTime = 0;
  jumlahPlay = 0;
  galat: string | null = null;
  src: string;
  constructor(src: string) {
    this.src = src;
  }
  async play(): Promise<void> {
    this.jumlahPlay++;
    if (this.galat) {
      const e = new Error('galat');
      e.name = this.galat;
      throw e;
    }
    this.paused = false;
  }
  pause(): void {
    this.paused = true;
  }
}

function siapkan() {
  const semua: AudioPalsu[] = [];
  const p = new PengelolaMusik((src) => {
    const a = new AudioPalsu(src);
    semua.push(a);
    return a;
  }, 0.4);
  const cari = (berkas: string) => semua.find((a) => a.src === berkas);
  return { p, semua, cari };
}
const tunggu = () => new Promise((r) => setTimeout(r, 0));

test('berkas lagu ada untuk semua pilihan dan id divalidasi', () => {
  assert.equal(DAFTAR_LAGU.length, 3);
  for (const l of DAFTAR_LAGU) {
    assert.equal(adalahIdLagu(l.id), true);
    assert.equal(berkasLagu(l.id), l.berkas);
  }
  assert.equal(adalahIdLagu('lagu-lain'), false);
  assert.equal(adalahIdLagu(undefined), false);
});

test('belum ada ketukan pengguna: musik tidak berbunyi', () => {
  const { p, semua } = siapkan();
  p.atur(true, 'pagi-ceria');
  assert.equal(p.memutar, null);
  assert.equal(semua.length, 0);
});

test('setelah ketukan pertama musik berbunyi dengan loop dan volume 0.4', () => {
  const { p, cari } = siapkan();
  p.atur(true, 'pagi-ceria');
  p.interaksi();
  const a = cari('/audio/bgm-cerah.mp3')!;
  assert.equal(a.paused, false);
  assert.equal(a.loop, true);
  assert.equal(a.volume, 0.4);
  assert.equal(p.memutar, 'pagi-ceria');
});

test('DIBISUKAN = berhenti; DINYALAKAN = berbunyi lagi (lagu dan posisi sama)', () => {
  const { p, cari, semua } = siapkan();
  p.atur(true, 'hutan-hijau');
  p.interaksi();
  const a = cari('/audio/bgm-hutan.mp3')!;
  a.currentTime = 12.5;

  p.atur(false, 'hutan-hijau'); // dibisukan
  assert.equal(a.paused, true);
  assert.equal(p.memutar, null);
  assert.equal(a.currentTime, 12.5); // posisi tidak hilang

  p.atur(true, 'hutan-hijau'); // dinyalakan
  assert.equal(a.paused, false);
  assert.equal(p.memutar, 'hutan-hijau');
  assert.equal(a.currentTime, 12.5);
  assert.equal(semua.length, 1); // tidak membuat elemen baru
});

test('dibisukan dulu sebelum ketukan pertama: tetap diam, lalu menyala saat diaktifkan', () => {
  const { p } = siapkan();
  p.atur(false, 'pagi-ceria');
  p.interaksi();
  assert.equal(p.memutar, null);
  p.atur(true, 'pagi-ceria');
  assert.equal(p.memutar, 'pagi-ceria');
});

test('mengganti lagu: lagu lama berhenti, lagu baru berbunyi, hanya satu yang berbunyi', () => {
  const { p, cari, semua } = siapkan();
  p.atur(true, 'pagi-ceria');
  p.interaksi();
  const lama = cari('/audio/bgm-cerah.mp3')!;
  lama.currentTime = 30;
  p.atur(true, 'bintang-malam');
  const baru = cari('/audio/bgm-malam.mp3')!;
  assert.equal(lama.paused, true);
  assert.equal(lama.currentTime, 0);
  assert.equal(baru.paused, false);
  assert.equal(semua.filter((a) => !a.paused).length, 1);
  p.atur(true, 'hutan-hijau');
  assert.equal(semua.filter((a) => !a.paused).length, 1);
  assert.equal(p.memutar, 'hutan-hijau');
});

test('memilih lagu saat musik dimatikan tidak membuatnya berbunyi', () => {
  const { p, semua } = siapkan();
  p.atur(true, 'pagi-ceria');
  p.interaksi();
  p.atur(false, 'bintang-malam');
  assert.equal(semua.every((a) => a.paused), true);
  p.atur(true, 'bintang-malam');
  assert.equal(p.memutar, 'bintang-malam');
});

test('dipanggil berulang dengan nilai sama tidak memanggil play berulang', () => {
  const { p, cari } = siapkan();
  p.atur(true, 'pagi-ceria');
  p.interaksi();
  for (let i = 0; i < 10; i++) p.atur(true, 'pagi-ceria');
  assert.equal(cari('/audio/bgm-cerah.mp3')!.jumlahPlay, 1);
});

test('ditekan cepat nyala-mati-nyala-mati: keadaan akhir selalu sesuai pilihan terakhir', () => {
  const { p, semua } = siapkan();
  p.interaksi();
  for (const aktif of [true, false, true, false, true, true, false]) p.atur(aktif, 'pagi-ceria');
  assert.equal(p.memutar, null);
  p.atur(true, 'pagi-ceria');
  assert.equal(semua.filter((a) => !a.paused).length, 1);
});

test('peramban memblokir pemutaran: dicoba lagi pada ketukan berikutnya, tanpa mengulang tanpa henti', async () => {
  const { p, semua } = siapkan();
  p.atur(true, 'pagi-ceria');
  // elemen dibuat saat interaksi; paksa galat pada percobaan pertama
  const asli = (p as unknown as { buat: (s: string) => ElemenAudio }).buat;
  (p as unknown as { buat: (s: string) => ElemenAudio }).buat = (src) => {
    const a = asli(src) as AudioPalsu;
    a.galat = 'NotAllowedError';
    return a;
  };
  p.interaksi();
  await tunggu();
  const a = semua[0];
  assert.equal(a.jumlahPlay, 1);
  assert.equal(p.memutar, null);
  p.atur(true, 'pagi-ceria'); // tanpa ketukan baru: tidak mencoba lagi
  assert.equal(a.jumlahPlay, 1);
  a.galat = null; // pengguna mengetuk dan peramban kini mengizinkan
  p.interaksi();
  assert.equal(a.jumlahPlay, 2);
  assert.equal(p.memutar, 'pagi-ceria');
});

test('berkas hilang atau tidak didukung: tidak dicoba terus-menerus', async () => {
  const { p, semua } = siapkan();
  const asli = (p as unknown as { buat: (s: string) => ElemenAudio }).buat;
  (p as unknown as { buat: (s: string) => ElemenAudio }).buat = (src) => {
    const a = asli(src) as AudioPalsu;
    a.galat = 'NotSupportedError';
    return a;
  };
  p.atur(true, 'pagi-ceria');
  p.interaksi();
  await tunggu();
  for (let i = 0; i < 5; i++) p.interaksi();
  assert.equal(semua[0].jumlahPlay, 1);
});

test('tab tersembunyi menjeda musik, kembali terlihat melanjutkan', () => {
  const { p, cari } = siapkan();
  p.atur(true, 'pagi-ceria');
  p.interaksi();
  const a = cari('/audio/bgm-cerah.mp3')!;
  p.sembunyi(true);
  assert.equal(a.paused, true);
  p.sembunyi(false);
  assert.equal(a.paused, false);
  // bila dibisukan saat tab tersembunyi, tidak menyala ketika kembali
  p.sembunyi(true);
  p.atur(false, 'pagi-ceria');
  p.sembunyi(false);
  assert.equal(a.paused, true);
});

test('keluar dari akun (musik dimatikan) menghentikan semua lagu', () => {
  const { p, semua } = siapkan();
  p.atur(true, 'pagi-ceria');
  p.interaksi();
  p.atur(true, 'bintang-malam');
  p.atur(false, 'pagi-ceria');
  assert.equal(semua.every((a) => a.paused), true);
  assert.equal(p.memutar, null);
});
