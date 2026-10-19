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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dropcode.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'DropCode — Fast, Direct P2P File Sharing Online',
    template: '%s | DropCode',
  },
  description:
    'Share files instantly between any device using a short 8-character transfer code. Direct peer-to-peer WebRTC transfer with zero cloud storage, no account needed, and no file size limits.',
  keywords: [
    'file sharing',
    'p2p file transfer',
    'webrtc file share',
    'dropcode',
    'share files online',
    'transfer files between devices',
    'airdrop alternative',
    'localsend alternative',
    'cross platform file transfer',
    'secure file transfer without cloud',
  ],
  authors: [{ name: 'DropCode' }],
  creator: 'DropCode',
  publisher: 'DropCode',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: 'DropCode — Fast, Direct P2P File Sharing Online',
    description:
      'Transfer files directly between devices using a short code. No cloud storage, no signup required.',
    siteName: 'DropCode',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DropCode — Fast, Direct P2P File Sharing Online',
    description:
      'Transfer files directly between devices using a short code. No cloud storage, no signup required.',
  },
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'jixQg_K3OLoQmvhnKv_WMURFWJAicG0ooFncBvJB76s',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'DropCode',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  description:
    'Direct peer-to-peer WebRTC file transfer between any devices with a short sharing code. Zero cloud storage.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Direct WebRTC Peer-to-Peer file transfer',
    'No file upload to cloud servers',
    'No account required',
    'End-to-end encrypted in transit',
    'Cross-device support across mobile and desktop',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-navy-900 text-slate-100 flex flex-col min-h-screen antialiased selection:bg-brand-violet selection:text-white">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
