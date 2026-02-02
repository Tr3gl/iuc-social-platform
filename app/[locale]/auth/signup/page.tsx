'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail } from '@/lib/auth';
import Link from 'next/link';
import { Mail, Shield, AlertCircle, CheckCircle } from 'lucide-react';

export default function SignUp() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signUpWithEmail(email, password);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Kayıt sırasında bir hata oluştu');
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
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                            Kayıt Ol
                        </h1>
                        <p className="text-neutral-600">
                            Üniversite e-postanız ile bir şifre belirleyin
                        </p>
                    </div>

                    {success ? (
                        <div className="bg-green-900/10 border border-green-900/20 rounded-lg p-4 mb-6 text-center">
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-green-900 mb-2">
                                Kayıt Başarılı!
                            </h3>
                            <p className="text-sm text-green-700 mb-4">
                                Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.
                            </p>
                            <Link href="/auth/signin" className="btn btn-primary w-full">
                                Giriş Yap
                            </Link>
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
                                    <p className="mt-1 text-xs text-neutral-500">
                                        Yalnızca @ogr.iuc.edu.tr uzantılı e-postalar
                                    </p>
                                </div>

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
                                        minLength={6}
                                        disabled={loading}
                                    />
                                    <p className="mt-1 text-xs text-neutral-500">
                                        En az 6 karakter
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
                        <p className="text-sm text-neutral-600">
                            Zaten hesabınız var mı?{' '}
                            <Link href="/auth/signin" className="text-primary-600 hover:underline font-medium">
                                Giriş Yap
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
