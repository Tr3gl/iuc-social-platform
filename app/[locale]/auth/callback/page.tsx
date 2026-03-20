'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('Auth');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Handle hash-based tokens (magic link & OAuth implicit flow)
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const errorParam = hashParams.get('error') || searchParams.get('error');

                if (errorParam) {
                    throw new Error(errorParam === 'invalid_domain' ? t('google_domain_error') : t('error_generic'));
                }

                if (accessToken && refreshToken) {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (error) throw error;
                }

                // Wait for session to be fully established and fetch user
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                
                if (userError || !user) {
                    throw new Error(t('error_generic'));
                }

                // Verify domain
                const email = user.email || '';
                if (!email.endsWith('@ogr.iuc.edu.tr')) {
                    // Sign out invalid user
                    await supabase.auth.signOut();
                    throw new Error(t('google_domain_error'));
                }

                setStatus('success');
                setTimeout(() => {
                    router.push('/');
                }, 1000);
            } catch (err: any) {
                console.error('Auth callback error:', err);
                setError(err.message || t('error_generic'));
                setStatus('error');
            }
        };

        handleCallback();
    }, [router, searchParams, t]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center px-4">
            <div className="max-w-md w-full card p-8 text-center">
                {status === 'loading' && (
                    <>
                        <div className="inline-block w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                            {t('processing')}
                        </h2>
                        <p className="text-neutral-600">
                            {t('processing')}
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                            {t('signin_title')}
                        </h2>
                        <p className="text-neutral-600">
                            {t('processing')}
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                            {t('error_generic')}
                        </h2>
                        <p className="text-neutral-600 mb-6">
                            {error}
                        </p>
                        <button
                            onClick={() => router.push('/auth/signin')}
                            className="btn btn-primary"
                        >
                            {t('signin_button')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
