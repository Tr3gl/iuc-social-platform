import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Not Found</h1>
                <p className="text-gray-600 mb-8">Sayfa bulunamadı / Page not found</p>
                <Link href="/" className="text-blue-600 hover:underline">
                    Go Home / Ana Sayfaya Dön
                </Link>
            </div>
        </div>
    );
}
