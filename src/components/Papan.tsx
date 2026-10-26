'use client';

import type { Level } from '@/lib/game/types.ts';
import type { Keadaan } from '@/lib/game/engine.ts';
import { KATALOG } from '@/lib/game/catalog.ts';
import type { DataTema } from '@/lib/tema';
import { FinisSvg, LATAR_RINTANGAN, NAMA_JENIS, RintanganSvg, RobotSvg, TongSvg, WARNA_TONG } from './gambar';

interface Props {
  level: Level;
  keadaan: Keadaan;
  tema: DataTema;
  goyang?: boolean;
}

/** Label netral: warna label TIDAK boleh membocorkan jenis sampah, karena siswa harus memilihnya sendiri. */
const LABEL = 'rounded-full border-2 border-ink bg-white text-center font-extrabold leading-tight text-ink';

export function Papan({ level, keadaan, tema, goyang = false }: Props) {
  const n = level.ukuranGrid;
  const { sampah, tong, rintangan, finish, robot: mulai } = level.config;
  const sel: { x: number; y: number }[] = [];
  for (let y = 1; y <= n; y++) for (let x = 1; x <= n; x++) sel.push({ x, y });

  const itemTerakhir = keadaan.bawa.length > 0 ? KATALOG[sampah[keadaan.bawa[keadaan.bawa.length - 1]].item] : null;

  return (
    <div className="rounded-3xl border-[3px] border-ink p-3.5" style={{ background: tema.bingkai }}>
      <div className="relative aspect-square w-full">
        <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` }}>
          {sel.map(({ x, y }) => {
            const rint = rintangan.some((r) => r.x === x && r.y === y);
            const t = tong.find((o) => o.x === x && o.y === y);
            const si = sampah.findIndex((s, i) => keadaan.sisa[i] && s.x === x && s.y === y);
            const adaSampah = si >= 0;
            const fin = finish.x === x && finish.y === y;
            const adaMulai = mulai.x === x && mulai.y === y;
            const robotDiSini = keadaan.x === x && keadaan.y === y;
            const latar = rint ? LATAR_RINTANGAN : adaMulai ? '#BFE8CF' : fin ? '#D3E9FB' : (x + y) % 2 === 0 ? tema.selA : tema.selB;
            const cincin = adaMulai ? 'inset 0 0 0 3px #187A41' : fin ? 'inset 0 0 0 3px #2468B5' : 'none';
            return (
              <div key={`${x}-${y}`} className="p-[2px]" role="gridcell" aria-label={`Kolom ${x}, baris ${y}${adaMulai ? ', START' : ''}${fin ? ', FINIS' : ''}`}>
                <div
                  className="relative flex h-full w-full flex-col items-center justify-center gap-[2%] overflow-hidden rounded-[10px]"
                  style={{ background: latar, boxShadow: cincin, containerType: 'size' }}
                >
                  {rint && <RintanganSvg className="w-[84%]" />}

                  {t && !robotDiSini && <TongSvg jenis={t.jenis} className="w-[96%]" />}
                  {/* robot berdiri di petak tong: tampilkan label tong di dasar petak, siap untuk Buang */}
                  {t && robotDiSini && (
                    <span
                      className="absolute bottom-[4%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-ink px-[8%] font-extrabold leading-tight"
                      style={{ background: WARNA_TONG[t.jenis].badan, color: WARNA_TONG[t.jenis].teks, fontSize: '11cqmin' }}
                      role="img"
                      aria-label={`Tong ${NAMA_JENIS[t.jenis]} ada di petak ini, siap untuk Buang`}
                    >
                      TONG {WARNA_TONG[t.jenis].label}
                    </span>
                  )}

                  {adaMulai && (
                    <span className="absolute left-1/2 top-[5%] -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-ink bg-hijau px-[10%] font-extrabold leading-tight text-white" style={{ fontSize: '12cqmin' }}>
                      START
                    </span>
                  )}

                  {fin && (
                    <>
                      <FinisSvg className="w-[50%]" />
                      <span className="whitespace-nowrap rounded-full border-2 border-ink bg-biru px-[10%] font-extrabold leading-tight text-white" style={{ fontSize: '12cqmin' }}>
                        FINIS
                      </span>
                    </>
                  )}

                  {adaSampah && !robotDiSini && (
                    <>
                      <span style={{ fontSize: '46cqmin', lineHeight: 1 }} role="img" aria-label={KATALOG[sampah[si].item].nama}>
                        {KATALOG[sampah[si].item].ikon}
                      </span>
                      <span className={`${LABEL} max-w-[94%] px-[6%]`} style={{ fontSize: '11cqmin' }}>
                        {KATALOG[sampah[si].item].nama.toUpperCase()}
                      </span>
                    </>
                  )}
                  {/* robot berdiri di petak sampah: tampilkan sampahnya kecil di pojok, siap diambil */}
                  {adaSampah && robotDiSini && (
                    <span
                      className="absolute left-[3%] top-[3%] flex items-center justify-center rounded-full border-2 border-ink bg-white"
                      style={{ width: '34cqmin', height: '34cqmin', fontSize: '21cqmin' }}
                      role="img"
                      aria-label={`${KATALOG[sampah[si].item].nama} ada di petak ini, siap diambil`}
                    >
                      {KATALOG[sampah[si].item].ikon}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* robot: lapisan sendiri supaya geraknya mulus */}
        <div
          className={`pointer-events-none absolute transition-all duration-300 ease-in-out ${goyang ? 'goyang' : ''}`}
          style={{ width: `${100 / n}%`, height: `${100 / n}%`, left: `${((keadaan.x - 1) * 100) / n}%`, top: `${((keadaan.y - 1) * 100) / n}%`, containerType: 'size' }}
        >
          <RobotSvg hadap={keadaan.hadap} className="h-full w-full" />
          {itemTerakhir && (
            <>
              <span
                className="absolute -right-[2%] -top-[2%] flex items-center justify-center rounded-full border-2 border-ink bg-white"
                style={{ width: '38cqmin', height: '38cqmin', fontSize: '24cqmin' }}
                role="img"
                aria-label={`Robot membawa ${keadaan.bawa.length} sampah`}
              >
                {itemTerakhir.ikon}
              </span>
              {keadaan.bawa.length > 1 && (
                <span
                  className="absolute right-[2%] top-[34%] flex items-center justify-center rounded-full border-2 border-ink bg-kuning font-extrabold text-ink"
                  style={{ width: '24cqmin', height: '24cqmin', fontSize: '15cqmin' }}
                  aria-hidden="true"
                >
                  {keadaan.bawa.length}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
