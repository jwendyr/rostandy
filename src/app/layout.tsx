import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import WalletProvider from '@/components/WalletProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Wendy Rostandy — Full-Stack Developer & AI Engineer',
  description: 'Portfolio of Johannes Paulus Wendy Rostandy. Full-Stack Developer, AI Engineer, and Co-Founder of PT.PLUS Digital.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
