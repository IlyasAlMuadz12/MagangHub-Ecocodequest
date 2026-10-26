import type { Arah, Dunia, JenisSampah } from '@/lib/game/types.ts';

const INK = '#14342B';

export const WARNA_TONG: Record<JenisSampah, { badan: string; tutup: string; teks: string; label: string }> = {
  organik: { badan: '#187A41', tutup: '#0F5A2F', teks: '#FFFFFF', label: 'ORGANIK' },
  anorganik: { badan: '#F6C02B', tutup: '#C48F0A', teks: '#14342B', label: 'ANORGANIK' },
  b3: { badan: '#D93A32', tutup: '#A52A23', teks: '#FFFFFF', label: 'B3' },
};

export const NAMA_JENIS: Record<JenisSampah, string> = { organik: 'Organik', anorganik: 'Anorganik', b3: 'B3' };

export function Logo({ ukuran = 44 }: { ukuran?: number }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="4" y="4" width="40" height="40" rx="12" fill="#187A41" />
      <path d="M14 30c0-9 6-14 18-14 0 10-5 16-14 16" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 34c3-6 7-9 12-11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Bintang({ isi, ukuran = 18 }: { isi: boolean; ukuran?: number }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"
        fill={isi ? '#F6C02B' : '#E4EBE7'}
        stroke={isi ? INK : '#8A9A92'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BarisBintang({ jumlah, ukuran = 18 }: { jumlah: number; ukuran?: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${jumlah} dari 4 bintang`}>
      {[0, 1, 2, 3].map((i) => (
        <Bintang key={i} isi={i < jumlah} ukuran={ukuran} />
      ))}
    </span>
  );
}

/** Ikon garis sederhana (viewBox 24) */
export function Ikon({ d, ukuran = 22, warna = INK, tebal = 2.4 }: { d: string; ukuran?: number; warna?: string; tebal?: number }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke={warna} strokeWidth={tebal} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export const IKON_D = {
  maju: 'M12 19V5M6 11l6-6 6 6',
  mundur: 'M12 5v14M6 13l6 6 6-6',
  kanan: 'M5 19v-6a4 4 0 0 1 4-4h10M15 5l4 4-4 4',
  kiri: 'M19 19v-6a4 4 0 0 0-4-4H5M9 5L5 9l4 4',
  ambil: 'M12 4v10M7 9l5 5 5-5M5 20h14',
  buang: 'M12 14V4M7 9l5-5 5 5M5 20h14',
  ulangi: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
  kembali: 'M15 5l-7 7 7 7',
  tutup: 'M6 6l12 12M18 6L6 18',
  piala: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3',
  musik: 'M9 18V6l11-2v12M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  matahari: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  bulan: 'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z',
  pohon: 'M12 3l6 8h-3l4 6H5l4-6H6zM12 17v4',
  kunci: 'M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3',
  unduh: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  jam: 'M12 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9v4l3 2M9 2h6',
  main: 'M7 4l13 8-13 8z',
  daftarLagu: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  suara: 'M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
} as const;

/** Ikon musik; bila dibisukan, diberi garis coret merah supaya jelas. */
export function IkonMusik({ mati, ukuran = 22 }: { mati: boolean; ukuran?: number }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g opacity={mati ? 0.45 : 1}>
        <path d={IKON_D.musik} />
      </g>
      {mati && (
        <>
          <path d="M3.5 3.5L20.5 20.5" stroke="#fff" strokeWidth="5.5" />
          <path d="M3.5 3.5L20.5 20.5" stroke="#D93A32" strokeWidth="2.6" />
        </>
      )}
    </svg>
  );
}

/** Robot dengan panah merah yang menunjukkan arah hadap (wajah selalu tegak). */
export function RobotSvg({ hadap, className }: { hadap: Arah; className?: string }) {
  const sudut = { kanan: 0, bawah: 90, kiri: 180, atas: 270 }[hadap];
  const nama = { kanan: 'kanan', bawah: 'bawah', kiri: 'kiri', atas: 'atas' }[hadap];
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={`Robot menghadap ${nama}`}>
      <rect x="27" y="29" width="46" height="36" rx="11" fill="#4C9BE8" stroke={INK} strokeWidth="3" />
      <circle cx="40" cy="45" r="7" fill="#fff" stroke={INK} strokeWidth="2.5" />
      <circle cx="60" cy="45" r="7" fill="#fff" stroke={INK} strokeWidth="2.5" />
      <circle cx="40" cy="45" r="3" fill={INK} />
      <circle cx="60" cy="45" r="3" fill={INK} />
      <rect x="35" y="67" width="30" height="11" rx="5.5" fill="#F6C02B" stroke={INK} strokeWidth="3" />
      <g transform={`rotate(${sudut} 50 50)`}>
        <path d="M80 39L96 50L80 61z" fill="#E0483E" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function TongSvg({ jenis, className }: { jenis: JenisSampah; className?: string }) {
  const w = WARNA_TONG[jenis];
  const besar = jenis === 'b3';
  return (
    <svg viewBox="0 0 80 86" className={className} role="img" aria-label={`Tong sampah ${NAMA_JENIS[jenis]}`}>
      <rect x="6" y="3" width="68" height="14" rx="6" fill={w.tutup} stroke={INK} strokeWidth="3" />
      <path d="M10 17h60l-5 64H15z" fill={w.badan} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="12" y="38" width="56" height="26" rx="7" fill="#fff" stroke={INK} strokeWidth="2.5" />
      <text
        x="40"
        y={besar ? 57 : 56}
        textAnchor="middle"
        fontFamily="Nunito, sans-serif"
        fontWeight={800}
        fontSize={besar ? 22 : jenis === 'organik' ? 12 : 11}
        fill={INK}
        {...(besar ? {} : { textLength: jenis === 'organik' ? 52 : 54, lengthAdjust: 'spacingAndGlyphs' })}
      >
        {w.label}
      </text>
    </svg>
  );
}

export const LATAR_RINTANGAN = 'repeating-linear-gradient(45deg,#FCD679 0,#FCD679 10px,#F9C34B 10px,#F9C34B 20px)';

export function RintanganSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 56" className={className} role="img" aria-label="Rintangan pembatas jalan">
      <rect x="14" y="30" width="6" height="22" rx="2" fill="#9AA4AD" stroke={INK} strokeWidth="2" />
      <rect x="44" y="30" width="6" height="22" rx="2" fill="#9AA4AD" stroke={INK} strokeWidth="2" />
      <defs>
        <clipPath id="klip-rintangan">
          <rect x="6" y="14" width="52" height="22" rx="4" />
        </clipPath>
      </defs>
      <rect x="6" y="14" width="52" height="22" rx="4" fill="#3A2E3F" />
      <g clipPath="url(#klip-rintangan)">
        <path d="M6 36L18 14H26L14 36zM22 36L34 14H42L30 36zM38 36L50 14H58L46 36zM54 36L66 14H74L62 36z" fill="#F2A33A" />
      </g>
      <rect x="6" y="14" width="52" height="22" rx="4" fill="none" stroke={INK} strokeWidth="2.5" />
      <circle cx="16" cy="9" r="5" fill="#E0483E" stroke={INK} strokeWidth="2" />
      <circle cx="48" cy="9" r="5" fill="#E0483E" stroke={INK} strokeWidth="2" />
    </svg>
  );
}

export function FinisSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Garis finis">
      <path d="M12 6v38" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d="M12 8h26l-6 9 6 9H12z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M12 8h9v9h-9zM30 8h8l-3 4.5 3 4.5h-8zM21 17h9v9h-9z" fill={INK} />
    </svg>
  );
}

/* ---------- Gambar suasana untuk peta level ---------- */

function TongMini({ x, y, badan, tutup }: { x: number; y: number; badan: string; tutup: string }) {
  return (
    <>
      <rect x={x} y={y} width="26" height="6" rx="2.5" fill={tutup} stroke={INK} strokeWidth="2" />
      <path d={`M${x + 2} ${y + 6}h22l-2 24h-18z`} fill={badan} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    </>
  );
}

function TigaTong({ x, y }: { x: number; y: number }) {
  return (
    <>
      <TongMini x={x} y={y} badan="#187A41" tutup="#0F5A2F" />
      <TongMini x={x + 30} y={y} badan="#F6C02B" tutup="#C48F0A" />
      <TongMini x={x + 60} y={y} badan="#D93A32" tutup="#A52A23" />
    </>
  );
}

function Pohon({ cx, dasar, s }: { cx: number; dasar: number; s: number }) {
  const w = 24 * s;
  const h = 20 * s;
  return (
    <>
      <rect x={cx - 3 * s} y={dasar - 10 * s} width={6 * s} height={10 * s} fill="#8A5A2B" stroke={INK} strokeWidth="2" />
      {[0, 1, 2].map((i) => {
        const atas = dasar - 10 * s - h * (i + 1) * 0.8 - 4 * s;
        const lebar = w * (1 - i * 0.22);
        return <path key={i} d={`M${cx} ${atas} L${cx + lebar / 2} ${atas + h} H${cx - lebar / 2}z`} fill="#2E8B4A" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />;
      })}
    </>
  );
}

export function Adegan({ dunia }: { dunia: Dunia }) {
  const label = {
    rumah: 'Gambar rumah dengan tiga tong sampah di sampingnya',
    sekolah: 'Gambar sekolah dengan bendera dan tiga tong sampah di sampingnya',
    hutan: 'Gambar hutan dengan pohon, jamur, dan tiga tong sampah',
  }[dunia];
  return (
    <svg viewBox="0 0 300 180" width="100%" style={{ display: 'block' }} role="img" aria-label={label}>
      {dunia !== 'hutan' && (
        <>
          <rect width="300" height="180" fill="#CFEFFF" />
          <circle cx="260" cy="32" r="16" fill="#F6C02B" stroke={INK} strokeWidth="2.5" />
          <rect y="146" width="300" height="34" fill="#7FCB8F" />
          <rect y="146" width="300" height="4" fill="#4FAF66" />
        </>
      )}
      {dunia === 'rumah' && (
        <>
          <rect x="118" y="40" width="16" height="30" fill="#A52A23" stroke={INK} strokeWidth="2.5" />
          <rect x="38" y="84" width="116" height="64" fill="#FFF1C2" stroke={INK} strokeWidth="3" />
          <path d="M28 88L96 34L164 88z" fill="#E0483E" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="82" y="108" width="28" height="40" rx="3" fill="#8A5A2B" stroke={INK} strokeWidth="2.5" />
          <circle cx="104" cy="130" r="2.5" fill="#F6C02B" />
          <rect x="50" y="98" width="22" height="22" fill="#BFE6FA" stroke={INK} strokeWidth="2.5" />
          <path d="M61 98v22M50 109h22" stroke={INK} strokeWidth="2" />
          <rect x="120" y="98" width="22" height="22" fill="#BFE6FA" stroke={INK} strokeWidth="2.5" />
          <path d="M131 98v22M120 109h22" stroke={INK} strokeWidth="2" />
          <TigaTong x={196} y={116} />
        </>
      )}
      {dunia === 'sekolah' && (
        <>
          <path d="M100 18v40" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M100 18h26l-6 7 6 7h-26z" fill="#E0483E" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="22" y="60" width="164" height="18" rx="3" fill="#2468B5" stroke={INK} strokeWidth="3" />
          <rect x="30" y="78" width="148" height="70" fill="#FCE3A8" stroke={INK} strokeWidth="3" />
          <circle cx="104" cy="69" r="6" fill="#fff" stroke={INK} strokeWidth="2" />
          <path d="M104 65v4l3 2" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {[40, 68, 118, 146].map((x) => (
            <rect key={x} x={x} y="92" width="22" height="22" fill="#BFE6FA" stroke={INK} strokeWidth="2.5" />
          ))}
          <rect x="92" y="108" width="24" height="40" rx="2" fill="#2468B5" stroke={INK} strokeWidth="2.5" />
          <path d="M104 108v40" stroke={INK} strokeWidth="2" />
          <TigaTong x={196} y={116} />
        </>
      )}
      {dunia === 'hutan' && (
        <>
          <rect width="300" height="180" fill="#DDF3E4" />
          <ellipse cx="80" cy="150" rx="130" ry="46" fill="#8FD19E" />
          <ellipse cx="250" cy="154" rx="110" ry="40" fill="#A6DDB1" />
          <rect y="146" width="300" height="34" fill="#4FAF66" />
          <rect y="146" width="300" height="4" fill="#2E8B4A" />
          <Pohon cx={34} dasar={148} s={1.15} />
          <Pohon cx={84} dasar={150} s={1.5} />
          <Pohon cx={138} dasar={148} s={1.0} />
          <path d="M160 148q0-14 12-14t12 14z" fill="#E0483E" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          <circle cx="167" cy="141" r="2" fill="#fff" />
          <circle cx="176" cy="139" r="2" fill="#fff" />
          <rect x="168" y="148" width="8" height="8" rx="2" fill="#FFF1C2" stroke={INK} strokeWidth="2" />
          <TigaTong x={206} y={118} />
        </>
      )}
    </svg>
  );
}
