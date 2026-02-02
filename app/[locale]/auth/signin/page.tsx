'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signInWithPassword } from '@/lib/auth';
import { Mail, AlertCircle, CheckCircle, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Toggle between Magic Link and Password login
  const [usePassword, setUsePassword] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (usePassword) {
        await signInWithPassword(email, password);
        // Password login doesn't need success message, it redirects. 
        // Or wait for auth state change to redirect.
        // For better UX, let's refresh/redirect.
        router.push('/');
        router.refresh();
      } else {
        await signInWithEmail(email);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu');
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
              {usePassword ? (
                <Lock className="w-8 h-8 text-primary-600" />
              ) : (
                <Mail className="w-8 h-8 text-primary-600" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Giriş Yap
            </h1>
            <p className="text-neutral-600">
              {usePassword
                ? 'E-posta ve şifrenizle giriş yapın'
                : 'Sihirli bağlantı ile şifresiz giriş yapın'}
            </p>
          </div>

          {success && !usePassword ? (
            <div className="bg-green-900/10 border border-green-900/20 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Bağlantı gönderildi!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    E-posta kutunuzu kontrol edin. Size gönderilen bağlantıya
                    tıklayarak giriş yapabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          ) : (
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
                    Üniversite E-posta
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@ogr.iuc.edu.tr"
                    className="input w-full bg-neutral-200 border-neutral-300 text-neutral-900 focus:bg-neutral-50"
                    required
                    disabled={loading}
                  />
                  {!usePassword && (
                    <p className="mt-1 text-xs text-neutral-500">
                      Yalnızca @ogr.iuc.edu.tr uzantılı e-postalar
                    </p>
                  )}
                </div>

                {usePassword && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                      Şifre
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input w-full bg-neutral-200 border-neutral-300 text-neutral-900 focus:bg-neutral-50"
                      required
                      disabled={loading}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'İşleniyor...' : (usePassword ? 'Giriş Yap' : 'Giriş Bağlantısı Gönder')}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setUsePassword(!usePassword);
                    setError('');
                    setSuccess(false);
                  }}
                  className="text-sm text-primary-600 hover:text-primary-800 hover:underline"
                >
                  {usePassword
                    ? 'Şifresiz (Magic Link) ile giriş yap'
                    : 'Şifre ile giriş yap'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
            <p className="text-sm text-neutral-600">
              Hesabınız yok mu?{' '}
              <Link href="/auth/signup" className="text-primary-600 hover:underline font-medium">
                Kayıt Ol
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
