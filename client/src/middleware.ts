import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Lấy token: Backend đặt tên là 'jwt', nhưng ta cứ check cả 'token' cho chắc
  const token = request.cookies.get('jwt')?.value || request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;

  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Các route cần bảo vệ
  const isAdminRoute = pathname.startsWith('/admin');
  const isOwnerRoute = pathname.startsWith('/dashboard');
  const isPosRoute = pathname.startsWith('/pos');
  const isAuthRoute = pathname.startsWith('/login');

  // --- LOGIC 1: CHƯA ĐĂNG NHẬP ---
  if (!token) {
    if (isAdminRoute || isOwnerRoute || isPosRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // --- LOGIC 2: ĐÃ ĐĂNG NHẬP MÀ VÀO TRANG LOGIN ---
  if (isAuthRoute) {
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    if (role === 'OWNER') return NextResponse.redirect(new URL('/dashboard', request.url));
    if (role === 'EMPLOYEE') return NextResponse.redirect(new URL('/pos', request.url));
    // Fallback nếu không có role hợp lệ
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // --- LOGIC 3: PHÂN QUYỀN (QUAN TRỌNG) ---

  // ADMIN: Không được vào trang Shop (Dashboard/POS)
  if (role === 'ADMIN' && (isOwnerRoute || isPosRoute)) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // EMPLOYEE: Chỉ được vào POS, không được vào Dashboard quản lý hay Admin
  if (role === 'EMPLOYEE' && (isAdminRoute || isOwnerRoute)) {
    return NextResponse.redirect(new URL('/pos', request.url));
  }

  // OWNER: Được vào Dashboard VÀ được vào cả POS (để bán hàng)
  // Không được vào trang Admin
  if (role === 'OWNER' && isAdminRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};