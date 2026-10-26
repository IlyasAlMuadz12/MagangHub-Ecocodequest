"""
Membuat 3 musik latar EcoCode Quest yang bersemangat (gubahan asli, dibuat dengan kode, bebas hak cipta):
  bgm-cerah.mp3  Lagu 1  chip-pop     144 bpm  C mayor   lead kotak, arpeggio 16, drum empat-ketukan
  bgm-malam.mp3  Lagu 2  dance        128 bpm  A minor   pad berdenyut (sidechain), bas offbeat, clap
  bgm-hutan.mp3  Lagu 3  ska/petualangan 156 bpm F mayor gitar offbeat, bas berjalan, lead brass, konga
Semua bisa diulang mulus (gema di ujung dilipat ke awal). Nama berkas dipertahankan agar pengaturan lama tetap jalan.

Jalankan:  python3 scripts/buat_musik.py   -> menulis ke public/audio/ (butuh numpy, scipy, ffmpeg)
"""
import os, subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 44100
RAYA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KELUAR = os.path.join(RAYA, 'public', 'audio')

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def tarik(n): return np.arange(int(n)) / SR

HP = butter(4, 6500, 'high', fs=SR, output='sos')
BP_SNARE = butter(2, [1400, 7500], 'band', fs=SR, output='sos')
BP_KLAP = butter(2, [900, 3800], 'band', fs=SR, output='sos')
RNG = np.random.default_rng(5)
NOISE = RNG.standard_normal(SR * 2)
def derau(n, mulai=0): return NOISE[mulai:mulai + int(n)]

# ---------- bentuk gelombang terbatas pita ----------
def saw_add(f, t, harm=12):
    K = max(1, min(harm, int(SR * 0.45 / f)))
    s = np.zeros_like(t)
    for k in range(1, K + 1): s += np.sin(2*np.pi*k*f*t) / k
    return s * 0.55

def kotak_add(f, t, harm=15):
    K = max(1, min(harm, int(SR * 0.45 / f)))
    s = np.zeros_like(t)
    for k in range(1, K + 1, 2): s += np.sin(2*np.pi*k*f*t) / k
    return s * 0.75

def pita(t, dur, a, r): return np.minimum(t / a, 1.0) * np.clip((dur - t) / r, 0, 1)

# ---------- drum ----------
def kick():
    t = tarik(SR * 0.36)
    f = 46 + 135 * np.exp(-t * 34)
    s = np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-t * 8.0)
    return (s + derau(len(t)) * np.exp(-t * 450) * 0.12) * 1.0

def snare():
    t = tarik(SR * 0.24)
    n = sosfilt(BP_SNARE, derau(len(t), 9000)) * np.exp(-t * 22) * 0.9
    return n * 0.7 + np.sin(2*np.pi*185*t) * np.exp(-t * 30) * 0.5

def klap():
    t = tarik(SR * 0.3)
    n = sosfilt(BP_KLAP, derau(len(t), 20000))
    e = sum(np.where(t >= o, np.exp(-(t - o) * d), 0) for o, d in ((0, 90), (0.011, 90), (0.022, 24)))
    return n * e * 0.85

def hat(terbuka=False):
    t = tarik(SR * (0.3 if terbuka else 0.07))
    return sosfilt(HP, derau(len(t), 31000)) * np.exp(-t * (13 if terbuka else 75)) * (0.2 if terbuka else 0.16)

def kayu():
    t = tarik(SR * 0.12)
    return (np.sin(2*np.pi*900*t) + 0.4*np.sin(2*np.pi*1350*t)) * np.exp(-t * 48) * 0.3

def konga(f=210):
    t = tarik(SR * 0.22)
    fr = f * (1 + 0.35 * np.exp(-t * 45))
    return (np.sin(2*np.pi*np.cumsum(fr)/SR) * np.exp(-t * 17) + derau(len(t), 40000) * np.exp(-t * 300) * 0.1) * 0.6

# ---------- instrumen nada ----------
def lead_chip(f, dur):
    t = tarik(SR * dur)
    s = kotak_add(f, t) + 0.5 * kotak_add(f * 1.004, t)
    return s * pita(t, dur, 0.004, 0.05) * (0.78 + 0.22 * np.exp(-t * 9)) * 0.42

def arp_chip(f, dur=0.12):
    t = tarik(SR * dur)
    return kotak_add(f, t, 9) * np.exp(-t * 22) * pita(t, dur, 0.002, 0.03) * 0.3

