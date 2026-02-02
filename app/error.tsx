'use client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-red-600 mb-4">Error</h1>
                <p className="text-gray-600 mb-8">Something went wrong!</p>
                <button
                    onClick={() => reset()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
