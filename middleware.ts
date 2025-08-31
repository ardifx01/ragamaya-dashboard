import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hasToken = request.cookies.has('access_token');

    // 1. Jika pengguna sudah login dan mencoba mengakses halaman login
    // -> Alihkan ke halaman utama/dashboard
    if (hasToken && pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. Jika pengguna belum login dan mencoba mengakses halaman yang dilindungi
    // -> Alihkan ke halaman login
    // Logika ini melindungi semua path KECUALI path '/login' itu sendiri.
    if (!hasToken && !pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Jika tidak ada kondisi di atas yang terpenuhi, lanjutkan seperti biasa
    return NextResponse.next();
}

// Konfigurasi Matcher
// Middleware ini hanya akan berjalan pada path yang cocok dengan regex di bawah.
// Ini mencegah middleware berjalan pada file statis, gambar, dll.
export const config = {
    matcher: [
        /*
         * Cocokkan semua path KECUALI:
         * - /api (rute API)
         * - /_next/static (file statis)
         * - /_next/image (file optimasi gambar)
         * - /favicon.ico (file favicon)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