def bas_saw(f, dur):
    t = tarik(SR * dur)
    s = np.sin(2*np.pi*f*t) + 0.45 * sum(np.sin(2*np.pi*k*f*t) / k for k in range(2, 6))
    return s * np.exp(-t * 5.5) * pita(t, dur, 0.002, 0.04) * 0.75

def pad_super(freqs, dur):
    t = tarik(SR * dur)
    s = np.zeros_like(t)
    for f in freqs:
        for d in (-0.007, 0.0, 0.007): s += saw_add(f * (1 + d), t, 8)
    return s / (3 * len(freqs)) * pita(t, dur, 0.03, 0.12) * 1.2

def saw_pluck(f, dur=0.2):
    t = tarik(SR * dur)
    return (saw_add(f, t, 11) + 0.4 * saw_add(f * 1.006, t, 11)) * np.exp(-t * 11) * pita(t, dur, 0.003, 0.04) * 0.5

def brass(f, dur):
    t = tarik(SR * dur)
    s = saw_add(f, t, 10) + 0.6 * saw_add(f * 1.005, t, 10)
    return s * pita(t, dur, 0.02, 0.06) * (1 - 0.35 * np.exp(-t * 14)) * 0.36

def petik(f, dur=0.5):
    t = tarik(SR * dur)
    s = sum((1.0/k) * np.sin(2*np.pi*k*f*t) * np.exp(-t * (6 + 3.2*k)) for k in range(1, 7))
    return s * (1 - np.exp(-t * 600)) * 0.55

def duck(sig, mulai, beat, dalam=0.7, cepat=9.0):
    """Efek sidechain: suara menunduk tiap ketukan kick lalu naik lagi."""
    t = mulai + np.arange(len(sig)) / SR
    return sig * (1 - dalam * np.exp(-np.mod(t, beat) * cepat))

# ---------- kanvas stereo ----------
class Mix:
    def __init__(self, panjang_detik, ekor=4.0):
        self.n = int(SR * panjang_detik)
        self.buf = np.zeros((self.n + int(SR*ekor), 2))
    def tambah(self, sig, mulai, pan=0.5, gain=1.0):
        i = int(round(mulai * SR))
        j = min(i + len(sig), len(self.buf))
        if i >= len(self.buf): return
        s = sig[:j-i] * gain
        self.buf[i:j, 0] += s * np.cos(pan * np.pi/2)
        self.buf[i:j, 1] += s * np.sin(pan * np.pi/2)
    def selesai(self, panjang_ir=0.6, basah=0.1, peluruh=4.0):
        rng = np.random.default_rng(11)
        t = tarik(SR * panjang_ir)
        keluar = np.zeros_like(self.buf)
        for c in (0, 1):
            ir = rng.standard_normal(len(t)) * np.exp(-t * peluruh)
            ir[0] = 0
            ir /= np.sqrt(np.sum(ir**2))
            wet = fftconvolve(self.buf[:, c], ir)[:len(self.buf)]
            keluar[:, c] = self.buf[:, c] * (1 - basah) + wet * basah * 1.4
        ekor = keluar[self.n:]
        hasil = keluar[:self.n].copy()
        hasil[:len(ekor)] += ekor[:len(hasil)]       # lipat ekor ke awal: pengulangan mulus
        return hasil / np.max(np.abs(hasil)) * 0.84

# ---------- bahan musik ----------
def segitiga(akar, jenis): return [akar, akar + (4 if jenis == 'M' else 3), akar + 7]
def skala(pc, rendah, tinggi): return [m for m in range(rendah, tinggi + 1) if m % 12 in pc]

POLA_RAMAI = [[1,0,1,1,0,1,1,0], [1,1,0,1,1,0,1,0], [1,0,1,0,1,1,0,1], [1,1,1,0,1,0,1,1], [1,0,0,1,1,0,1,1]]

def lagu_melodi(rng, nada, akord, pola, awal):
    idx, hasil = awal, []
    for ak in akord:
        pc_ak = {m % 12 for m in ak}
        p = pola[rng.integers(len(pola))]
        ons = [s for s in range(8) if p[s]]
        bar_not = []
        for k, s in enumerate(ons):
            if s in (0, 4):
                cand = [i for i in range(max(0, idx-3), min(len(nada), idx+4)) if nada[i] % 12 in pc_ak]
                if cand: idx = min(cand, key=lambda i: abs(i - idx) + rng.random()*0.6)
            else:
                idx = int(np.clip(idx + rng.choice([-2, -1, -1, 0, 1, 1, 2]), 0, len(nada)-1))
            akhir = ons[k+1] if k+1 < len(ons) else 8
            bar_not.append((s, nada[idx], akhir - s))
        hasil.append(bar_not)
    return hasil

