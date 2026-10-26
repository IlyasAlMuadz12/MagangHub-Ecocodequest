'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

/** Mengarahkan ke /masuk bila belum login. Mengembalikan true selama masih perlu menunggu. */
export function useWajibMasuk(): boolean {
  const { memuat, sudahMasuk } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!memuat && !sudahMasuk) router.replace('/masuk');
  }, [memuat, sudahMasuk, router]);
  return memuat || !sudahMasuk;
}
