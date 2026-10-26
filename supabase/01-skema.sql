-- =====================================================================
-- EcoCode Quest – Skema Supabase (PostgreSQL)
-- Cara pakai: Supabase Dashboard > SQL Editor > tempel seluruh berkas > Run
-- Koordinat papan: x = kolom (K1..K6), y = baris (B1..B6), mulai dari 1
-- =====================================================================

-- ---------- 1. Tipe data ----------
create type public.jenis_sampah as enum ('organik', 'anorganik', 'b3');
create type public.dunia        as enum ('rumah', 'sekolah', 'hutan');
create type public.tema_latar   as enum ('cerah', 'malam', 'hutan');
create type public.peran        as enum ('siswa', 'guru');

-- ---------- 2. Tabel ----------

-- Profil siswa/guru (1 baris per akun di auth.users)
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  username        text not null unique check (char_length(username) between 3 and 30),
  nama_panggilan  text not null check (char_length(nama_panggilan) between 2 and 30),
  kelas           smallint check (kelas in (5, 6)),
  nama_sekolah    text,
  peran           public.peran not null default 'siswa',
  created_at      timestamptz not null default now()
);

-- Pengaturan per siswa: tema, musik (nyala/mati dan lagu pilihan), efek suara, tutorial
create table public.user_settings (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  tema              public.tema_latar not null default 'cerah',
  bgm_aktif         boolean not null default true,
  sfx_aktif         boolean not null default true,
  musik             text not null default 'pagi-ceria'
                    check (musik in ('pagi-ceria', 'bintang-malam', 'hutan-hijau')),  -- lagu pilihan siswa
  tutorial_selesai  boolean not null default false,
  updated_at        timestamptz not null default now()
);

-- Katalog sampah: jenis menentukan tong yang benar
create table public.sampah_items (
  id     text primary key,            -- slug, mis. 'kulit-pisang'
  nama   text not null,
  jenis  public.jenis_sampah not null
);

-- Konfigurasi 15 level
create table public.levels (
  id                  smallint primary key check (id between 1 and 15),
  dunia               public.dunia not null,
  judul               text not null,
  ukuran_grid         smallint not null default 6 check (ukuran_grid between 3 and 8),
  jumlah_rintangan    smallint not null check (jumlah_rintangan >= 1),
  langkah_optimal     smallint not null check (langkah_optimal > 0),   -- jumlah perintah terpendek (dari solver)
  waktu_target_detik  int not null check (waktu_target_detik > 0),     -- acuan bonus kecepatan
  config              jsonb not null check (jsonb_typeof(config) = 'object')
  /* Bentuk config:
     {
       "robot":     { "x": 1, "y": 1, "hadap": "kanan" },
       "sampah":    [ { "item": "sisa-bekal", "x": 3, "y": 2 }, ... ],
       "tong":      [ { "jenis": "organik", "x": 2, "y": 6 }, ... ],
       "rintangan": [ { "x": 3, "y": 3 }, ... ],
       "finish":    { "x": 6, "y": 6 }
     }
     Catatan: tiap level wajib lolos pemeriksaan solver (ada jalan untuk
     mengambil semua sampah, membuangnya ke tong yang benar, lalu finish). */
);

-- Progres terbaik siswa per level
create table public.level_progress (
  user_id              uuid not null references public.profiles (id) on delete cascade,
  level_id             smallint not null references public.levels (id),
  bintang              smallint not null default 0 check (bintang between 0 and 4),
  skor                 int not null default 0,
  waktu_terbaik_detik  int,
  langkah_terbaik      int,
  percobaan            int not null default 0,
  selesai_pertama_at   timestamptz,
  diperbarui_at        timestamptz not null default now(),
  primary key (user_id, level_id)
);

-- Riwayat setiap percobaan (untuk analisis guru dan debugging)
create table public.attempts (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  level_id       smallint not null references public.levels (id),
  berhasil       boolean not null,
  waktu_detik    int not null check (waktu_detik >= 0),
  langkah        int not null check (langkah >= 0),
  kesalahan      smallint not null check (kesalahan between 0 and 4),
  pakai_ulangi   boolean not null default false,
  bintang        smallint not null default 0 check (bintang between 0 and 4),
  skor           int not null default 0,
  program        jsonb,                       -- susunan blok siswa
  created_at     timestamptz not null default now()
);

-- Sertifikat (maksimal satu per siswa)
create table public.sertifikat (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  kode            text not null unique
                  default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  total_bintang   int not null,
  diterbitkan_at  timestamptz not null default now()
);

