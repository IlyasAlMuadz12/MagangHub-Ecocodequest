import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const kunci = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !kunci) {
  // Pesan jelas saat .env.local belum diisi
  console.error('NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di .env.local');
}

export const supabase = createClient(url ?? 'http://localhost', kunci ?? 'kosong');
