import { ReactNode } from 'react';
import '../globals.css';

export const metadata = {
  title: 'Cerrah Hub – Ders Değerlendirme Platformu',
  description: 'Anonim ders ve öğretim üyesi değerlendirme platformu',
  manifest: '/manifest.json',
  themeColor: '#1e293b',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default' as const,
    title: 'Cerrah Hub',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  themeColor: '#1e293b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>{children}</body>
    </html>
  );
}
