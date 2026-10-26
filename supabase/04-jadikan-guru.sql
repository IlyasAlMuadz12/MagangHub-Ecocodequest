-- =====================================================================
-- EcoCode Quest - Menjadikan sebuah akun sebagai GURU (untuk Dasbor Guru)
--
-- Cara pakai:
-- 1. Guru mendaftar dulu lewat halaman Daftar di game, seperti siswa
--    (catat nama penggunanya, mis. bu.rina).
-- 2. Di Supabase > SQL Editor, ganti 'bu.rina' di bawah dengan nama pengguna
--    guru tersebut, lalu klik Run.
-- 3. Guru keluar lalu masuk lagi. Di layar Peta akan muncul tombol "Dasbor Guru".
--
-- Peran tidak bisa diubah dari dalam game (siswa tidak bisa menjadikan dirinya guru);
-- hanya bisa lewat SQL Editor oleh pemilik proyek.
-- Guru tidak ikut dihitung di papan peringkat siswa.
-- =====================================================================

update public.profiles
set peran = 'guru'
where username = 'bu.rina';

-- Periksa hasilnya: daftar semua guru
select username, nama_panggilan, peran from public.profiles where peran = 'guru';

-- Untuk mengembalikan menjadi siswa:
-- update public.profiles set peran = 'siswa' where username = 'bu.rina';
