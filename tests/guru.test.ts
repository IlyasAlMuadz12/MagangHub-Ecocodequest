import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ATURAN_AWAL, bangunDasbor, buatCsv, formatTerakhir, formatWaktu, hariTidakMain, hitungRingkasanKelas, median,
  ringkasSiswa, saring, selCsv, tentukanStatus, urutkan,
} from '../src/lib/guru.ts';
import type { ProgresMentah, SiswaMentah } from '../src/lib/guru.ts';

const HARI = 86_400_000;
const SEKARANG = Date.parse('2026-10-24T08:00:00Z');
const lalu = (hari: number) => new Date(SEKARANG - hari * HARI).toISOString();

const siswa = (id: string, nama: string, kelas: number | null = 5): SiswaMentah => ({ id, username: id, namaPanggilan: nama, kelas, namaSekolah: 'SD Contoh' });
const prog = (userId: string, levelId: number, bintang: number, hariLalu: number, waktu: number | null = 100, percobaan = 1): ProgresMentah => ({
  userId, levelId, bintang, skor: bintang * 100, waktuTerbaikDetik: bintang > 0 ? waktu : null, percobaan, diperbarui: lalu(hariLalu),
});
/** siswa yang menyelesaikan level 1..n masing-masing dengan 3 bintang, terakhir main `hariLalu` hari lalu */
const selesaiSampai = (id: string, n: number, hariLalu: number): ProgresMentah[] => Array.from({ length: n }, (_, i) => prog(id, i + 1, 3, hariLalu + (n - 1 - i), 60 + i));

test('ringkasSiswa: level, bintang, waktu, poin, percobaan, dan terakhir main', () => {
  const p = [prog('a', 1, 4, 5, 50, 2), prog('a', 2, 2, 3, 80, 3), prog('a', 3, 0, 1, null, 4)]; // level 3 dicoba tapi belum selesai
  const [r] = ringkasSiswa([siswa('a', 'Ani')], p);
  assert.equal(r.levelSelesai, 2);
  assert.equal(r.levelTertinggi, 2);
  assert.equal(r.totalBintang, 6);
  assert.equal(r.totalWaktuDetik, 130);
  assert.equal(r.totalSkor, 600);
  assert.equal(r.percobaan, 9);
  assert.equal(r.terakhirMain, Date.parse(lalu(1)));
  assert.equal(r.perLevel.length, 15);
  assert.equal(r.perLevel[2]?.bintang, 0);
  assert.equal(r.perLevel[3], null);
});

test('ringkasSiswa: siswa tanpa data, data siswa lain tidak tercampur, level di luar rentang diabaikan', () => {
  const p = [prog('b', 1, 3, 2), prog('a', 99, 4, 1), prog('a', 0, 4, 1)];
  const [a, b] = ringkasSiswa([siswa('a', 'Ani'), siswa('b', 'Budi')], p);
  assert.equal(a.levelSelesai, 0);
  assert.equal(a.terakhirMain, null);
  assert.equal(b.levelSelesai, 1);
});

test('median', () => {
  assert.equal(median([]), 0);
  assert.equal(median([3]), 3);
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([1, 2, 3, 10]), 2.5);
});

test('status: selesai semua dan belum mulai', () => {
  const d = bangunDasbor([siswa('a', 'Ani'), siswa('b', 'Budi')], selesaiSampai('a', 15, 30), SEKARANG);
  assert.equal(d[0].info.status, 'selesai'); // 30 hari tidak main, tapi sudah selesai semua: tidak dianggap tertinggal
  assert.equal(d[1].info.status, 'belum-mulai');
  assert.deepEqual(d[1].info.alasan, ['Belum pernah bermain']);
});

test('status tertinggal karena jauh di bawah median kelas (ambang 2 level)', () => {
  const siswaKelas = ['a', 'b', 'c', 'd'].map((id) => siswa(id, id.toUpperCase()));
  const p = [...selesaiSampai('a', 8, 0), ...selesaiSampai('b', 8, 0), ...selesaiSampai('c', 7, 0), ...selesaiSampai('d', 5, 0)];
  const d = bangunDasbor(siswaKelas, p, SEKARANG);
  const per = Object.fromEntries(d.map((s) => [s.id, s]));
  assert.equal(per.a.medianKelas, 7.5);
  assert.equal(per.c.info.status, 'aktif'); // 0,5 di bawah median
  assert.equal(per.d.info.status, 'tertinggal'); // 2,5 di bawah median
  assert.deepEqual(per.d.info.alasan, ['2,5 level di bawah median kelas']);
});

