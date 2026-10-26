import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVELS } from '../src/lib/game/levels.ts';
import { KATALOG } from '../src/lib/game/catalog.ts';
import { BATAS_LANGKAH, Penjalan, jalankan, keadaanAwal, langkahTunggal } from '../src/lib/game/engine.ts';
import { ratakan, ratakanBerjejak, pakaiUlangi, hitungBlok } from '../src/lib/game/program.ts';
import { temukan } from '../src/lib/game/editor.ts';
import { hitungBintang, hitungSkor } from '../src/lib/game/scoring.ts';
import type { Level, Perintah, Program } from '../src/lib/game/types.ts';

const solusi = JSON.parse(readFileSync(new URL('./solusi.json', import.meta.url), 'utf8')) as Record<string, Perintah[]>;

test('ada 15 level; START di K1,B1 menghadap kanan; FINIS di K6,B6; data konsisten', () => {
  assert.equal(LEVELS.length, 15);
  const rintangan = [1, 3, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10];
  LEVELS.forEach((l, i) => {
    assert.equal(l.id, i + 1);
    assert.equal(l.ukuranGrid, 6);
    assert.deepEqual(l.config.robot, { x: 1, y: 1, hadap: 'kanan' });
    assert.deepEqual(l.config.finish, { x: 6, y: 6 });
    assert.equal(l.config.rintangan.length, rintangan[i]);
    assert.equal(l.jumlahRintangan, rintangan[i]);
    assert.deepEqual(l.config.sampah.map((s) => KATALOG[s.item].jenis).sort(), ['anorganik', 'b3', 'organik']);
    assert.deepEqual(l.config.tong.map((t) => t.jenis).sort(), ['anorganik', 'b3', 'organik']);
  });
});

test('rute solver di setiap level (siswa selalu memilih benar): selesai, 0 kesalahan, langkah = langkahOptimal', () => {
  for (const l of LEVELS) {
    const rute = solusi[String(l.id)];
    const h = jalankan(l, rute);
    assert.equal(h.galat, false, `level ${l.id}: ${h.pesan}`);
    assert.equal(h.selesaiMisi, true, `level ${l.id} belum selesai`);
    assert.equal(h.jumlahLangkah, l.langkahOptimal, `level ${l.id}`);
    assert.equal(rute.length, l.langkahOptimal);
  }
});

test('program kosong atau terpotong di tengah tidak dianggap selesai', () => {
  for (const l of LEVELS) {
    assert.equal(jalankan(l, []).selesaiMisi, false);
    const rute = solusi[String(l.id)];
    assert.equal(jalankan(l, rute.slice(0, rute.length - 1)).selesaiMisi, false);
  }
});

// Level mini buatan sendiri. START (1,1) menghadap kanan; sampah berderet di baris 1; tong di kolom 4.
const mini: Level = {
  id: 99, dunia: 'rumah', judul: 'uji', ukuranGrid: 6, jumlahRintangan: 1, langkahOptimal: 18, waktuTargetDetik: 100,
  config: {
    robot: { x: 1, y: 1, hadap: 'kanan' },
    sampah: [
      { item: 'kulit-pisang', x: 2, y: 1 }, // 0 organik
      { item: 'botol-plastik', x: 3, y: 1 }, // 1 anorganik
      { item: 'baterai-bekas', x: 4, y: 1 }, // 2 B3
    ],
    tong: [
      { jenis: 'b3', x: 4, y: 2 },
      { jenis: 'anorganik', x: 4, y: 3 },
      { jenis: 'organik', x: 4, y: 4 },
    ],
    rintangan: [{ x: 1, y: 2 }],
    finish: { x: 6, y: 6 },
  },
};
const AMBIL_SEMUA: Perintah[] = ['maju', 'ambil', 'maju', 'ambil', 'maju', 'ambil'];
const RUTE_PENUH: Perintah[] = [...AMBIL_SEMUA, 'kanan', 'maju', 'buang', 'maju', 'buang', 'maju', 'buang', 'maju', 'maju', 'kiri', 'maju', 'maju'];

