import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka', weight: ['500', '600', '700'] });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', weight: ['600', '700', '800'] });

export const metadata: Metadata = {
  title: 'EcoCode Quest',
  description: 'Susun blok perintah, ajak robot memilah sampah, dan jadilah Pahlawan Lingkungan!',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="bg-mint font-sans text-ink">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
