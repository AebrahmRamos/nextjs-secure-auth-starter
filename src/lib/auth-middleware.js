import { jwtVerify } from 'jose';
import { isPublicRoute } from '../config/route-config.js';

/**
 * Authorization middleware helper
 * Verifies JWT token and checks route accessibility
 */
export async function authorize(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Check if route is public
    if (isPublicRoute(pathname)) {
        return {
            authorized: true,
            public: true,
            user: null,
        };
    }

    // 2. Get token from cookies
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
        return {
            authorized: false,
            public: false,
            reason: 'Authentication required',
            user: null,
        };
    }

    try {
        // 3. Verify token (using jose for Edge compatibility)
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        // 4. Return user info
        return {
            authorized: true,
            public: false,
            user: payload,
        };

    } catch (error) {
        console.error('Token verification failed:', error);
        return {
            authorized: false,
            public: false,
            reason: 'Invalid token',
            user: null,
        };
    }
}
