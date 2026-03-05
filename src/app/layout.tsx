import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import WalletProvider from '@/components/WalletProvider';
import { detectLocaleFromHeader, isRTL } from '@/lib/i18n';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Wendy Rostandy — Full-Stack Developer & AI Engineer',
  description: 'Portfolio of Johannes Paulus Wendy Rostandy. Full-Stack Developer, AI Engineer, and Co-Founder of PT.PLUS Digital.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const locale = detectLocaleFromHeader(h.get('accept-language'));

  return (
    <html lang={locale} dir={isRTL(locale) ? 'rtl' : 'ltr'} className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
