import json, re
from generate_levels import ITEM, RINTANGAN
from ecocode_solver import ARAH, DX, DY

levels = json.load(open('levels_lengkap.json'))
sql_items = open('../supabase/01-skema.sql').read(); sql_items = sql_items[sql_items.index('insert into public.sampah_items'):]
katalog = dict((m[0], m[1]) for m in re.findall(r"\('([a-z0-9-]+)',\s*'[^']+',\s*'(organik|anorganik|b3)'\)", sql_items))
assert len(katalog) == 44, len(katalog)

def simulasi(cfg, rute, ukuran=6):
    """Simulator mandiri (ditulis terpisah dari solver): jalankan rute, hitung kesalahan, cek misi selesai.
    Pada Buang, siswa dianggap selalu memilih sampah yang tepat."""
    x, y, f = cfg['robot']['x'], cfg['robot']['y'], ARAH.index(cfg['robot']['hadap'])
    di_papan = {(s['x'], s['y']): katalog[s['item']] for s in cfg['sampah']}
    tong = {(t['x'], t['y']): t['jenis'] for t in cfg['tong']}
    rint = {(r['x'], r['y']) for r in cfg['rintangan']}
    tas, salah, masuk = [], 0, 0
    for p in rute:
        if p in ('maju', 'mundur'):
            d = 1 if p == 'maju' else -1
            nx, ny = x + d * DX[f], y + d * DY[f]
            if not (1 <= nx <= ukuran and 1 <= ny <= ukuran) or (nx, ny) in rint:
                salah += 1
            else:
                x, y = nx, ny
        elif p == 'kanan': f = (f + 1) % 4
        elif p == 'kiri': f = (f - 1) % 4
        elif p == 'ambil':
            if (x, y) in di_papan: tas.append(di_papan.pop((x, y)))   # ambil di petak yang diinjak
            else: salah += 1
        elif p == 'buang':
            jenis = tong.get((x, y))
            if jenis is None or di_papan or jenis not in tas: salah += 1   # bukan tong / belum semua diambil / tidak ada yang cocok
            else: tas.remove(jenis); masuk += 1                            # siswa memilih sampah yang tepat
    selesai = (not di_papan) and not tas and masuk == 3 and (x, y) == (cfg['finish']['x'], cfg['finish']['y'])
    return salah, selesai

semua = set()
for L in levels:
    c = L['config']; i = L['id']
    sel = [(c['robot']['x'], c['robot']['y'])] + [(s['x'], s['y']) for s in c['sampah']] + \
          [(t['x'], t['y']) for t in c['tong']] + [(r['x'], r['y']) for r in c['rintangan']] + [(c['finish']['x'], c['finish']['y'])]
    assert len(sel) == len(set(sel)), 'petak bentrok di level %d' % i
    assert all(1 <= a <= 6 and 1 <= b <= 6 for a, b in sel)
    assert len(c['rintangan']) == RINTANGAN[i-1] == L['jumlah_rintangan']
    assert sorted(katalog[s['item']] for s in c['sampah']) == ['anorganik', 'b3', 'organik']
    assert sorted(t['jenis'] for t in c['tong']) == ['anorganik', 'b3', 'organik']
    assert tuple(s['item'] for s in c['sampah'] ) and {s['item'] for s in c['sampah']} == set(ITEM[i])
    assert c['robot'] == {'x': 1, 'y': 1, 'hadap': 'kanan'}, 'START harus di K1,B1 menghadap kanan (level %d)' % i
    assert c['finish'] == {'x': 6, 'y': 6}, 'FINIS harus di K6,B6 (level %d)' % i
    salah, selesai = simulasi(c, L['rute'])
    assert salah == 0 and selesai and len(L['rute']) == L['langkah_optimal'], 'rute level %d gagal' % i
    semua.update(s['item'] for s in c['sampah'])
print('Semua 15 level lolos: tidak ada petak bentrok, jumlah rintangan sesuai, rute solver lolos simulator tanpa kesalahan.')
print('Item sampah unik dipakai:', len(semua), 'dari 44')

# data awal SQL
baris = []
for L in levels:
    cfg = json.dumps(L['config'], ensure_ascii=False, separators=(',', ':'))
    baris.append("  (%d, '%s', '%s', %d, %d, %d, %d, '%s'::jsonb)" % (
        L['id'], L['dunia'], L['judul'].replace("'", "''"), L['ukuran_grid'], L['jumlah_rintangan'],
        L['langkah_optimal'], L['waktu_target_detik'], cfg))
sql = """-- =====================================================================
-- EcoCode Quest – Data awal 15 level
-- Jalankan SETELAH 01-skema.sql. Aman dijalankan ulang: level yang sudah ada diperbarui.
-- Setiap level sudah diperiksa solver: ada jalan untuk mengambil 3 sampah,
-- membuangnya ke tong yang benar, lalu menuju finis.
-- langkah_optimal = jumlah langkah dasar terpendek (hasil solver).
-- waktu_target_detik = 60 + 5 x langkah_optimal.
-- =====================================================================
insert into public.levels
  (id, dunia, judul, ukuran_grid, jumlah_rintangan, langkah_optimal, waktu_target_detik, config)
values
""" + ",\n".join(baris) + """
on conflict (id) do update set
  dunia = excluded.dunia,
  judul = excluded.judul,
  ukuran_grid = excluded.ukuran_grid,
  jumlah_rintangan = excluded.jumlah_rintangan,
  langkah_optimal = excluded.langkah_optimal,
  waktu_target_detik = excluded.waktu_target_detik,
  config = excluded.config;
"""
open('../supabase/02-data-level.sql', 'w').write(sql)

# ringkasan terbaca manusia
out = ['# EcoCode Quest – Peta 15 Level', '',
       'Legenda: `>` `v` `<` `^` robot (arah hadap), `o` `a` `b` sampah organik/anorganik/B3 (robot masuk ke petaknya lalu Ambil), `O` `A` `B` tong (robot masuk ke petaknya lalu Buang),',
       '`O` `A` `B` tong organik/anorganik/B3, `#` rintangan, `F` finis. Kolom K1..K6 ke kanan, baris B1..B6 ke bawah.', '']
out += ['| Level | Dunia | Judul | Rintangan | Langkah terpendek | Waktu target |', '|---|---|---|---|---|---|']
for L in levels:
    out.append('| %d | %s | %s | %d | %d | %d dtk |' % (L['id'], L['dunia'].capitalize(), L['judul'], L['jumlah_rintangan'], L['langkah_optimal'], L['waktu_target_detik']))
out.append('')
for L in levels:
    c = L['config']; o, a, b = ITEM[L['id']]
    out += ['## Level %d – %s (%s)' % (L['id'], L['judul'], L['dunia'].capitalize()),
            'Sampah: %s (organik), %s (anorganik), %s (B3)  ' % (o.replace('-', ' '), a.replace('-', ' '), b.replace('-', ' ')),
            'Rintangan: %d · Langkah terpendek: %d' % (L['jumlah_rintangan'], L['langkah_optimal']), '',
            '```', L['gambar'], '```', '']
open('../peta-level.md', 'w').write('\n'.join(out))
