/**
 * Pengelola musik latar: satu sumber kebenaran untuk "apakah musik harus berbunyi sekarang".
 * Tanpa React dan tanpa Audio bawaan peramban (pabriknya disuntikkan), jadi bisa diuji.
 *
 * Musik berbunyi HANYA bila:  aktif  DAN  siswa sudah pernah mengetuk layar  DAN  tab sedang terlihat.
 * Di luar itu semua lagu dijeda. Hanya satu lagu yang boleh berbunyi pada satu waktu.
 */
import { LAGU_AWAL, berkasLagu } from './lagu.ts';
import type { IdLagu } from './lagu.ts';

export interface ElemenAudio {
  loop: boolean;
  volume: number;
  paused: boolean;
  currentTime: number;
  play(): Promise<void>;
  pause(): void;
}
export type PabrikAudio = (src: string) => ElemenAudio;

function namaGalat(e: unknown): string {
  return e && typeof e === 'object' && 'name' in e ? String((e as { name: unknown }).name) : '';
}

export class PengelolaMusik {
  private aktif = false;
  private lagu: IdLagu = LAGU_AWAL;
  private sudahInteraksi = false;
  private tersembunyi = false;
  private readonly elemen = new Map<IdLagu, ElemenAudio>();
  private readonly rusak = new Set<IdLagu>();

  private readonly buat: PabrikAudio;
  private readonly volume: number;

  constructor(buat: PabrikAudio, volume = 0.4) {
    this.buat = buat;
    this.volume = volume;
  }

  /** Atur status musik. Aman dipanggil berulang dengan nilai yang sama. */
  atur(aktif: boolean, lagu: IdLagu): void {
    this.aktif = aktif;
    this.lagu = lagu;
    this.sinkron();
  }

  /** Panggil pada setiap ketukan/klik pengguna (peramban hanya mengizinkan suara setelah itu). */
  interaksi(): void {
    this.sudahInteraksi = true;
    this.sinkron();
  }

  sembunyi(tersembunyi: boolean): void {
    this.tersembunyi = tersembunyi;
    this.sinkron();
  }

  /** Lagu yang sedang berbunyi, atau null. */
  get memutar(): IdLagu | null {
    for (const [id, e] of this.elemen) if (!e.paused) return id;
    return null;
  }

  private ambil(id: IdLagu): ElemenAudio {
    let e = this.elemen.get(id);
    if (!e) {
      e = this.buat(berkasLagu(id));
      e.loop = true;
      e.volume = this.volume;
      this.elemen.set(id, e);
    }
    return e;
  }

  private sinkron(): void {
    const boleh = this.aktif && this.sudahInteraksi && !this.tersembunyi;

    // jeda semua lagu yang tidak boleh berbunyi; lagu lain diulang dari awal bila dipilih lagi
    for (const [id, e] of this.elemen) {
      if (boleh && id === this.lagu) continue;
      if (!e.paused) e.pause();
      if (id !== this.lagu) e.currentTime = 0;
    }
    if (!boleh || this.rusak.has(this.lagu)) return;

    const e = this.ambil(this.lagu);
    if (!e.paused) return;
    const id = this.lagu;
    e.play().catch((err: unknown) => {
      const nama = namaGalat(err);
      if (nama === 'AbortError') return; // dijeda sebelum sempat mulai (mis. ditekan cepat)
      if (nama === 'NotAllowedError') this.sudahInteraksi = false; // diblokir: coba lagi pada ketukan berikutnya
      else this.rusak.add(id); // berkas hilang atau tidak didukung: jangan dicoba terus
    });
  }
}
