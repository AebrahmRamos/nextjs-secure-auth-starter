import { NextResponse } from 'next/server';
import { authorize } from './src/lib/auth-middleware';
import { canAccessRoute } from './src/lib/rbac.js';
import { ROUTE_CONFIG } from './src/config/route-config.js';
import { ROLES } from './src/config/roles.js';

export async function middleware(request) {
  try {
    const authResult = await authorize(request);
    const { user, authorized, public: isPublic, reason } = authResult;
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Allow public routes
    if (isPublic) return NextResponse.next();

    // If not authorized, respond appropriately
    if (!authorized) {
      if (pathname.startsWith('/api/')) {
        return new Response(
          JSON.stringify({ error: 'Access denied', details: reason }),
          {
            status: reason === 'Authentication required' ? 401 : 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Use the new RBAC system for route-based access control
    if (!canAccessRoute(user, pathname, ROUTE_CONFIG)) {
      console.log(`[Middleware] Access denied: user=${user?.username} role=${user?.role} path=${pathname}`);

      if (pathname.startsWith('/api/')) {
        return new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: `Access to ${pathname} requires elevated permissions`
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Redirect unauthorized users to forums (safe fallback)
      return NextResponse.redirect(new URL('/forums', request.url));
    }


    // Attach headers
    const response = NextResponse.next();
    response.headers.set('x-user-id', user._id.toString());
    response.headers.set('x-user-role', user.role);
    response.headers.set('x-user-username', user.username);

    return response;

  } catch (error) {
    console.error('Middleware error:', error);

    if (request.nextUrl.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/moderator',
    '/moderator/:path*',
    '/api/:path*',
  ],
};