test('status tertinggal karena lama tidak bermain (ambang 7 hari), dan dua alasan sekaligus', () => {
  const siswaKelas = ['a', 'b', 'c'].map((id) => siswa(id, id.toUpperCase()));
  const p = [...selesaiSampai('a', 6, 0), ...selesaiSampai('b', 6, 10), ...selesaiSampai('c', 1, 9)];
  const per = Object.fromEntries(bangunDasbor(siswaKelas, p, SEKARANG).map((s) => [s.id, s]));
  assert.equal(per.a.info.status, 'aktif');
  assert.equal(per.b.info.status, 'tertinggal');
  assert.deepEqual(per.b.info.alasan, ['10 hari tidak bermain']);
  assert.equal(per.c.info.status, 'tertinggal');
  assert.deepEqual(per.c.info.alasan, ['5 level di bawah median kelas', '9 hari tidak bermain']);
});

test('aturan bisa diubah guru', () => {
  const siswaKelas = ['a', 'b'].map((id) => siswa(id, id.toUpperCase()));
  const p = [...selesaiSampai('a', 6, 0), ...selesaiSampai('b', 5, 4)];
  const longgar = bangunDasbor(siswaKelas, p, SEKARANG, { ambangLevel: 3, ambangHari: 14 });
  assert.equal(longgar[1].info.status, 'aktif');
  const ketat = bangunDasbor(siswaKelas, p, SEKARANG, { ambangLevel: 1, ambangHari: 3 });
  assert.equal(ketat[1].info.status, 'tertinggal');
});

test('median dihitung per kelas dan hanya dari siswa yang sudah mulai', () => {
  const kelas5 = ['a', 'b', 'c'].map((id) => siswa(id, id, 5));
  const kelas6 = ['x', 'y'].map((id) => siswa(id, id, 6));
  const p = [...selesaiSampai('a', 10, 0), ...selesaiSampai('b', 10, 0), ...selesaiSampai('x', 2, 0), ...selesaiSampai('y', 1, 0)];
  const per = Object.fromEntries(bangunDasbor([...kelas5, ...kelas6], p, SEKARANG).map((s) => [s.id, s]));
  assert.equal(per.a.medianKelas, 10); // 'c' belum mulai, tidak menurunkan median
  assert.equal(per.x.medianKelas, 1.5);
  assert.equal(per.y.info.status, 'aktif'); // kelas 6 dibandingkan dengan teman sekelasnya, bukan kelas 5
});

test('hitungRingkasanKelas', () => {
  const siswaKelas = ['a', 'b', 'c', 'd'].map((id) => siswa(id, id));
  const p = [...selesaiSampai('a', 15, 0), ...selesaiSampai('b', 8, 0), ...selesaiSampai('c', 2, 20)];
  const r = hitungRingkasanKelas(bangunDasbor(siswaKelas, p, SEKARANG));
  assert.deepEqual(r, { jumlah: 4, selesai: 1, aktif: 1, tertinggal: 1, belumMulai: 1, rataLevel: 6.3 });
  assert.equal(hitungRingkasanKelas([]).rataLevel, 0);
});

test('saring: kelas, pencarian nama atau username, dan hanya yang perlu perhatian', () => {
  const siswaKelas = [siswa('rani5', 'Rani', 5), siswa('dimas6', 'Dimas', 6), siswa('putri5', 'Putri', 5)];
  const p = [...selesaiSampai('rani5', 10, 0), ...selesaiSampai('dimas6', 3, 0)];
  const d = bangunDasbor(siswaKelas, p, SEKARANG);
  const semua = { kelas: null, cari: '', hanyaPerhatian: false };
  assert.equal(saring(d, semua).length, 3);
  assert.deepEqual(saring(d, { ...semua, kelas: 6 }).map((s) => s.id), ['dimas6']);
  assert.deepEqual(saring(d, { ...semua, cari: ' RAN ' }).map((s) => s.id), ['rani5']);
  assert.deepEqual(saring(d, { ...semua, cari: 'putri5' }).map((s) => s.id), ['putri5']);
  assert.deepEqual(saring(d, { ...semua, hanyaPerhatian: true }).map((s) => s.id), ['putri5']);
});

