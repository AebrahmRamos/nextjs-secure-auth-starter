import { ROLES } from './roles.js';

/**
 * Route configuration for access control
 * Maps route patterns to their access requirements
 */
export const ROUTE_CONFIG = {
    // Admin routes - only admins
    '/admin': {
        role: ROLES.ADMIN,
    },

    // Moderator routes - admins and moderators
    '/moderator': {
        role: [ROLES.ADMIN, ROLES.MODERATOR],
    },

    // API routes
    '/api/users': {
        minimumRole: ROLES.MODERATOR,
    },

    '/api/logs': {
        role: ROLES.ADMIN,
    },

    '/api/forums': {
        minimumRole: ROLES.USER, // Authenticated users only
    },

    '/api/threads': {
        minimumRole: ROLES.USER,
    },
};

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
    '/login',
    '/register',
    '/forgot-password',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
];

/**
 * Check if a route is public
 * @param {string} pathname - The route pathname
 * @returns {boolean} True if the route is public
 */
export function isPublicRoute(pathname) {
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

export default ROUTE_CONFIG;
