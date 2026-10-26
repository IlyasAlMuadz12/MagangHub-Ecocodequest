import json, random, itertools
from ecocode_solver import selesaikan, gambar, JENIS

N = 6
RINTANGAN = [1, 3, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10]

ITEM = {  # (organik, anorganik, b3)
 1: ('kulit-pisang','botol-plastik','baterai-bekas'),
 2: ('sisa-nasi','kaleng-minuman','lampu-bekas'),
 3: ('kulit-telur','kantong-plastik','obat-kedaluwarsa'),
 4: ('sayur-busuk','gelas-plastik','obat-nyamuk-semprot'),
 5: ('ampas-teh','botol-kaca','charger-rusak'),
 6: ('daun-kering','botol-minum-plastik','baterai-jam-dinding'),
 7: ('sisa-bekal','bungkus-jajan','tinta-printer-bekas'),
 8: ('kulit-jeruk','kertas-bekas','lampu-neon-bekas'),
 9: ('rumput-potong','penggaris-plastik','kaleng-cat-bekas'),
 10: ('sisa-sayur-kantin','kotak-bekal-plastik','mouse-komputer-rusak'),
 11: ('daun-gugur','botol-plastik','baterai-senter-bekas'),
 12: ('ranting-patah','bungkus-camilan','korek-gas-bekas'),
 13: ('buah-jatuh','kaleng-sarden','semprotan-serangga'),
 14: ('kayu-lapuk','tali-rafia','oli-bekas'),
 15: ('bunga-layu','sedotan-plastik','power-bank-rusak'),
}
JUDUL = {1:'Dapur Mungil',2:'Ruang Makan',3:'Ruang Keluarga',4:'Halaman Rumah',5:'Gudang Kecil',
         6:'Halaman Sekolah',7:'Kantin',8:'Ruang Kelas',9:'Taman Sekolah',10:'Lab Komputer',
         11:'Jalan Setapak',12:'Tempat Berkemah',13:'Tepi Sungai',14:'Hutan Lebat',15:'Puncak Hutan'}
DUNIA = lambda L: 'rumah' if L <= 5 else ('sekolah' if L <= 10 else 'hutan')

def target(L):            # rentang langkah terpendek yang diinginkan
    lo = round(22 + 2.6 * (L - 1)); return lo, lo + 3
def min_efek(L):          # seberapa besar rintangan memaksa jalan memutar
    return [0,2,2,3,4,4,5,5,6,6,7,7,8,8,9][L-1]
def min_lorong(L):        # petak sempit (diapit rintangan/tepi di dua sisi berlawanan)
    return 0 if L <= 7 else (1 if L <= 11 else 2)
def min_lurus(L):         # deret "maju" beruntun pada jalur terpendek (supaya Ulangi berguna)
    return 2 if L <= 2 else 3

START = (1, 1)    # pojok kiri atas, robot menghadap kanan
FINIS = (6, 6)    # pojok kanan bawah

def acak(n_rint, rng):
    sel = [(x, y) for x in range(1, N+1) for y in range(1, N+1) if (x, y) not in (START, FINIS)]
    rng.shuffle(sel); pos = iter(sel)
    cfg = {'robot': {'x': START[0], 'y': START[1], 'hadap': 'kanan'},
           'sampah': [], 'tong': [], 'rintangan': [], 'finish': {'x': FINIS[0], 'y': FINIS[1]}}
    for j in JENIS:
        p = next(pos); cfg['sampah'].append({'x': p[0], 'y': p[1], 'jenis': j})
    tj = JENIS[:]; rng.shuffle(tj)
    for j in tj:
        p = next(pos); cfg['tong'].append({'x': p[0], 'y': p[1], 'jenis': j})
    for _ in range(n_rint):
        p = next(pos); cfg['rintangan'].append({'x': p[0], 'y': p[1]})
    return cfg

def lorong(cfg):
    blok = {(r['x'], r['y']) for r in cfg['rintangan']}
    obj = {(o['x'], o['y']) for k in ('sampah', 'tong') for o in cfg[k]}
    def tutup(x, y): return not (1 <= x <= N and 1 <= y <= N) or (x, y) in blok
    n = 0
    for x in range(1, N+1):
        for y in range(1, N+1):
            if (x, y) in blok or (x, y) in obj: continue
            if (tutup(x-1, y) and tutup(x+1, y)) or (tutup(x, y-1) and tutup(x, y+1)):
                n += 1
    return n

def lurus_maks(rute):
    best = cur = 0
    for r in rute:
        cur = cur + 1 if r == 'maju' else 0
        best = max(best, cur)
    return best

def buat(L, minimal=0):
    rng = random.Random(1000 + L)
    lo, hi = target(L)
    for _ in range(400000):
        cfg = acak(RINTANGAN[L-1], rng)
        langkah, rute = selesaikan(cfg)
        if langkah is None or not (lo <= langkah <= hi) or langkah < minimal: continue
        tanpa, _ = selesaikan(cfg, abaikan_rintangan=True)
        if langkah - tanpa < min_efek(L): continue
        if lorong(cfg) < min_lorong(L): continue
        if lurus_maks(rute) < min_lurus(L): continue
        return cfg, langkah, tanpa, rute
    raise RuntimeError('tidak ketemu level %d' % L)

def ke_db(cfg, L):
    o, a, b = ITEM[L]
    ids = {'organik': o, 'anorganik': a, 'b3': b}
    return {
        'robot': cfg['robot'],
        'sampah': [{'item': ids[s['jenis']], 'x': s['x'], 'y': s['y']} for s in cfg['sampah']],
        'tong': cfg['tong'],
        'rintangan': cfg['rintangan'],
        'finish': cfg['finish'],
    }

if __name__ == '__main__':
    hasil = []
    sebelum = 0
    for L in range(1, 16):
        cfg, langkah, tanpa, rute = buat(L, sebelum)
        sebelum = langkah
        db = ke_db(cfg, L)
        hasil.append({'id': L, 'dunia': DUNIA(L), 'judul': JUDUL[L], 'ukuran_grid': N,
                      'jumlah_rintangan': len(cfg['rintangan']), 'langkah_optimal': langkah,
                      'langkah_tanpa_rintangan': tanpa, 'lorong': lorong(cfg),
                      'waktu_target_detik': 60 + 5 * langkah, 'config': db, 'rute': rute,
                      'gambar': gambar(cfg)})
        print('Level %2d  rintangan %2d  langkah %2d (tanpa rintangan %2d)  lorong %d' %
              (L, len(cfg['rintangan']), langkah, tanpa, lorong(cfg)))
    json.dump(hasil, open('levels_lengkap.json', 'w'), ensure_ascii=False, indent=1)
