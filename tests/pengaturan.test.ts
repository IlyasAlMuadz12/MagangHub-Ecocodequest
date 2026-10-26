import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PENGATURAN_AWAL, bacaLokal, bersihkan, gabungkan, tulisLokal } from '../src/lib/pengaturan.ts';
import type { Pengaturan, Penyimpanan } from '../src/lib/pengaturan.ts';

function penyimpananPalsu(): Penyimpanan & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}
const contoh = (u: Partial<Pengaturan>): Pengaturan => ({ ...PENGATURAN_AWAL, ...u });

test('bersihkan: data rusak diganti nilai awal, data sah dipertahankan', () => {
  assert.deepEqual(bersihkan(null), PENGATURAN_AWAL);
  assert.deepEqual(bersihkan('aneh'), PENGATURAN_AWAL);
  assert.deepEqual(bersihkan({ tema: 'ungu', bgmAktif: 'ya', musik: 'lagu-x' }), PENGATURAN_AWAL);
  const sah = { tema: 'malam', bgmAktif: false, sfxAktif: false, tutorialSelesai: true, musik: 'hutan-hijau' };
  assert.deepEqual(bersihkan(sah), sah);
});

test('gabungkan: yang terbaru menang, null ditangani', () => {
  const a = contoh({ bgmAktif: false, musik: 'hutan-hijau' });
  const b = contoh({ bgmAktif: true, musik: 'pagi-ceria' });
  assert.deepEqual(gabungkan(null, null), PENGATURAN_AWAL);
  assert.deepEqual(gabungkan({ nilai: a, ts: 5 }, null), a);
  assert.deepEqual(gabungkan(null, { nilai: b, ts: 5 }), b);
  assert.deepEqual(gabungkan({ nilai: a, ts: 10 }, { nilai: b, ts: 5 }), a); // lokal lebih baru
  assert.deepEqual(gabungkan({ nilai: a, ts: 5 }, { nilai: b, ts: 10 }), b); // database lebih baru
  assert.deepEqual(gabungkan({ nilai: a, ts: 7 }, { nilai: b, ts: 7 }), a); // sama: pilihan di perangkat menang
});

test('penyimpanan lokal: tulis lalu baca, terpisah per akun', () => {
  const st = penyimpananPalsu();
  const p1 = contoh({ bgmAktif: false, musik: 'bintang-malam' });
  tulisLokal('akun-1', p1, st, 123);
  tulisLokal('akun-2', contoh({ musik: 'hutan-hijau' }), st, 456);
  assert.deepEqual(bacaLokal('akun-1', st), { nilai: p1, ts: 123 });
  assert.equal(bacaLokal('akun-2', st)?.nilai.musik, 'hutan-hijau');
  assert.equal(bacaLokal('akun-3', st), null);
});

test('penyimpanan lokal rusak atau tidak tersedia tidak membuat error', () => {
  const st = penyimpananPalsu();
  st.setItem('ecocode.pengaturan.v1.x', '{bukan json');
  assert.equal(bacaLokal('x', st), null);
  assert.equal(bacaLokal('x', null), null);
  assert.doesNotThrow(() => tulisLokal('x', PENGATURAN_AWAL, null));
  const penuh: Penyimpanan = { getItem: () => null, setItem: () => { throw new Error('penuh'); } };
  assert.doesNotThrow(() => tulisLokal('x', PENGATURAN_AWAL, penuh));
  st.setItem('ecocode.pengaturan.v1.y', JSON.stringify({ nilai: { musik: 'hutan-hijau', bgmAktif: false } }));
  assert.deepEqual(bacaLokal('y', st), { nilai: contoh({ musik: 'hutan-hijau', bgmAktif: false }), ts: 0 });
});
