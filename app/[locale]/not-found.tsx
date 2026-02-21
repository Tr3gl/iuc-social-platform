import Link from'next/link';

export default function NotFound() {
 return (
 <div className="min-h-screen flex items-center justify-center bg-neutral-50 ">
 <div className="text-center p-8">
 <h1 className="text-6xl font-bold text-neutral-900 mb-4">404</h1>
 <h2 className="text-2xl font-semibold text-neutral-700 mb-4">Page Not Found</h2>
 <p className="text-neutral-600 mb-8">
 The page you're looking for doesn't exist.
 </p>
 <Link
 href="/"
 className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
 >
 Go Home
 </Link>
 </div>
 </div>
 );
}
