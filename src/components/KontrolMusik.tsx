'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { IkonMusik, IKON_D } from './gambar';
import { PilihMusik } from './PilihMusik';
import { TombolIkon } from './ui';

/** Dua tombol: bisukan/nyalakan musik, dan pilih lagu. */
export function KontrolMusik() {
  const { pengaturan, ubahPengaturan } = useAuth();
  const [buka, setBuka] = useState(false);
  if (!pengaturan) return null;
  const aktif = pengaturan.bgmAktif;

  return (
    <>
      <TombolIkon
        label={aktif ? 'Bisukan musik' : 'Nyalakan musik'}
        aria-pressed={!aktif}
        aktif={aktif}
        onClick={() => void ubahPengaturan({ bgmAktif: !aktif })}
      >
        <IkonMusik mati={!aktif} />
      </TombolIkon>
      <TombolIkon label="Pilih musik" d={IKON_D.daftarLagu} onClick={() => setBuka(true)} />
      {buka && <PilihMusik onTutup={() => setBuka(false)} />}
    </>
  );
}
