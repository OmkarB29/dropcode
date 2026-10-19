import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'DropCode | Direct P2P WebRTC File Sharing',
  description:
    'Share files between any device instantly with a simple 8-character code. Direct WebRTC peer-to-peer data channels with zero cloud storage.',
  keywords: [
    'file sharing',
    'p2p file transfer',
    'webrtc',
    'dropcode',
    'peer to peer',
    'encrypted transfer',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-navy-900 text-slate-100 flex flex-col min-h-screen antialiased selection:bg-brand-violet selection:text-white">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
