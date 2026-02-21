import { NextIntlClientProvider } from'next-intl';
import { getMessages, getTranslations } from'next-intl/server';
import { notFound } from'next/navigation';
import { AuthProvider } from'@/components/AuthProvider';
import Header from'@/components/Header';
import { Analytics } from'@vercel/analytics/react';

export default async function LocaleLayout({
 children,
 params: { locale }
}: {
 children: React.ReactNode;
 params: { locale: string };
}) {
 // Ensure that the incoming`locale` is valid
 if (!['en','tr'].includes(locale)) {
 notFound();
 }

 const messages = await getMessages();
 const t = await getTranslations({ locale, namespace:'Footer' });

 return (
 <NextIntlClientProvider messages={messages}>
 <AuthProvider>
 <Header />
 <main className="min-h-screen">
 {children}
 </main>
 <footer className="bg-neutral-100/50 border-t border-neutral-200 py-8 mt-16 backdrop-blur-sm">
 <div className="container mx-auto px-4 text-center text-sm text-neutral-600">
 <p>
 {t('line1')}
 </p>
 <p className="mt-1">
 {t('line2')}
 </p>
 <p className="mt-2">
 {t('line3')}
 </p>
 </div>
 </footer>
 </AuthProvider>
 <Analytics />
 </NextIntlClientProvider>
 );
}