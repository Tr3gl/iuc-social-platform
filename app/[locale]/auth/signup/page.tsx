'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail, signInWithGoogle } from '@/lib/auth';
import Link from 'next/link';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SignUp() {
    const router = useRouter();
    const t = useTranslations('Signup');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleGoogleSignUp = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || t('error_generic'));
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signUpWithEmail(email, password);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || t('error_generic'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="card p-8 bg-neutral-100 border-neutral-200">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-primary-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t('title')}</h1>
                        <p className="text-neutral-600">{t('description')}</p>
                    </div>

                    {success ? (
                        <div className="bg-green-900/10 border border-green-900/20 rounded-lg p-4 mb-6 text-center">
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-green-900 mb-2">{t('success_title')}</h3>
                            <p className="text-sm text-green-700 mb-4">{t('success_message')}</p>
                            <Link href="/auth/signin" className="btn btn-primary w-full">
                                {t('signin_link')}
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Google Sign-Up Button */}
                            <button
                                type="button"
                                onClick={handleGoogleSignUp}
                                disabled={googleLoading || loading}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-neutral-300 rounded-xl font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4 shadow-sm"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                {googleLoading ? t('submitting') : t('google_signup')}
                            </button>

                            {/* Divider */}
                            <div className="relative mb-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-neutral-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-3 bg-neutral-100 text-neutral-500">or</span>
                                </div>
                            </div>

                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-900/10 border border-red-900/20 rounded-lg p-4 mb-6">
                                    <div className="flex items-start space-x-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-800">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                                        {t('email_label')}
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t('email_placeholder')}
                                        className="input w-full bg-neutral-200 border-neutral-300 text-neutral-900 focus:bg-neutral-50"
                                        required
                                        disabled={loading}
                                    />
                                    <p className="mt-1 text-xs text-neutral-500">{t('email_hint')}</p>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                                        {t('password_label')}
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input w-full bg-neutral-200 border-neutral-300 text-neutral-900 focus:bg-neutral-50"
                                        required
                                        minLength={6}
                                        disabled={loading}
                                    />
                                    <p className="mt-1 text-xs text-neutral-500">{t('password_hint')}</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('submitting') : t('submit')}
                            </button>
                        </form>
                        </>
                    )}

                    <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
                        <p className="text-sm text-neutral-600">
                            {t('already_have_account')}{' '}
                            <Link href="/auth/signin" className="text-primary-600 hover:underline font-medium">
                                {t('signin_link')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
