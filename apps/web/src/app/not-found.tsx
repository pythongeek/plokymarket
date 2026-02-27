'use client';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-xl mb-8">পৃষ্ঠাটি পাওয়া যায়নি</p>
            <a href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                হোমপেজে ফিরে যান
            </a>
        </div>
    );
}
