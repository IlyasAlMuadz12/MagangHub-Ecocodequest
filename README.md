# EcoCode Quest

Game edukasi pemilahan sampah berbasis blok perintah ala Scratch untuk siswa SD kelas 5–6.
Next.js (App Router) + TypeScript + Tailwind CSS v4 + Supabase.

## Menjalankan

1. **Supabase**: buat proyek, lalu di SQL Editor jalankan berurutan
   `supabase/01-skema.sql` dan `supabase/02-data-level.sql`.
   (Database yang dibuat sebelum fitur pilih musik: jalankan juga `supabase/03-migrasi-musik.sql`.
   Untuk akun guru: lihat bagian Dasbor guru di bawah.)
   Di *Authentication > Providers > Email*, matikan **Confirm email**
   (siswa masuk dengan nama pengguna yang dipetakan ke email internal `nama@ecocode.siswa`).
2. Salin `.env.example` menjadi `.env.local`, isi URL dan anon key dari *Project Settings > API*.
3. `npm install` lalu `npm run dev`, buka http://localhost:3000.
4. Musik latar sudah termasuk di `public/audio/` (3 lagu, satu per tema).

## Pengujian

`npm test` menjalankan 64 uji tanpa dependensi tambahan (Node 22.6+):
mesin game diuji dengan rute solver untuk ke-15 level, penilaian bintang, logika editor blok,
perilaku musik (bisukan, nyalakan, ganti lagu, autoplay diblokir), penyimpanan pengaturan, dan logika dasbor guru.

## Dasbor guru

Halaman `/guru` menampilkan progres semua siswa: level tertinggi, total bintang, total waktu, poin, kapan terakhir bermain,
serta siapa yang tertinggal. Tab **Per level** menampilkan peta panas bintang tiap siswa pada 15 level. Bisa disaring per kelas
atau nama, diurutkan, dan diunduh sebagai CSV (terbuka di Excel).

- **Menjadikan akun guru**: guru mendaftar seperti siswa, lalu jalankan `supabase/04-jadikan-guru.sql` (ganti nama penggunanya).
  Setelah masuk ulang, layar Peta menampilkan tombol "Dasbor Guru".
- **Keamanan**: yang membatasi data adalah database (RLS), bukan tampilan. Akun siswa hanya bisa membaca datanya sendiri,
  dan peran tidak bisa diubah dari dalam game.
- **Aturan "tertinggal"** (bisa diubah guru di halaman): belum menyelesaikan semua level DAN (level selesainya 2 level atau lebih
  di bawah median teman sekelas ATAU 7 hari atau lebih tidak bermain). Median dihitung per kelas, hanya dari siswa yang sudah mulai.
  Status lain: Aktif, Belum mulai (belum pernah mencoba), Selesai semua. Logikanya ada di `src/lib/guru.ts`.

## Audio

- **Musik latar**: siswa memilih sendiri dari tiga lagu bersemangat (ditampilkan hanya sebagai Lagu 1, 2, 3) lewat tombol
  "Pilih musik" di Peta dan Game. Tombol musik di sebelahnya membisukan dan menyalakan musik.
  `bgm-cerah.mp3` = Lagu 1 (chip-pop 144 bpm), `bgm-malam.mp3` = Lagu 2 (dance 128 bpm), `bgm-hutan.mp3` = Lagu 3 (ska/petualangan 156 bpm).
  Dibuat oleh `scripts/buat_musik.py` (numpy, scipy, ffmpeg), jadi bebas hak cipta; boleh ditimpa dengan musik lain.
- **Aturan musik** (`src/lib/musik.ts`): berbunyi hanya bila musik menyala, siswa sudah mengetuk layar,
  dan tab terlihat; hanya satu lagu berbunyi pada satu waktu.
- **Pengaturan** (`src/lib/pengaturan.ts`): disimpan di perangkat (langsung berlaku) dan di database (cadangan
  lintas perangkat). Pemuatan ulang data tidak menimpa pengaturan.
