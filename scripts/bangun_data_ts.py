"""Membuat src/lib/game/levels.ts, catalog.ts, dan tests/solusi.json dari hasil solver.
Jalankan dari mana saja:  python3 scripts/bangun_data_ts.py <levels_lengkap.json> <skema.sql>"""
import json, os, re, sys
RAYA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # folder proyek
levels = json.load(open(sys.argv[1]))
sql = open(sys.argv[2]).read()
sql = sql[sql.index('insert into public.sampah_items'):]
rows = re.findall(r"\('([a-z0-9-]+)',\s*'([^']+)',\s*'(organik|anorganik|b3)'\)", sql)
IKON = {
 'kulit-pisang':'🍌','botol-plastik':'🧴','baterai-bekas':'🔋','sisa-nasi':'🍚','kaleng-minuman':'🥫','lampu-bekas':'💡',
 'kulit-telur':'🥚','kantong-plastik':'🛍️','obat-kedaluwarsa':'💊','sayur-busuk':'🥬','gelas-plastik':'🥤','obat-nyamuk-semprot':'🦟',
 'ampas-teh':'🍵','botol-kaca':'🍾','charger-rusak':'🔌','daun-kering':'🍂','botol-minum-plastik':'🚰','baterai-jam-dinding':'🔋',
 'sisa-bekal':'🍱','bungkus-jajan':'🍬','tinta-printer-bekas':'🖨️','kulit-jeruk':'🍊','kertas-bekas':'📄','lampu-neon-bekas':'💡',
 'rumput-potong':'🌱','penggaris-plastik':'📏','kaleng-cat-bekas':'🎨','sisa-sayur-kantin':'🥕','kotak-bekal-plastik':'🥡',
 'mouse-komputer-rusak':'🖱️','daun-gugur':'🍁','baterai-senter-bekas':'🔋','ranting-patah':'🌿','bungkus-camilan':'🍿',
 'korek-gas-bekas':'🔥','buah-jatuh':'🍎','kaleng-sarden':'🐟','semprotan-serangga':'🐛','kayu-lapuk':'🪵','tali-rafia':'🧵',
 'oli-bekas':'🛢️','bunga-layu':'🥀','sedotan-plastik':'🧃','power-bank-rusak':'📱'}
assert len(rows) == 44 and set(IKON) == {r[0] for r in rows}
with open(os.path.join(RAYA, 'src/lib/game/catalog.ts'), 'w') as f:
    f.write("// DIHASILKAN oleh scripts/bangun_data_ts.py dari skema SQL. Jangan diedit tangan.\n")
    f.write("// Ikon masih emoji sebagai pengganti sementara; ganti dengan gambar sendiri bila sudah ada.\n")
    f.write("import type { JenisSampah } from './types.ts';\n\n")
    f.write("export interface ItemSampah { nama: string; jenis: JenisSampah; ikon: string }\n\n")
    f.write("export const KATALOG: Record<string, ItemSampah> = {\n")
    for id_, nama, jenis in rows:
        f.write("  '%s': { nama: '%s', jenis: '%s', ikon: '%s' },\n" % (id_, nama, jenis, IKON[id_]))
    f.write("};\n\nexport function jenisDari(item: string): JenisSampah {\n  const d = KATALOG[item];\n  if (!d) throw new Error('Item sampah tidak dikenal: ' + item);\n  return d.jenis;\n}\n")
with open(os.path.join(RAYA, 'src/lib/game/levels.ts'), 'w') as f:
    f.write("// DIHASILKAN oleh scripts/bangun_data_ts.py dari solver. Harus sama dengan tabel `levels` di Supabase.\n")
    f.write("import type { Level } from './types.ts';\n\nexport const LEVELS: Level[] = ")
    out = []
    for L in levels:
        out.append({'id': L['id'], 'dunia': L['dunia'], 'judul': L['judul'], 'ukuranGrid': L['ukuran_grid'],
                    'jumlahRintangan': L['jumlah_rintangan'], 'langkahOptimal': L['langkah_optimal'],
                    'waktuTargetDetik': L['waktu_target_detik'], 'config': L['config']})
    f.write(json.dumps(out, ensure_ascii=False, indent=2))
    f.write(";\n\nexport function ambilLevel(id: number): Level | undefined {\n  return LEVELS.find((l) => l.id === id);\n}\n")
json.dump({str(L['id']): L['rute'] for L in levels}, open(os.path.join(RAYA, 'tests/solusi.json'), 'w'), indent=1)
print('ok')
