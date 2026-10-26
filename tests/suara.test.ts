import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pecahKalimat, pilihSuara } from '../src/lib/suara.ts';
import { LANGKAH_TUTORIAL } from '../src/lib/narasi.ts';

const suara = (lang: string, name: string) => ({ lang, name });

test('pilihSuara: mengenali berbagai penulisan kode bahasa Indonesia, tidak salah memilih Melayu atau Inggris', () => {
  assert.equal(pilihSuara([]), null);
  assert.equal(pilihSuara([suara('en-US', 'Google US English'), suara('ms-MY', 'Microsoft Rizwan')]), null);
  for (const kode of ['id-ID', 'id_ID', 'id', 'in-ID', 'ID-id']) {
    const s = suara(kode, 'Suara');
    assert.equal(pilihSuara([suara('en-US', 'Inggris'), s]), s, kode);
  }
});

test('pilihSuara: bila ada beberapa, nama yang jelas bahasa Indonesia didahulukan', () => {
  const biasa = suara('id-ID', 'Voice 7');
  const google = suara('id-ID', 'Google Bahasa Indonesia');
  const lama = suara('in-ID', 'Voice lama');
  assert.equal(pilihSuara([biasa, google]), google);
  assert.equal(pilihSuara([lama, biasa]), biasa); // id-ID lebih baik daripada in-ID
  assert.equal(pilihSuara([lama]), lama);
  assert.equal(pilihSuara([suara('id-ID', 'Microsoft Andika'), google])?.name, 'Microsoft Andika');
});

test('pecahKalimat: memecah pada titik, tanda seru, dan tanda tanya', () => {
  assert.deepEqual(pecahKalimat('Halo! Apa kabar? Baik. Terima kasih'), ['Halo!', 'Apa kabar?', 'Baik.', 'Terima kasih']);
  assert.deepEqual(pecahKalimat('Satu kalimat saja'), ['Satu kalimat saja']);
  assert.deepEqual(pecahKalimat('   '), []);
  assert.deepEqual(pecahKalimat(''), []);
  assert.deepEqual(pecahKalimat('A.  B.'), ['A.', 'B.']);
});

test('naskah tutorial: lima langkah, judul sesuai, dan enak diucapkan mesin suara', () => {
  assert.deepEqual(LANGKAH_TUTORIAL.map((l) => l.judul), ['Menyusun blok', 'Jenis sampah', 'Warna tong sampah', 'Arah robot', 'Bintang']);
  for (const l of LANGKAH_TUTORIAL) {
    assert.ok(l.narasi.length > 40, l.judul);
    assert.doesNotMatch(l.narasi, /\d/, `${l.judul}: angka harus dieja`); // "B3", "K1" akan terbaca janggal
    assert.doesNotMatch(l.narasi, /\b[A-Z]{2,}\b/, `${l.judul}: hindari singkatan huruf besar`);
    assert.doesNotMatch(l.narasi, /EcoCode/, `${l.judul}: tulis sesuai bunyi`);
    for (const k of pecahKalimat(l.narasi)) assert.ok(k.length <= 200, `${l.judul}: kalimat terlalu panjang (${k.length})`);
  }
});

test('naskah tutorial: setiap langkah menyebut hal pokok yang sama dengan petunjuk tertulis', () => {
  const [susun, jenis, tong, arah, bintang] = LANGKAH_TUTORIAL.map((l) => l.narasi.toLowerCase());
  for (const kata of ['maju', 'ambil', 'buang', 'ulangi', 'start', 'finis']) assert.ok(susun.includes(kata), `langkah 1: ${kata}`);
  for (const kata of ['organik', 'anorganik', 'b tiga']) assert.ok(jenis.includes(kata), `langkah 2: ${kata}`);
  for (const kata of ['hijau', 'kuning', 'merah', 'ditanya']) assert.ok(tong.includes(kata), `langkah 3: ${kata}`);
  for (const kata of ['panah', 'kanan', 'bawah', 'kolom', 'baris']) assert.ok(arah.includes(kata), `langkah 4: ${kata}`);
  for (const kata of ['empat bintang', 'ulangi', 'tanpa kesalahan', 'paling pendek']) assert.ok(bintang.includes(kata), `langkah 5: ${kata}`);
});
