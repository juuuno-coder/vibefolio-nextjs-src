import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host');

  // Subdomain rewrite: review.vibefolio.net
  if (hostname === 'review.vibefolio.net') {
     // 1. review.vibefolio.net/ -> /review
     if (url.pathname === '/') {
       url.pathname = '/review';
       return NextResponse.rewrite(url);
     }
     
     // 2. review.vibefolio.net/[id] -> /review?projectId=[id]
     // Extract potential ID from path (e.g., /60)
     const pathParts = url.pathname.split('/').filter(Boolean);
     if (pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
         url.searchParams.set('projectId', pathParts[0]);
         url.pathname = '/review';
         return NextResponse.rewrite(url);
     }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Admin protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 임시: 특정 이메일 허용
    const adminEmails = [
      "juuuno@naver.com", 
      "juuuno1116@gmail.com", 
      "designd@designd.co.kr", 
      "designdlab@designdlab.co.kr", 
      "admin@vibefolio.net"
    ];
    const isHardcodedAdmin = user?.email && adminEmails.includes(user.email);
    const isRoleAdmin = user?.app_metadata?.role === 'admin';

    /* 
    if (!user || (!isRoleAdmin && !isHardcodedAdmin)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    */
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
