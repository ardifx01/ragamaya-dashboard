import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';

// Fungsi untuk memeriksa apakah token sudah kedaluwarsa
function isTokenExpired(token: string): boolean {
    try {
        const payload = decodeJwt(token);

        // Cek apakah payload memiliki properti 'exp'
        if (payload && typeof payload.exp === 'number') {
            const currentTimeInSeconds = Math.floor(Date.now() / 1000);

            // Jika waktu kedaluwarsa sudah lewat dari waktu sekarang, kembalikan true
            return payload.exp < currentTimeInSeconds;
        }

        // Anggap token tidak valid jika tidak punya 'exp'
        return true;
    } catch (error) {
        // Anggap token tidak valid jika gagal di-decode
        console.error("Gagal mendekode token:", error);
        return true;
    }
}


export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('access_token')?.value;

    const publicPaths = ['/login', '/register'];
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    // --- LOGIKA UTAMA ---

    // 1. Cek apakah ada token
    if (!accessToken) {
        // Jika tidak ada token dan mencoba akses halaman privat, alihkan ke login
        if (!isPublicPath) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        // Jika di halaman publik, biarkan saja
        return NextResponse.next();
    }

    // 2. Jika ada token, cek apakah sudah kedaluwarsa
    const tokenHasExpired = isTokenExpired(accessToken);

    if (tokenHasExpired) {
        // Jika token kedaluwarsa, hapus cookie dan alihkan ke login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('access_token');
        response.cookies.delete('refresh_token');
        return response;
    }

    // 3. Jika token ada dan valid (belum kedaluwarsa)
    // dan pengguna mencoba akses halaman login, alihkan ke dashboard
    if (!tokenHasExpired && isPublicPath) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 4. Jika token valid dan akses halaman privat, lanjutkan
    return NextResponse.next();
}


// Konfigurasi Matcher
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};