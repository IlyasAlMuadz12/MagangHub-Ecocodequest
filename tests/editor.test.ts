import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buatBlok, tambahKe, hapusBlok, pindahkan, ubahN, temukan, adalahTurunan } from '../src/lib/game/editor.ts';
import type { Program } from '../src/lib/game/types.ts';

const nama = (p: Program): string[] => p.map((b) => (b.tipe === 'ulangi' ? `U${b.n}[${nama(b.isi).join(',')}]` : b.tipe));

test('tambah blok di akhir, di tengah, dan di dalam Ulangi', () => {
  let p: Program = [];
  p = tambahKe(p, null, null, buatBlok('maju'));
  p = tambahKe(p, null, null, buatBlok('kanan'));
  p = tambahKe(p, null, 1, buatBlok('ambil'));
  assert.deepEqual(nama(p), ['maju', 'ambil', 'kanan']);
  const u = buatBlok('ulangi');
  p = tambahKe(p, null, 0, u);
  p = tambahKe(p, u.id, null, buatBlok('maju'));
  p = tambahKe(p, u.id, 0, buatBlok('kiri'));
  assert.deepEqual(nama(p), ['U2[kiri,maju]', 'maju', 'ambil', 'kanan']);
});

test('hapus blok (termasuk di dalam Ulangi)', () => {
  const u = buatBlok('ulangi');
  const m = buatBlok('maju');
  let p: Program = tambahKe([], null, null, u);
  p = tambahKe(p, u.id, null, m);
  const r = hapusBlok(p, m.id);
  assert.deepEqual(nama(r.program), ['U2[]']);
  assert.deepEqual(r.asal, { indukId: u.id, indeks: 0 });
  assert.equal(hapusBlok(p, 'tidak-ada').blok, null);
});

test('pindahkan blok: urutan, ke dalam Ulangi, dan keluar dari Ulangi', () => {
  const a = buatBlok('maju'), b = buatBlok('kanan'), c = buatBlok('ambil');
  let p: Program = [a, b, c];
  p = pindahkan(p, a.id, null, 3); // ke akhir
  assert.deepEqual(nama(p), ['kanan', 'ambil', 'maju']);
  p = pindahkan(p, c.id, null, 0); // ke awal
  assert.deepEqual(nama(p), ['ambil', 'kanan', 'maju']);
  const u = buatBlok('ulangi');
  p = tambahKe(p, null, null, u);
  p = pindahkan(p, a.id, u.id, 0); // ke dalam
  assert.deepEqual(nama(p), ['ambil', 'kanan', 'U2[maju]']);
  p = pindahkan(p, a.id, null, 0); // keluar
  assert.deepEqual(nama(p), ['maju', 'ambil', 'kanan', 'U2[]']);
});

test('Ulangi tidak bisa dimasukkan ke dalam dirinya sendiri atau turunannya', () => {
  const luar = buatBlok('ulangi'), dalam = buatBlok('ulangi');
  let p: Program = tambahKe([], null, null, luar);
  p = tambahKe(p, luar.id, null, dalam);
  assert.equal(adalahTurunan(temukan(p, luar.id)!, dalam.id), true);
  assert.deepEqual(pindahkan(p, luar.id, dalam.id, 0), p);
  assert.deepEqual(pindahkan(p, luar.id, luar.id, 0), p);
});

test('ubah jumlah pengulangan dibatasi 2 sampai 9', () => {
  const u = buatBlok('ulangi');
  let p: Program = tambahKe([], null, null, u);
  p = ubahN(p, u.id, 5);
  assert.equal((temukan(p, u.id) as { n: number }).n, 5);
  p = ubahN(p, u.id, 99);
  assert.equal((temukan(p, u.id) as { n: number }).n, 9);
  p = ubahN(p, u.id, 0);
  assert.equal((temukan(p, u.id) as { n: number }).n, 2);
});