def susun(rng, frasa_akord, pola, nada, urut, awal):
    kamus, hasil = {}, []
    for kunci in urut:
        dasar = kunci.rstrip('2')
        akord = frasa_akord[dasar]
        if dasar not in kamus: kamus[dasar] = lagu_melodi(rng, nada, akord, pola, awal)
        frasa = [list(b) for b in kamus[dasar]]
        if kunci.endswith('2'): frasa[3] = lagu_melodi(rng, nada, akord[3:], pola, awal)[0]
        hasil.append((akord, frasa))
    return hasil

# ---------- Lagu 1: chip-pop ----------
def lagu_1():
    bpm = 144; st = 60/bpm/2; bar = st*8
    rng = np.random.default_rng(1101)
    C, G, Am, F = segitiga(48,'M'), segitiga(43,'M'), segitiga(45,'m'), segitiga(41,'M')
    frasa = {'A': [C, G, Am, F], 'B': [Am, F, C, G], 'C': [F, G, C, C]}
    bagian = susun(rng, frasa, POLA_RAMAI, skala({0,2,4,5,7,9,11}, 72, 95), ['A','A2','B','B2','A','A2','C'], 5)
    m = Mix(7*4*bar)
    t0 = 0.0
    for akord_f, mel_f in bagian:
        for bi, (ak, mel) in enumerate(zip(akord_f, mel_f)):
            akar = ak[0] - 12 if ak[0] >= 48 else ak[0]
            for s, off in enumerate([0, 0, 12, 0, 0, 12, 0, 7]):
                m.tambah(bas_saw(mtof(akar + off), st*0.9), t0 + s*st, 0.5, 0.8)
            for s in (0, 2, 4, 6): m.tambah(kick(), t0 + s*st, 0.5, 0.95)
            for s in (2, 6): m.tambah(snare(), t0 + s*st, 0.5, 0.8)
            for s in range(8):
                if s in (3, 7): m.tambah(hat(True), t0 + s*st, 0.62, 0.8)
                else: m.tambah(hat(False), t0 + s*st, 0.6, 0.55 if s % 2 == 0 else 0.8)
            if bi == 3:
                for s in (6, 7): m.tambah(snare(), t0 + s*st + st/2, 0.5, 0.55)
            for k in range(16):
                m.tambah(arp_chip(mtof(ak[[0, 1, 2, 1][k % 4]] + 12)), t0 + k*st/2, 0.3 if k % 2 else 0.7, 0.55)
            for s, nt, pj in mel:
                m.tambah(lead_chip(mtof(nt), min(pj*st*0.95, 0.9)), t0 + s*st, 0.5, 0.8)
            t0 += bar
    return m.selesai(0.5, 0.08, 4.5)

# ---------- Lagu 2: dance ----------
def lagu_2():
    bpm = 128; st = 60/bpm/2; bar = st*8; beat = 2*st
    rng = np.random.default_rng(2202)
    Am, F, C, G = segitiga(45,'m'), segitiga(41,'M'), segitiga(48,'M'), segitiga(43,'M')
    frasa = {'A': [Am, F, C, G], 'B': [F, G, Am, C]}
    pola = [[1,0,1,0,1,1,0,1], [1,1,0,1,0,1,1,0], [1,0,1,1,0,1,0,1], [1,1,0,0,1,1,0,1]]
    bagian = susun(rng, frasa, pola, skala({0,2,4,5,7,9,11}, 69, 91), ['A','A','B','A2','B','B2'], 6)
    m = Mix(6*4*bar)
    t0 = 0.0
    for akord_f, mel_f in bagian:
        for bi, (ak, mel) in enumerate(zip(akord_f, mel_f)):
            akar = ak[0] - 12 if ak[0] >= 48 else ak[0]
            m.tambah(duck(pad_super([mtof(x + 12) for x in ak], bar + 0.15), t0, beat), t0, 0.5, 0.75)
            for s in (1, 3, 5, 7): m.tambah(bas_saw(mtof(akar), st*0.85), t0 + s*st, 0.5, 0.95)   # bas offbeat
            for s in (0, 2, 4, 6): m.tambah(kick(), t0 + s*st, 0.5, 1.0)
            for s in (2, 6): m.tambah(klap(), t0 + s*st, 0.5, 0.85)
            for s in (1, 3, 5, 7): m.tambah(hat(True), t0 + s*st, 0.62, 0.7)
            for k in range(16): m.tambah(hat(False), t0 + k*st/2 + st/4, 0.4, 0.3)
            if bi == 3:
                for k in range(8): m.tambah(snare(), t0 + 4*st + k*st/2, 0.5, 0.25 + 0.07*k)       # gulungan snare
            for k in range(16):
                m.tambah(duck(saw_pluck(mtof(ak[[0, 2, 1, 2][k % 4]] + 24), 0.11), t0 + k*st/2, beat, 0.5), t0 + k*st/2, 0.25 if k % 2 else 0.75, 0.55)
            for s, nt, pj in mel:
                m.tambah(saw_pluck(mtof(nt), min(pj*st*0.9 + 0.05, 0.4)), t0 + s*st, 0.5, 0.95)
            t0 += bar
    return m.selesai(0.6, 0.12, 4.0)