create index attempts_user_level_idx   on public.attempts (user_id, level_id, created_at desc);
create index progress_level_skor_idx   on public.level_progress (level_id, skor desc);

-- ---------- 3. Akun baru: buat profil dan pengaturan otomatis ----------
-- Saat mendaftar, kirim data lewat options.data di supabase.auth.signUp:
--   { username, nama_panggilan, kelas, nama_sekolah }
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := lower(coalesce(nullif(new.raw_user_meta_data ->> 'username', ''),
                               split_part(new.email, '@', 1)));

  insert into public.profiles (id, username, nama_panggilan, kelas, nama_sekolah)
  values (
    new.id,
    v_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'nama_panggilan', ''), v_username),
    nullif(new.raw_user_meta_data ->> 'kelas', '')::smallint,
    nullif(new.raw_user_meta_data ->> 'nama_sekolah', '')
  );

  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 4. Keamanan (Row Level Security) ----------
alter table public.profiles        enable row level security;
alter table public.user_settings   enable row level security;
alter table public.sampah_items    enable row level security;
alter table public.levels          enable row level security;
alter table public.level_progress  enable row level security;
alter table public.attempts        enable row level security;
alter table public.sertifikat      enable row level security;

create or replace function public.is_guru()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and peran = 'guru');
$$;

-- Profil: baca/ubah milik sendiri; guru boleh membaca semua
create policy profiles_baca    on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_guru());
create policy profiles_ubah    on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Siswa tidak boleh mengubah peran atau username sendiri
revoke update on public.profiles from authenticated;
grant  update (nama_panggilan, kelas, nama_sekolah) on public.profiles to authenticated;

-- Pengaturan: milik sendiri saja
create policy settings_baca    on public.user_settings for select to authenticated
  using (user_id = auth.uid());
create policy settings_ubah    on public.user_settings for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy settings_tambah  on public.user_settings for insert to authenticated
  with check (user_id = auth.uid());

-- Katalog sampah dan level: semua yang sudah masuk boleh membaca
create policy sampah_baca      on public.sampah_items for select to authenticated using (true);
create policy levels_baca      on public.levels       for select to authenticated using (true);

-- Progres, riwayat, sertifikat: baca milik sendiri (guru: semua).
-- Tidak ada policy insert/update: penulisan HANYA lewat fungsi di bawah.
create policy progress_baca    on public.level_progress for select to authenticated
  using (user_id = auth.uid() or public.is_guru());
create policy attempts_baca    on public.attempts for select to authenticated
  using (user_id = auth.uid() or public.is_guru());
create policy sertifikat_baca  on public.sertifikat for select to authenticated
  using (user_id = auth.uid() or public.is_guru());

-- ---------- 5. Fungsi game ----------

