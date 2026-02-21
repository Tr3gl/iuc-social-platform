import { ReactNode } from'react';
import'../globals.css';

export const metadata = {
 title:'Ders Değerlendirme Platformu',
 description:'Anonim ders ve öğretim üyesi değerlendirme platformu',
};

export default function RootLayout({ children }: { children: ReactNode }) {
 return (
 <html lang="tr"suppressHydrationWarning>
 <body>{children}</body>
 </html>
 );
}
