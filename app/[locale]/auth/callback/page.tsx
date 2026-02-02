'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          setStatus('success');
          // Redirect to home page after 2 seconds
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          throw new Error('Geçersiz kimlik doğrulama bağlantısı');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Giriş yapılırken bir hata oluştu');
        setStatus('error');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full card p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="inline-block w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Giriş yapılıyor...
            </h2>
            <p className="text-neutral-600">
              Lütfen bekleyin
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Giriş başarılı!
            </h2>
            <p className="text-neutral-600">
              Ana sayfaya yönlendiriliyorsunuz...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Giriş başarısız
            </h2>
            <p className="text-neutral-600 mb-6">
              {error}
            </p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="btn btn-primary"
            >
              Tekrar Dene
            </button>
          </>
        )}
      </div>
    </div>
  );
}
