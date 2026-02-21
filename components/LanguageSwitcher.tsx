'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const switchLocale = () => {
        const newLocale = locale === 'tr' ? 'en' : 'tr';
        // Replace the locale prefix in the current pathname
        const segments = pathname.split('/');
        segments[1] = newLocale;
        router.push(segments.join('/'));
    };

    return (
        <button
            onClick={switchLocale}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 transition-colors"
            title={locale === 'tr' ? 'Switch to English' : 'Türkçeye geç'}
        >
            <Globe className="w-4 h-4" />
            <span>{locale === 'tr' ? 'EN' : 'TR'}</span>
        </button>
    );
}
