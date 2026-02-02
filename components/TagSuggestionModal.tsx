'use client';

import { useState } from 'react';
import { submitPendingTag } from '@/lib/utils';
import { Tag, X, Plus, Check } from 'lucide-react';

interface Props {
    courseId?: string;
    onClose: () => void;
}

export default function TagSuggestionModal({ courseId, onClose }: Props) {
    const [tagName, setTagName] = useState('');
    const [tagType, setTagType] = useState<'positive' | 'negative'>('positive');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!tagName.trim()) {
            setError('Lütfen bir etiket adı girin');
            return;
        }

        if (tagName.trim().length < 2) {
            setError('Etiket en az 2 karakter olmalıdır');
            return;
        }

        if (tagName.trim().length > 50) {
            setError('Etiket en fazla 50 karakter olabilir');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await submitPendingTag(tagName, tagType, courseId);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Etiket gönderilemedi');
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 max-w-sm text-center animate-in zoom-in duration-200">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">Etiket Önerildi!</h3>
                    <p className="text-neutral-600">Etiketiniz moderatör onayına gönderildi.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 animate-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        <Tag className="w-5 h-5 text-primary-600" />
                        <h3 className="text-lg font-semibold text-neutral-900">Yeni Etiket Öner</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-neutral-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Etiket Adı
                        </label>
                        <input
                            type="text"
                            value={tagName}
                            onChange={(e) => setTagName(e.target.value)}
                            placeholder="örn: Kolay Final"
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            maxLength={50}
                        />
                        <p className="text-xs text-neutral-500 mt-1">{tagName.length}/50 karakter</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Etiket Türü
                        </label>
                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => setTagType('positive')}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${tagType === 'positive'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-neutral-100 text-neutral-600 hover:bg-green-50'
                                    }`}
                            >
                                👍 Pozitif
                            </button>
                            <button
                                type="button"
                                onClick={() => setTagType('negative')}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${tagType === 'negative'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-neutral-100 text-neutral-600 hover:bg-red-50'
                                    }`}
                            >
                                👎 Negatif
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 px-4 border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                        >
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    <span>Öner</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <p className="text-xs text-neutral-500 mt-4 text-center">
                    Önerilen etiketler moderatör onayının ardından kullanılabilir olacaktır.
                </p>
            </div>
        </div>
    );
}