test('rute lengkap level mini: ambil semua, buang tiga kali, ke finis', () => {
  const h = jalankan(mini, RUTE_PENUH);
  assert.equal(h.galat, false, h.pesan ?? '');
  assert.equal(h.selesaiMisi, true);
  assert.equal(h.jumlahLangkah, 18);
  assert.equal(h.keadaanAkhir.masuk, 3);
  assert.deepEqual(h.keadaanAkhir.bawa, []);
});

test('robot boleh membawa banyak sampah; urutan tas sesuai pengambilan', () => {
  const h = jalankan(mini, AMBIL_SEMUA);
  assert.equal(h.galat, false);
  assert.deepEqual(h.keadaanAkhir.bawa, [0, 1, 2]);
  assert.deepEqual(h.keadaanAkhir.sisa, [false, false, false]);
});

test('ambil: harus berdiri di petak sampah; petak kosong atau sampah yang sudah diambil salah', () => {
  const dariSamping = jalankan(mini, ['ambil']); // di START (1,1), sampah baru di (2,1)
  assert.equal(dariSamping.galat, true);
  assert.match(dariSamping.pesan ?? '', /Masuklah ke petak sampah/);
  assert.equal(jalankan(mini, ['maju', 'ambil', 'ambil']).galat, true); // sudah diambil
  assert.equal(jalankan(mini, ['maju']).galat, false); // petak sampah boleh diinjak
  assert.deepEqual(jalankan(mini, ['maju']).keadaanAkhir.sisa, [true, true, true]); // diinjak saja belum mengambil
});

test('Buang memunculkan pertanyaan, menunggu jawaban siswa, lalu memproses pilihannya', () => {
  const pj = new Penjalan(mini, RUTE_PENUH);
  let r = pj.berikut();
  let langkah = 0;
  while (r.status === 'langkah') {
    langkah++;
    r = pj.berikut();
  }
  assert.equal(r.status, 'tanya');
  assert.equal(langkah, 8); // 6 perintah maju/ambil + kanan + maju selesai; Buang adalah perintah ke-9
  if (r.status !== 'tanya') return;
  assert.equal(r.pertanyaan.jenisTong, 'b3'); // robot berdiri di tong B3
  assert.deepEqual(r.pertanyaan.pilihan, [0, 1, 2]); // semua sampah di tas
  assert.deepEqual(pj.keadaan.bawa, [0, 1, 2]); // belum ada yang dibuang
  assert.equal(pj.berikut().status, 'tanya'); // tetap menunggu, tidak maju sendiri
  const benar = pj.jawab(2); // baterai bekas = B3
  assert.equal(benar.status, 'langkah');
  if (benar.status === 'langkah') {
    assert.equal(benar.langkah.kejadian, 'buang-benar');
    assert.equal(benar.langkah.jawaban, 2);
  }
  assert.deepEqual(pj.keadaan.bawa, [0, 1]);
  assert.equal(pj.keadaan.masuk, 1);
  assert.throws(() => pj.jawab(0)); // tidak ada pertanyaan yang menunggu
});

test('salah memilih sampah: kesalahan dengan penjelasan, program berhenti', () => {
  const pj = new Penjalan(mini, RUTE_PENUH);
  let r = pj.berikut();
  while (r.status === 'langkah') r = pj.berikut();
  assert.equal(r.status, 'tanya');
  const salah = pj.jawab(0); // kulit pisang (organik) dipilih untuk tong B3
  assert.equal(salah.status, 'galat');
  if (salah.status === 'galat') assert.match(salah.pesan, /Salah! Kulit pisang termasuk sampah organik, bukan sampah B3/);
  assert.equal(pj.hasil().galat, true);
  assert.equal(pj.hasil().selesaiMisi, false);
  assert.equal(pj.berikut().status, 'galat'); // tidak bisa lanjut
  // jalankan sekaligus dengan penjawab yang selalu salah
  const h = jalankan(mini, RUTE_PENUH, () => 0);
  assert.equal(h.galat, true);
  assert.match(h.pesan ?? '', /Salah!/);
});