-- Kirim hasil satu percobaan. Bintang dan skor dihitung di server.
--   Bintang = jumlah kriteria yang terpenuhi:
--     +1 selesai | +1 memakai Ulangi | +1 tanpa kesalahan | +1 langkah terpendek DAN tanpa kesalahan
--   Nyawa 4 bintang: 4 kesalahan = gagal.
--   Skor = bintang x 100 + bonus kecepatan (0-100, makin cepat dari waktu target makin besar)
create or replace function public.kirim_percobaan(
  p_level_id      smallint,
  p_berhasil      boolean,
  p_waktu_detik   int,
  p_langkah       int,
  p_kesalahan     smallint,
  p_pakai_ulangi  boolean,
  p_program       jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_level    public.levels%rowtype;
  v_prev     public.level_progress%rowtype;
  v_bintang  smallint := 0;
  v_skor     int := 0;
  v_rekor    boolean := false;
begin
  if v_uid is null then
    raise exception 'Belum masuk';
  end if;

  select * into v_level from public.levels where id = p_level_id;
  if not found then
    raise exception 'Level tidak ditemukan';
  end if;

  if p_waktu_detik < 0 or p_langkah < 0 or p_kesalahan < 0 or p_kesalahan > 4 then
    raise exception 'Data percobaan tidak valid';
  end if;

  -- Level terkunci sampai level sebelumnya selesai (minimal 1 bintang)
  if p_level_id > 1 and not exists (
    select 1 from public.level_progress
    where user_id = v_uid and level_id = p_level_id - 1 and bintang >= 1
  ) then
    raise exception 'Level masih terkunci';
  end if;

  if p_berhasil and p_kesalahan <= 3 then
    v_bintang := 1
      + case when p_pakai_ulangi then 1 else 0 end
      + case when p_kesalahan = 0 then 1 else 0 end
      + case when p_kesalahan = 0 and p_langkah <= v_level.langkah_optimal then 1 else 0 end;
    v_skor := v_bintang * 100
      + greatest(0, 100 - (p_waktu_detik * 50) / v_level.waktu_target_detik);
  end if;

  insert into public.attempts
    (user_id, level_id, berhasil, waktu_detik, langkah, kesalahan, pakai_ulangi, bintang, skor, program)
  values
    (v_uid, p_level_id, v_bintang > 0, p_waktu_detik, p_langkah, p_kesalahan,
     p_pakai_ulangi, v_bintang, v_skor, p_program);

  select * into v_prev from public.level_progress
   where user_id = v_uid and level_id = p_level_id;
  v_rekor := v_bintang > 0 and v_skor > coalesce(v_prev.skor, 0);

  insert into public.level_progress as lp
    (user_id, level_id, bintang, skor, waktu_terbaik_detik, langkah_terbaik, percobaan, selesai_pertama_at)
  values
    (v_uid, p_level_id, v_bintang, v_skor,
     case when v_bintang > 0 then p_waktu_detik end,
     case when v_bintang > 0 then p_langkah end,
     1,
     case when v_bintang > 0 then now() end)
  on conflict (user_id, level_id) do update set
    bintang             = greatest(lp.bintang, excluded.bintang),
    skor                = greatest(lp.skor, excluded.skor),
    waktu_terbaik_detik = least(lp.waktu_terbaik_detik, excluded.waktu_terbaik_detik),
    langkah_terbaik     = least(lp.langkah_terbaik, excluded.langkah_terbaik),
    percobaan           = lp.percobaan + 1,
    selesai_pertama_at  = coalesce(lp.selesai_pertama_at, excluded.selesai_pertama_at),
    diperbarui_at       = now();

  return jsonb_build_object('bintang', v_bintang, 'skor', v_skor, 'rekor_baru', v_rekor);
end;
$$;

-- Papan peringkat. p_level_id kosong = total semua level.
-- Selalu menyertakan baris milik pemanggil, walau di luar batas teratas.
create or replace function public.papan_peringkat(
  p_level_id  smallint default null,
  p_kelas     smallint default null,
  p_batas     int default 20
)
returns table (
  peringkat         bigint,
  nama_panggilan    text,
  kelas             smallint,
  level_selesai     bigint,
  total_bintang     bigint,
  total_waktu_detik bigint,
  total_skor        bigint,
  adalah_saya       boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with agg as (
    select
      p.id as uid,
      p.nama_panggilan as nama,
      p.kelas as kls,
      count(*) filter (where lp.bintang >= 1)       as selesai,
      coalesce(sum(lp.bintang), 0)                  as bintang_total,
      coalesce(sum(lp.waktu_terbaik_detik), 0)      as waktu_total,
      coalesce(sum(lp.skor), 0)                     as skor_total
    from public.level_progress lp
    join public.profiles p on p.id = lp.user_id
    where p.peran = 'siswa'
      and (p_level_id is null or lp.level_id = p_level_id)
      and (p_kelas is null or p.kelas = p_kelas)
    group by p.id, p.nama_panggilan, p.kelas
  ),
  ranked as (
    select *, row_number() over (order by skor_total desc, waktu_total asc, uid) as rn
    from agg
  )
  select rn, nama, kls, selesai, bintang_total, waktu_total, skor_total, (uid = auth.uid())
  from ranked
  where rn <= p_batas or uid = auth.uid()
  order by rn;
$$;

-- Klaim sertifikat: hanya jika seluruh level sudah selesai
create or replace function public.klaim_sertifikat()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_selesai int;
  v_total   int;
  v_semua   int;
  v_sert    public.sertifikat%rowtype;
  v_prof    public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'Belum masuk';
  end if;

  select count(*) into v_semua from public.levels;
  select count(*), coalesce(sum(bintang), 0) into v_selesai, v_total
    from public.level_progress where user_id = v_uid and bintang >= 1;

  if v_semua = 0 or v_selesai < v_semua then
    raise exception 'Selesaikan semua level lebih dulu';
  end if;

  insert into public.sertifikat (user_id, total_bintang)
  values (v_uid, v_total)
  on conflict (user_id) do nothing;

  select * into v_sert from public.sertifikat where user_id = v_uid;
  select * into v_prof from public.profiles   where id = v_uid;

  return jsonb_build_object(
    'kode', v_sert.kode,
    'total_bintang', v_sert.total_bintang,
    'diterbitkan_at', v_sert.diterbitkan_at,
    'nama_panggilan', v_prof.nama_panggilan,
    'kelas', v_prof.kelas,
    'nama_sekolah', v_prof.nama_sekolah
  );
end;
$$;

revoke all on function public.kirim_percobaan(smallint, boolean, int, int, smallint, boolean, jsonb) from public;
revoke all on function public.papan_peringkat(smallint, smallint, int) from public;
revoke all on function public.klaim_sertifikat() from public;
grant execute on function public.kirim_percobaan(smallint, boolean, int, int, smallint, boolean, jsonb) to authenticated;
grant execute on function public.papan_peringkat(smallint, smallint, int) to authenticated;
grant execute on function public.klaim_sertifikat() to authenticated;

-- ---------- 6. Data awal: katalog sampah (44 jenis, dari peta Rumah, Sekolah, Hutan) ----------
insert into public.sampah_items (id, nama, jenis) values
  -- Rumah
  ('kulit-pisang',        'Kulit pisang',          'organik'),
  ('botol-plastik',       'Botol plastik',         'anorganik'),
  ('baterai-bekas',       'Baterai bekas',         'b3'),
  ('sisa-nasi',           'Sisa nasi',             'organik'),
  ('kaleng-minuman',      'Kaleng minuman',        'anorganik'),
  ('lampu-bekas',         'Lampu bekas',           'b3'),
  ('kulit-telur',         'Kulit telur',           'organik'),
  ('kantong-plastik',     'Kantong plastik',       'anorganik'),
  ('obat-kedaluwarsa',    'Obat kedaluwarsa',      'b3'),
  ('sayur-busuk',         'Sayur busuk',           'organik'),
  ('gelas-plastik',       'Gelas plastik',         'anorganik'),
  ('obat-nyamuk-semprot', 'Obat nyamuk semprot',   'b3'),
  ('ampas-teh',           'Ampas teh',             'organik'),
  ('botol-kaca',          'Botol kaca',            'anorganik'),
  ('charger-rusak',       'Charger rusak',         'b3'),
  -- Sekolah
  ('daun-kering',         'Daun kering',           'organik'),
  ('botol-minum-plastik', 'Botol minum plastik',   'anorganik'),
  ('baterai-jam-dinding', 'Baterai jam dinding',   'b3'),
  ('sisa-bekal',          'Sisa bekal',            'organik'),
  ('bungkus-jajan',       'Bungkus jajan',         'anorganik'),
  ('tinta-printer-bekas', 'Tinta printer bekas',   'b3'),
  ('kulit-jeruk',         'Kulit jeruk',           'organik'),
  ('kertas-bekas',        'Kertas bekas',          'anorganik'),
  ('lampu-neon-bekas',    'Lampu neon bekas',      'b3'),
  ('rumput-potong',       'Rumput potong',         'organik'),
  ('penggaris-plastik',   'Penggaris plastik',     'anorganik'),
  ('kaleng-cat-bekas',    'Kaleng cat bekas',      'b3'),
  ('sisa-sayur-kantin',   'Sisa sayur kantin',     'organik'),
  ('kotak-bekal-plastik', 'Kotak bekal plastik',   'anorganik'),
  ('mouse-komputer-rusak','Mouse komputer rusak',  'b3'),
  -- Hutan (botol plastik memakai item yang sama dengan Rumah)
  ('daun-gugur',          'Daun gugur',            'organik'),
  ('baterai-senter-bekas','Baterai senter bekas',  'b3'),
  ('ranting-patah',       'Ranting patah',         'organik'),
  ('bungkus-camilan',     'Bungkus camilan',       'anorganik'),
  ('korek-gas-bekas',     'Korek gas bekas',       'b3'),
  ('buah-jatuh',          'Buah jatuh',            'organik'),
  ('kaleng-sarden',       'Kaleng sarden',         'anorganik'),
  ('semprotan-serangga',  'Semprotan serangga',    'b3'),
  ('kayu-lapuk',          'Kayu lapuk',            'organik'),
  ('tali-rafia',          'Tali rafia',            'anorganik'),
  ('oli-bekas',           'Oli bekas',             'b3'),
  ('bunga-layu',          'Bunga layu',            'organik'),
  ('sedotan-plastik',     'Sedotan plastik',       'anorganik'),
  ('power-bank-rusak',    'Power bank rusak',      'b3');

-- Data 15 level (tabel levels) diisi pada langkah berikutnya, setelah
-- konfigurasi tiap level lolos pemeriksaan solver.
