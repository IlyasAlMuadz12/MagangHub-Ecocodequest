'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Memuat } from '@/components/ui';

export default function Beranda() {
  const { memuat, sudahMasuk, profil } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!memuat) router.replace(sudahMasuk ? (profil?.peran === 'guru' ? '/guru' : '/peta') : '/masuk');
  }, [memuat, sudahMasuk, profil, router]);
  return <Memuat />;
}