test('buang: sebelum semua sampah diambil, bukan di tong, tanpa membawa, atau jenis tidak ada di tas', () => {
  const awal = keadaanAwal(mini);
  const diTong = (x: number, y: number, bawa: number[], sisa: boolean[], masuk = 0) => ({ ...awal, x, y, bawa, sisa, masuk });
  const a = langkahTunggal(mini, diTong(4, 2, [0], [false, true, true]), 'buang');
  assert.equal(a.kejadian, 'buang-salah');
  assert.match(a.pesan ?? '', /Ambil semua sampah dulu/);
  const b = langkahTunggal(mini, diTong(4, 2, [], [false, false, false]), 'buang');
  assert.match(b.pesan ?? '', /belum membawa sampah/);
  const c = langkahTunggal(mini, diTong(4, 2, [0, 1], [false, false, false], 1), 'buang'); // tidak membawa B3
  assert.match(c.pesan ?? '', /tidak membawa sampah B3/);
  const d = jalankan(mini, [...AMBIL_SEMUA, 'buang']); // berdiri di (4,1), bukan petak tong
  assert.equal(d.galat, true);
  assert.match(d.pesan ?? '', /Masuklah ke petak tong/);
  const e = langkahTunggal(mini, diTong(4, 2, [0, 1, 2], [false, false, false]), 'buang', 7); // pilihan tidak ada di tas
  assert.equal(e.kejadian, 'buang-salah');
});

test('rintangan, tepi papan, dan petak tong/sampah', () => {
  assert.equal(jalankan(mini, ['kanan', 'maju']).pesan?.includes('rintangan'), true); // (1,2)
  assert.equal(jalankan(mini, ['mundur']).pesan?.includes('keluar'), true); // (0,1)
  assert.equal(jalankan(mini, ['kiri', 'maju']).pesan?.includes('keluar'), true); // (1,0)
  const tong = jalankan(mini, [...AMBIL_SEMUA, 'kanan', 'maju']); // masuk ke petak tong B3
  assert.equal(tong.galat, false);
  assert.deepEqual({ x: tong.keadaanAkhir.x, y: tong.keadaanAkhir.y }, { x: 4, y: 2 });
});

test('berhenti pada kesalahan pertama dan perintah gagal tidak mengubah papan', () => {
  const h = jalankan(mini, ['kanan', 'maju', 'maju']);
  assert.equal(h.langkah.length, 2);
  assert.equal(h.jumlahLangkah, 1);
  assert.deepEqual({ x: h.keadaanAkhir.x, y: h.keadaanAkhir.y }, { x: 1, y: 1 });
});

test('belok kanan dan kiri memutar 90 derajat', () => {
  assert.equal(jalankan(mini, ['kanan', 'kanan', 'kanan', 'kanan', 'kiri']).keadaanAkhir.hadap, 'atas');
  assert.equal(jalankan(mini, ['kanan']).keadaanAkhir.hadap, 'bawah'); // dari kanan, belok kanan -> bawah (B1 ke B6)
});

test('Ulangi: ratakan, pakaiUlangi, hitungBlok', () => {
  const p: Program = [
    { id: 'a', tipe: 'ulangi', n: 3, isi: [{ id: 'b', tipe: 'maju' }, { id: 'c', tipe: 'kanan' }] },
    { id: 'd', tipe: 'ambil' },
  ];
  assert.deepEqual(ratakan(p), ['maju', 'kanan', 'maju', 'kanan', 'maju', 'kanan', 'ambil']);
  assert.equal(pakaiUlangi(p), true);
  assert.equal(hitungBlok(p), 4);
  assert.equal(pakaiUlangi([{ id: 'x', tipe: 'ulangi', n: 2, isi: [] }]), false);
  assert.equal(pakaiUlangi([{ id: 'x', tipe: 'maju' }]), false);
});

test('Ulangi bersarang tidak membuat game macet (batas langkah)', () => {
  const dalam: Program = [{ id: 'i', tipe: 'ulangi', n: 9, isi: [{ id: 'j', tipe: 'ulangi', n: 9, isi: [{ id: 'k', tipe: 'ulangi', n: 9, isi: [{ id: 'l', tipe: 'kanan' }] }] }] }];
  const rata = ratakan(dalam);
  assert.ok(rata.length <= BATAS_LANGKAH + 1);
  const h = jalankan(mini, rata);
  assert.equal(h.terpotong, true);
  assert.equal(h.selesaiMisi, false);
});

