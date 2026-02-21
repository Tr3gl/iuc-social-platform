'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const t = useTranslations('Auth');

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <header className="bg-neutral-50/80 border-b border-neutral-200/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="px-2 h-8 bg-accent-yellow rounded-lg flex items-center justify-center text-primary-900 font-bold text-lg shadow-[0_0_15px_rgba(251,191,36,0.5)]">
            İÜC
          </div>
          <span className="font-bold text-xl text-neutral-900 tracking-tight">Social</span>
        </Link>

        <div className="flex items-center space-x-2">
          <LanguageSwitcher />
          <ThemeSwitcher />

          {user ? (
            <div className="flex items-center space-x-3 ml-2">
              <span className="text-sm text-neutral-600 hidden md:inline-block">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-neutral-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">{t('signout')}</span>
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="flex items-center space-x-2 text-neutral-600 hover:text-primary-600 font-medium transition-colors ml-2"
            >
              <User className="w-4 h-4" />
              <span>{t('signin_button')}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}