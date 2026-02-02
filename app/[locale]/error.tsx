'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error('Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
            <div className="text-center p-8">
                <h1 className="text-4xl font-bold text-red-600 mb-4">Error</h1>
                <p className="text-neutral-600 mb-8">Something went wrong!</p>
                <div className="flex space-x-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                    >
                        Try again
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300 transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
}