test('urutkan: perhatian lebih dulu, nama, level, bintang, waktu, terakhir main; stabil dan tidak mengubah asli', () => {
  const ids = ['a', 'b', 'c', 'd'];
  const p = [...selesaiSampai('a', 4, 0), ...selesaiSampai('b', 9, 2), ...selesaiSampai('c', 9, 0)];
  const d = bangunDasbor(ids.map((id) => siswa(id, id.toUpperCase())), p, SEKARANG);
  const asli = d.map((s) => s.id).join();
  assert.deepEqual(urutkan(d, 'perhatian', true).map((s) => s.id), ['a', 'd', 'b', 'c']); // a tertinggal, d belum mulai
  assert.deepEqual(urutkan(d, 'nama', false).map((s) => s.id), ['d', 'c', 'b', 'a']);
  assert.deepEqual(urutkan(d, 'level', false).map((s) => s.id), ['b', 'c', 'a', 'd']); // b dan c seri: urut nama
  assert.deepEqual(urutkan(d, 'terakhir', false).map((s) => s.id), ['a', 'c', 'b', 'd']); // a dan c sama-sama hari ini: urut nama
  assert.equal(urutkan(d, 'bintang', true)[0].id, 'd');
  assert.equal(urutkan(d, 'waktu', false)[0].totalWaktuDetik >= urutkan(d, 'waktu', false)[1].totalWaktuDetik, true);
  assert.equal(d.map((s) => s.id).join(), asli);
});

test('format waktu dan terakhir main', () => {
  assert.equal(formatWaktu(0), '00:00');
  assert.equal(formatWaktu(65), '01:05');
  assert.equal(formatWaktu(3725), '1:02:05');
  assert.equal(hariTidakMain(null, SEKARANG), null);
  assert.equal(hariTidakMain(SEKARANG + HARI, SEKARANG), 0);
  assert.equal(formatTerakhir(null, SEKARANG), 'Belum pernah');
  assert.equal(formatTerakhir(SEKARANG - 3600_000, SEKARANG), 'Hari ini');
  assert.equal(formatTerakhir(SEKARANG - HARI, SEKARANG), 'Kemarin');
  assert.equal(formatTerakhir(SEKARANG - 5 * HARI, SEKARANG), '5 hari lalu');
  assert.equal(formatTerakhir(SEKARANG - 21 * HARI, SEKARANG), '3 minggu lalu');
  assert.equal(formatTerakhir(SEKARANG - 90 * HARI, SEKARANG), '3 bulan lalu');
});

test('CSV: kolom lengkap, tanda kutip digandakan, rumus Excel dinetralkan', () => {
  assert.equal(selCsv('biasa'), 'biasa');
  assert.equal(selCsv('a,b'), '"a,b"');
  assert.equal(selCsv('dia "bilang"'), '"dia ""bilang"""');
  assert.equal(selCsv('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(selCsv('+62'), "'+62");
  assert.equal(selCsv(null), '');
  assert.equal(selCsv(7), '7');
  const d = bangunDasbor([siswa('rani5', 'Rani, A.'), siswa('b', 'Budi')], selesaiSampai('rani5', 2, 1), SEKARANG);
  const baris = buatCsv(d, SEKARANG).split('\r\n');
  assert.equal(baris.length, 3);
  assert.equal(baris[0].split(',').length, 11);
  assert.match(baris[1], /^"Rani, A\.",rani5,5,2,2,6,/);
  assert.match(baris[2], /,Belum mulai,Belum pernah bermain$/);
});

test('aturan awal: 2 level dan 7 hari', () => {
  assert.deepEqual(ATURAN_AWAL, { ambangLevel: 2, ambangHari: 7 });
  const s = ringkasSiswa([siswa('a', 'A')], selesaiSampai('a', 3, 0))[0];
  assert.equal(tentukanStatus(s, 3, SEKARANG, ATURAN_AWAL).status, 'aktif');
});
