'use client';

export function ErrorComponent() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Not Found</h1>
                <p className="text-gray-600">Sayfa bulunamadı / Page not found</p>
                <div className="mt-8">
                    <a href="/" className="text-blue-600 hover:underline">
                        Go Home / Ana Sayfaya Dön
                    </a>
                </div>
            </div>
        </div>
    );
}