test('Ulangi dengan rute solver tetap menghasilkan langkah yang sama', () => {
  // ubah deretan "maju" beruntun menjadi blok Ulangi; hasil harus identik
  for (const l of LEVELS) {
    const rute = solusi[String(l.id)];
    const program: Program = [];
    let i = 0;
    let id = 0;
    while (i < rute.length) {
      let j = i;
      while (j < rute.length && rute[j] === rute[i]) j++;
      const jumlah = j - i;
      if (rute[i] === 'maju' && jumlah >= 2) {
        program.push({ id: 'u' + id++, tipe: 'ulangi', n: jumlah, isi: [{ id: 'm' + id++, tipe: 'maju' }] });
      } else {
        for (let k = 0; k < jumlah; k++) program.push({ id: 'b' + id++, tipe: rute[i] as Perintah } as never);
      }
      i = j;
    }
    assert.deepEqual(ratakan(program), rute);
    assert.equal(jalankan(l, ratakan(program)).selesaiMisi, true);
  }
});

test('penilaian bintang dan skor', () => {
  const dasar = { berhasil: true, kesalahan: 0, pakaiUlangi: true, langkah: 30, langkahOptimal: 30 };
  assert.equal(hitungBintang(dasar), 4);
  assert.equal(hitungBintang({ ...dasar, langkah: 31 }), 3);
  assert.equal(hitungBintang({ ...dasar, pakaiUlangi: false }), 3);
  assert.equal(hitungBintang({ ...dasar, kesalahan: 1 }), 2);
  assert.equal(hitungBintang({ ...dasar, kesalahan: 2, pakaiUlangi: false }), 1);
  assert.equal(hitungBintang({ ...dasar, kesalahan: 4 }), 0);
  assert.equal(hitungBintang({ ...dasar, berhasil: false }), 0);
  // sama dengan SQL: bintang x 100 + greatest(0, 100 - (waktu*50)/target)
  assert.equal(hitungSkor(4, 0, 200), 500);
  assert.equal(hitungSkor(4, 200, 200), 450);
  assert.equal(hitungSkor(4, 400, 200), 400);
  assert.equal(hitungSkor(3, 999, 200), 300);
  assert.equal(hitungSkor(0, 10, 200), 0);
  assert.equal(hitungSkor(2, 101, 300), 200 + 100 - Math.floor((101 * 50) / 300));
});

test('keadaan awal sesuai konfigurasi level: di START, tas kosong', () => {
  for (const l of LEVELS) {
    const k = keadaanAwal(l);
    assert.deepEqual({ x: k.x, y: k.y, hadap: k.hadap }, { x: 1, y: 1, hadap: 'kanan' });
    assert.deepEqual(k.bawa, []);
    assert.equal(k.masuk, 0);
    assert.equal(k.sisa.every(Boolean), true);
  }
});

// ---------- penanda blok yang sedang berjalan ----------

test('ratakanBerjejak: setiap perintah tahu blok asalnya', () => {
  const p: Program = [{ id: 'k1', tipe: 'kanan' }, { id: 'm1', tipe: 'maju' }];
  assert.deepEqual(ratakanBerjejak(p), [
    { perintah: 'kanan', blokId: 'k1', ulangi: [] },
    { perintah: 'maju', blokId: 'm1', ulangi: [] },
  ]);
});

test('ratakanBerjejak: Ulangi mencatat putaran ke berapa dari berapa', () => {
  const p: Program = [
    { id: 'u', tipe: 'ulangi', n: 3, isi: [{ id: 'm', tipe: 'maju' }, { id: 'k', tipe: 'kanan' }] },
    { id: 'a', tipe: 'ambil' },
  ];
  const j = ratakanBerjejak(p);
  assert.equal(j.length, 7);
  assert.deepEqual(j[0], { perintah: 'maju', blokId: 'm', ulangi: [{ id: 'u', ke: 1, dari: 3 }] });
  assert.deepEqual(j[3], { perintah: 'kanan', blokId: 'k', ulangi: [{ id: 'u', ke: 2, dari: 3 }] });
  assert.deepEqual(j[4], { perintah: 'maju', blokId: 'm', ulangi: [{ id: 'u', ke: 3, dari: 3 }] });
  assert.deepEqual(j[6], { perintah: 'ambil', blokId: 'a', ulangi: [] });
});