# ---------- Lagu 3: ska / petualangan ----------
def lagu_3():
    bpm = 156; st = 60/bpm/2; bar = st*8
    rng = np.random.default_rng(3303)
    F, Dm, Bb, C, Gm = segitiga(41,'M'), segitiga(50,'m'), segitiga(46,'M'), segitiga(48,'M'), segitiga(43,'m')
    frasa = {'A': [F, Dm, Bb, C], 'B': [Gm, Bb, F, C], 'C': [F, Bb, C, F]}
    pola = [[1,0,1,1,0,1,0,1], [1,1,0,1,0,1,1,0], [1,0,0,1,1,0,1,1], [1,1,1,0,0,1,0,1]]
    bagian = susun(rng, frasa, pola, skala({0,2,4,5,7,9,10}, 65, 88), ['A','A2','B','B2','A','A2','B','C'], 6)
    m = Mix(8*4*bar)
    t0 = 0.0
    for akord_f, mel_f in bagian:
        for bi, (ak, mel) in enumerate(zip(akord_f, mel_f)):
            akar = ak[0] - 12 if ak[0] >= 48 else ak[0]
            jalan = [0, ak[1] - ak[0], ak[2] - ak[0], ak[1] - ak[0]]                    # bas berjalan
            for k, s in enumerate((0, 2, 4, 6)): m.tambah(bas_saw(mtof(akar + jalan[k]), st*1.7), t0 + s*st, 0.5, 0.9)
            for s in (1, 3, 5, 7):                                                        # gitar offbeat (ska)
                for j, nt in enumerate(ak):
                    m.tambah(petik(mtof(nt + 12), 0.28), t0 + s*st + j*0.008, 0.38, 0.5)
            for s in (0, 4): m.tambah(kick(), t0 + s*st, 0.5, 0.95)
            for s in (2, 6): m.tambah(snare(), t0 + s*st, 0.5, 0.7); m.tambah(kayu(), t0 + s*st, 0.65, 0.7)
            for s in range(8): m.tambah(hat(False), t0 + s*st, 0.6, 0.5 if s % 2 == 0 else 0.8)
            for s in (3, 5, 7): m.tambah(konga(230 if s != 5 else 170), t0 + s*st, 0.7, 0.5)
            if bi == 3:
                for s in (6, 7): m.tambah(snare(), t0 + s*st + st/2, 0.5, 0.5)
            for s, nt, pj in mel:
                m.tambah(brass(mtof(nt), min(pj*st*0.85 + 0.04, 0.5)), t0 + s*st, 0.52, 0.9)
            t0 += bar
    return m.selesai(0.5, 0.09, 4.5)

TARGET_LUFS = -15.0   # kekerasan tiap berkas; di game diputar dengan volume 0.4

def ukur_lufs(wav):
    e = subprocess.run(['ffmpeg', '-nostats', '-i', wav, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float([l for l in e.splitlines() if 'I:' in l and 'LUFS' in l][-1].split()[1])

def simpan(nama, audio):
    os.makedirs(KELUAR, exist_ok=True)
    wav = os.path.join(KELUAR, nama + '.wav')
    wavfile.write(wav, SR, (audio * 32767).astype(np.int16))
    gain = 10 ** ((TARGET_LUFS - ukur_lufs(wav)) / 20)
    x = np.tanh(audio * gain * 1.25) / 1.25                    # pembatas lembut agar puncak aman
    x = x / max(1.0, np.max(np.abs(x)) / 0.60)                 # puncak maksimum sekitar -4,4 dBFS (ruang untuk MP3)
    wavfile.write(wav, SR, (x * 32767).astype(np.int16))
    mp3 = os.path.join(KELUAR, nama + '.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '160k', '-ar', '44100', mp3], check=True)
    os.remove(wav)
    return mp3

if __name__ == '__main__':
    for nama, fn in (('bgm-cerah', lagu_1), ('bgm-malam', lagu_2), ('bgm-hutan', lagu_3)):
        print(nama, simpan(nama, fn()))
