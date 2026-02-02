import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'tr'] as const;
type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used - fallback to 'tr' if undefined or invalid
    if (!locale || !locales.includes(locale as Locale)) {
        locale = 'tr';
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