test('ratakanBerjejak: Ulangi bersarang mencatat semua tingkat; hasilnya sama dengan ratakan', () => {
  const p: Program = [{ id: 'luar', tipe: 'ulangi', n: 2, isi: [{ id: 'dalam', tipe: 'ulangi', n: 2, isi: [{ id: 'm', tipe: 'maju' }] }] }];
  const j = ratakanBerjejak(p);
  assert.equal(j.length, 4);
  assert.deepEqual(j[3].ulangi, [{ id: 'luar', ke: 2, dari: 2 }, { id: 'dalam', ke: 2, dari: 2 }]);
  assert.deepEqual(j.map((l) => l.perintah), ratakan(p));
  assert.equal(ratakanBerjejak(p, 3).length, 3); // batas dihormati
});

test('rute solver sebagai program ber-Ulangi: setiap langkah menunjuk ke blok yang ada di program', () => {
  for (const l of LEVELS) {
    const rute = solusi[String(l.id)];
    const program: Program = [];
    let i = 0;
    let id = 0;
    while (i < rute.length) {
      let j = i;
      while (j < rute.length && rute[j] === rute[i]) j++;
      if (rute[i] === 'maju' && j - i >= 2) program.push({ id: 'u' + id++, tipe: 'ulangi', n: j - i, isi: [{ id: 'm' + id++, tipe: 'maju' }] });
      else for (let k = i; k < j; k++) program.push({ id: 'b' + id++, tipe: rute[i] as Perintah } as never);
      i = j;
    }
    const jejak = ratakanBerjejak(program);
    assert.deepEqual(jejak.map((x) => x.perintah), rute);
    for (const x of jejak) {
      const blok = temukan(program, x.blokId);
      assert.ok(blok, `blok ${x.blokId} tidak ada`);
      assert.equal(blok?.tipe, x.perintah);
      for (const u of x.ulangi) assert.equal(temukan(program, u.id)?.tipe, 'ulangi');
    }
  }
});

test('Langkah mencatat indeks perintah; kesalahan menunjuk ke blok yang benar-benar salah', () => {
  const program: Program = [
    { id: 'blok-kanan', tipe: 'kanan' },
    { id: 'blok-maju-1', tipe: 'maju' }, // (1,2) adalah rintangan: di sinilah salahnya
    { id: 'blok-maju-2', tipe: 'maju' },
  ];
  const jejak = ratakanBerjejak(program);
  const h = jalankan(mini, jejak.map((x) => x.perintah));
  assert.deepEqual(h.langkah.map((x) => x.indeks), [0, 1]); // berhenti di indeks 1
  const salah = h.langkah[h.langkah.length - 1];
  assert.equal(salah.kejadian, 'tabrak');
  assert.equal(jejak[salah.indeks].blokId, 'blok-maju-1');
  // langkah sukses mencatat indeks berurutan
  const sukses = jalankan(mini, RUTE_PENUH);
  assert.deepEqual(sukses.langkah.map((x) => x.indeks), RUTE_PENUH.map((_, i) => i));
});

test('saat menunggu jawaban Buang, Penjalan menunjuk ke perintah Buang itu', () => {
  const pj = new Penjalan(mini, RUTE_PENUH);
  let r = pj.berikut();
  while (r.status === 'langkah') r = pj.berikut();
  assert.equal(r.status, 'tanya');
  assert.equal(pj.indeks, RUTE_PENUH.indexOf('buang'));
  const benar = pj.jawab(2);
  assert.equal(benar.status, 'langkah');
  if (benar.status === 'langkah') assert.equal(benar.langkah.indeks, RUTE_PENUH.indexOf('buang'));
});
