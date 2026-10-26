-- =====================================================================
-- EcoCode Quest - Migrasi: pilihan lagu per siswa
-- Jalankan HANYA bila database dibuat sebelum fitur "pilih musik" ada
-- (database baru dari 01-skema.sql versi terbaru sudah memuat ini).
-- Aman dijalankan berulang kali.
-- =====================================================================

-- 1. Kolom lagu pilihan siswa
alter table public.user_settings
  add column if not exists musik text not null default 'pagi-ceria'
  check (musik in ('pagi-ceria', 'bintang-malam', 'hutan-hijau'));

-- 2. Izin menambah baris pengaturan milik sendiri (untuk akun lama yang barisnya belum ada)
drop policy if exists settings_tambah on public.user_settings;
create policy settings_tambah on public.user_settings for insert to authenticated
  with check (user_id = auth.uid());
