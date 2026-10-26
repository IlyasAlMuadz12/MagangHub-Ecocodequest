"""
Solver EcoCode Quest.

Aturan (harus sama persis dengan src/lib/game/engine.ts):
- Papan 6x6. x = kolom (K1..K6), y = baris (B1..B6), mulai dari 1.
- START selalu di K1,B1 dengan robot menghadap kanan; FINIS di K6,B6.
- Arah hadap: kanan (+x), bawah (+y), kiri (-x), atas (-y).
- Perintah dasar, tiap eksekusi dihitung 1 langkah:
    maju / mundur : pindah 1 petak
    kanan / kiri  : belok 90 derajat
    ambil : ambil sampah di petak YANG SEDANG DIINJAK robot. Robot boleh membawa banyak sampah.
    buang : hanya setelah SEMUA sampah diambil. Robot harus berdiri di petak tong; sistem menanyakan
            "mana sampah <jenis tong>?" dari sampah yang dibawa, dan siswa memilih. Pilihan benar =
            sampah itu masuk tong. (Solver selalu memilih yang benar.)
- Petak sampah dan petak tong boleh diinjak. Hanya rintangan dan tepi papan yang tidak bisa dimasuki.
- Kesalahan (kurangi 1 nyawa): menabrak tepi atau rintangan; ambil di petak tanpa sampah; buang di petak
  yang bukan tong; buang sebelum semua sampah diambil; buang tanpa membawa sampah; buang di tong yang
  jenisnya tidak ada di tas robot; salah memilih sampah pada pertanyaan.
- Misi selesai: semua sampah masuk tong yang benar DAN robot berada di petak finis.
- langkah_optimal = jumlah langkah dasar terpendek. Ulangi {n} tidak mengurangi hitungan langkah.
"""
from collections import deque

ARAH = ['kanan', 'bawah', 'kiri', 'atas']
DX = [1, 0, -1, 0]
DY = [0, 1, 0, -1]
JENIS = ['organik', 'anorganik', 'b3']


def selesaikan(config, ukuran=6, abaikan_rintangan=False, boleh_mundur=True):
    """BFS terpendek. Mengembalikan (langkah, daftar_perintah) atau (None, None).
    boleh_mundur=False dipakai untuk mengukur seberapa berguna perintah Mundur."""
    robot = config['robot']
    sampah = [(s['x'], s['y'], s['jenis']) for s in config['sampah']]
    tong = {(t['x'], t['y']): t['jenis'] for t in config['tong']}
    rint = set() if abaikan_rintangan else {(r['x'], r['y']) for r in config['rintangan']}
    finis = (config['finish']['x'], config['finish']['y'])
    n = len(sampah)
    sampah_pos = {(s[0], s[1]): i for i, s in enumerate(sampah)}

    def kosong(x, y):
        # petak sampah dan petak tong boleh diinjak; hanya rintangan dan tepi yang menghalangi
        if not (1 <= x <= ukuran and 1 <= y <= ukuran):
            return False
        return (x, y) not in rint

    # keadaan: (x, y, arah, bawa, sisa). bawa = sampah di tas robot, sisa = sampah yang masih di papan (bitmask)
    awal = (robot['x'], robot['y'], ARAH.index(robot['hadap']), 0, (1 << n) - 1)
    antre = deque([awal])
    asal = {awal: None}
    while antre:
        s = antre.popleft()
        x, y, f, bawa, sisa = s
        if sisa == 0 and bawa == 0 and (x, y) == finis:
            rute = []
            while asal[s] is not None:
                s, p = asal[s]
                rute.append(p)
            return len(rute), rute[::-1]
        langkah = []
        nx, ny = x + DX[f], y + DY[f]
        if kosong(nx, ny):
            langkah.append(('maju', (nx, ny, f, bawa, sisa)))
        bx, by = x - DX[f], y - DY[f]
        if kosong(bx, by):
            langkah.append(('mundur', (bx, by, f, bawa, sisa)))
        langkah.append(('kanan', (x, y, (f + 1) % 4, bawa, sisa)))
        langkah.append(('kiri', (x, y, (f - 1) % 4, bawa, sisa)))
        i = sampah_pos.get((x, y))                      # sampah di petak yang sedang diinjak
        if i is not None and sisa >> i & 1:
            langkah.append(('ambil', (x, y, f, bawa | (1 << i), sisa & ~(1 << i))))
        jenis_tong = tong.get((x, y))                   # tong di petak yang sedang diinjak
        if jenis_tong is not None and sisa == 0 and bawa != 0:
            for j in range(n):
                if bawa >> j & 1 and sampah[j][2] == jenis_tong:
                    langkah.append(('buang', (x, y, f, bawa & ~(1 << j), sisa)))
        for nama, t in langkah:
            if t not in asal:
                asal[t] = (s, nama)
                antre.append(t)
    return None, None


def gambar(config, ukuran=6):
    """Gambar ASCII: > v < ^ robot, o a b sampah, O A B tong, # rintangan, F finis."""
    g = [['.'] * ukuran for _ in range(ukuran)]
    lamb = {'organik': 'o', 'anorganik': 'a', 'b3': 'b'}
    for r in config['rintangan']:
        g[r['y'] - 1][r['x'] - 1] = '#'
    for s in config['sampah']:
        g[s['y'] - 1][s['x'] - 1] = lamb[s['jenis']]
    for t in config['tong']:
        g[t['y'] - 1][t['x'] - 1] = lamb[t['jenis']].upper()
    g[config['finish']['y'] - 1][config['finish']['x'] - 1] = 'F'
    rb = config['robot']
    g[rb['y'] - 1][rb['x'] - 1] = {'kanan': '>', 'bawah': 'v', 'kiri': '<', 'atas': '^'}[rb['hadap']]
    return '\n'.join(' '.join(b) for b in g)