- **Suara bacaan tutorial**: tiap langkah tutorial dibacakan dengan suara bawaan peramban (Web Speech, bahasa Indonesia),
  lengkap dengan tombol Dengarkan/Berhenti dan saklar "Suara otomatis" (pilihannya diingat di perangkat). Naskahnya ada di
  `src/lib/narasi.ts` (angka dan singkatan dieja agar enak diucapkan); pemutarnya di `src/components/useSuara.ts`.
  Ada tidaknya suara bahasa Indonesia bergantung pada perangkat; bila tidak ada, siswa diberi tahu dan tetap bisa membaca petunjuk tertulis.
- **Efek suara**: dibuat peramban lewat WebAudio (`src/lib/audio.ts`), tanpa berkas.

## Struktur

| Folder | Isi |
|---|---|
| `src/lib/game/` | Mesin game murni: `engine.ts` (aturan gerak), `program.ts` (Ulangi), `scoring.ts` (bintang dan skor), `editor.ts` (operasi blok), `levels.ts` dan `catalog.ts` (dihasilkan skrip) |
| `src/lib/` | `api.ts` (Supabase), `audio.ts` (efek suara + pintu musik), `musik.ts` (aturan musik), `lagu.ts` (daftar lagu), `pengaturan.ts`, `tema.ts` |
| `src/components/` | `Papan`, `RuangBlok` (drag-and-drop), `Peringkat`, `Tutorial`, `KontrolMusik` dan `PilihMusik`, `DasborGuru`, `gambar` (SVG), `AuthProvider` |
| `src/app/` | `/masuk`, `/peta`, `/main/[level]`, `/sertifikat`, `/guru` |
| `scripts/` | Solver dan pembuat level (Python) |
| `supabase/` | Skema dan data awal database |

## Aturan penting (harus sama di mesin TypeScript, solver Python, dan fungsi SQL)

- Papan 6×6. `x` = kolom K1..K6, `y` = baris B1..B6. **START** selalu di K1,B1 (robot menghadap kanan) dan **FINIS** di K6,B6.
- Maju mengikuti arah panah. Belok Kanan dari arah kanan menghadap bawah (B1 ke B6).
- **Ambil**: robot harus masuk ke petak sampah dulu; sampah diambil dari petak yang sedang diinjak. Robot boleh membawa banyak sampah (tas).
- **Buang**: hanya setelah SEMUA sampah diambil. Robot harus masuk ke petak tong; sistem menanyakan "mana sampah <jenis tong>?"
  dan siswa memilih dari isi tas. Salah pilih = kesalahan (nyawa -1).
- Petak sampah dan petak tong boleh dilewati. Hanya rintangan dan tepi papan yang tidak bisa dimasuki.
- **Penanda blok**: saat program berjalan, blok yang sedang dieksekusi disorot kuning (Ulangi menampilkan "putaran ke-n dari m"). Bila terjadi kesalahan, blok penyebabnya ditandai merah "Salah di sini" dan tetap menyala sampai siswa mengubah susunan blok. Logikanya: `ratakanBerjejak` di `src/lib/game/program.ts` dan `Langkah.indeks` di `engine.ts`.
- Label sampah di papan sengaja netral (tidak berwarna tong) supaya jawabannya tidak terbongkar.
- Satu kali Jalankan berhenti pada kesalahan pertama: nyawa −1, papan kembali ke awal.
- Bintang = 1 (selesai) + 1 (pakai Ulangi) + 1 (tanpa salah) + 1 (langkah terpendek dan tanpa salah).
- Skor = bintang × 100 + bonus kecepatan 0–100.

## Mengubah level

Edit `scripts/generate_levels.py` (jumlah rintangan, target langkah, daftar sampah), lalu:

```
cd scripts && python3 generate_levels.py && python3 finalisasi.py   # juga menulis ../peta-level.md
python3 bangun_data_ts.py levels_lengkap.json ../supabase/01-skema.sql
```

`finalisasi.py` memeriksa setiap level dengan simulator terpisah. Jalankan ulang `02-data-level.sql` di
Supabase setelah level berubah (gunakan `truncate public.levels cascade` terlebih dulu bila perlu).

## Yang belum ada

- Ikon sampah masih emoji sebagai pengganti sementara (lihat `catalog.ts`).
- Sorotan blok yang sedang dijalankan, dan animasi kemenangan.
