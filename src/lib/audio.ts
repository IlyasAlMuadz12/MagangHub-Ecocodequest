/**
 * Audio game.
 * - Efek suara: dibuat dengan WebAudio (tanpa berkas).
 * - Musik latar: dikelola PengelolaMusik (musik.ts); lagunya dipilih siswa (lagu.ts).
 */
import { PengelolaMusik } from './musik.ts';
import type { IdLagu } from './lagu.ts';

export type NamaSfx = 'klik' | 'gerak' | 'ambil' | 'buang' | 'salah' | 'menang';

let ctx: AudioContext | null = null;
let sfxAktif = true;
let pengelola: PengelolaMusik | null = null;

function konteks(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Kelas = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Kelas) return null;
    ctx = new Kelas();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function nada(c: AudioContext, mulai: number, freq: number, durasi: number, tipe: OscillatorType, volume: number, freqAkhir?: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = tipe;
  o.frequency.setValueAtTime(freq, mulai);
  if (freqAkhir) o.frequency.exponentialRampToValueAtTime(freqAkhir, mulai + durasi);
  g.gain.setValueAtTime(volume, mulai);
  g.gain.exponentialRampToValueAtTime(0.0001, mulai + durasi);
  o.connect(g).connect(c.destination);
  o.start(mulai);
  o.stop(mulai + durasi + 0.02);
}

export function sfx(nama: NamaSfx): void {
  if (!sfxAktif) return;
  const c = konteks();
  if (!c) return;
  const t = c.currentTime;
  switch (nama) {
    case 'klik':
      nada(c, t, 660, 0.05, 'triangle', 0.06);
      break;
    case 'gerak':
      nada(c, t, 300, 0.07, 'triangle', 0.07, 380);
      break;
    case 'ambil':
      nada(c, t, 520, 0.08, 'square', 0.05);
      nada(c, t + 0.08, 780, 0.1, 'square', 0.05);
      break;
    case 'buang':
      nada(c, t, 330, 0.09, 'square', 0.05);
      nada(c, t + 0.09, 220, 0.16, 'triangle', 0.08, 150);
      break;
    case 'salah':
      nada(c, t, 180, 0.28, 'sawtooth', 0.07, 100);
      break;
    case 'menang':
      [523, 659, 784, 1047].forEach((f, i) => nada(c, t + i * 0.12, f, 0.22, 'triangle', 0.09));
      break;
  }
}

function ambilPengelola(): PengelolaMusik | null {
  if (typeof window === 'undefined') return null;
  if (!pengelola) {
    const p = new PengelolaMusik((src) => {
      const a = new Audio(src);
      a.preload = 'auto';
      return a;
    }, 0.4);
    pengelola = p;
    // Peramban baru mengizinkan suara setelah ketukan pengguna. Pendengar ini tetap terpasang:
    // bila pemutaran sempat diblokir, ketukan berikutnya mencoba lagi.
    window.addEventListener('pointerdown', () => {
      konteks();
      p.interaksi();
    }, { passive: true });
    document.addEventListener('visibilitychange', () => p.sembunyi(document.hidden));
  }
  return pengelola;
}

/** Satu-satunya pintu untuk mengatur audio. Aman dipanggil berulang. */
export function aturAudio(opsi: { musikAktif: boolean; lagu: IdLagu; sfx: boolean }): void {
  sfxAktif = opsi.sfx;
  ambilPengelola()?.atur(opsi.musikAktif, opsi.lagu);
}
