import {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasMinimumRole,
    canAccessRoute,
    ownsResource,
    canEditResource,
    canDeleteResource,
} from '../../../src/lib/rbac.js';
import { PERMISSIONS } from '../../../src/config/permissions.js';
import { ROLES } from '../../../src/config/roles.js';

describe('RBAC Utilities', () => {
    describe('hasPermission()', () => {
        test('should return true if user has permission', () => {
            const admin = createMockAdmin();
            expect(hasPermission(admin, PERMISSIONS.VIEW_LOGS)).toBe(true);
        });

        test('should return false if user does not have permission', () => {
            const user = createMockUser();
            expect(hasPermission(user, PERMISSIONS.VIEW_LOGS)).toBe(false);
        });

        test('should return false for null/undefined user', () => {
            expect(hasPermission(null, PERMISSIONS.VIEW_LOGS)).toBe(false);
            expect(hasPermission(undefined, PERMISSIONS.VIEW_LOGS)).toBe(false);
        });

        test('should return false for user without role', () => {
            const userNoRole = { username: 'test' };
            expect(hasPermission(userNoRole, PERMISSIONS.VIEW_LOGS)).toBe(false);
        });
    });

    describe('hasRole()', () => {
        test('should return true if user has the role', () => {
            const admin = createMockAdmin();
            expect(hasRole(admin, ROLES.ADMIN)).toBe(true);
        });

        test('should return false if user does not have the role', () => {
            const user = createMockUser();
            expect(hasRole(user, ROLES.ADMIN)).toBe(false);
        });

        test('should return false for null/undefined user', () => {
            expect(hasRole(null, ROLES.ADMIN)).toBe(false);
            expect(hasRole(undefined, ROLES.ADMIN)).toBe(false);
        });
    });

    describe('hasAnyRole()', () => {
        test('should return true if user has one of the roles', () => {
            const moderator = createMockModerator();
            expect(hasAnyRole(moderator, [ROLES.ADMIN, ROLES.MODERATOR])).toBe(true);
        });

        test('should return false if user has none of the roles', () => {
            const user = createMockUser();
            expect(hasAnyRole(user, [ROLES.ADMIN, ROLES.MODERATOR])).toBe(false);
        });

        test('should return false for invalid input', () => {
            const user = createMockUser();
            expect(hasAnyRole(null, [ROLES.ADMIN])).toBe(false);
            expect(hasAnyRole(user, null)).toBe(false);
            expect(hasAnyRole(user, 'not-an-array')).toBe(false);
        });
    });

    describe('hasMinimumRole()', () => {
        test('should return true if user role is at minimum level', () => {
            const moderator = createMockModerator();
            expect(hasMinimumRole(moderator, ROLES.MODERATOR)).toBe(true);
        });

        test('should return true if user role is above minimum level', () => {
            const admin = createMockAdmin();
            expect(hasMinimumRole(admin, ROLES.MODERATOR)).toBe(true);
            expect(hasMinimumRole(admin, ROLES.USER)).toBe(true);
        });

        test('should return false if user role is below minimum level', () => {
            const user = createMockUser();
            expect(hasMinimumRole(user, ROLES.MODERATOR)).toBe(false);
            expect(hasMinimumRole(user, ROLES.ADMIN)).toBe(false);
        });

        test('should return false for invalid roles', () => {
            const user = createMockUser();
            expect(hasMinimumRole(user, 'invalid-role')).toBe(false);
        });

        test('should return false for null/undefined user', () => {
            expect(hasMinimumRole(null, ROLES.USER)).toBe(false);
        });
    });

    describe('canAccessRoute()', () => {
        const routeConfig = {
            '/admin': { role: ROLES.ADMIN },
            '/moderator': { role: [ROLES.ADMIN, ROLES.MODERATOR] },
            '/api/users': { minimumRole: ROLES.MODERATOR },
        };

        test('should allow admin to access admin route', () => {
            const admin = createMockAdmin();
            expect(canAccessRoute(admin, '/admin/settings', routeConfig)).toBe(true);
        });

        test('should deny user access to admin route', () => {
            const user = createMockUser();
            expect(canAccessRoute(user, '/admin/settings', routeConfig)).toBe(false);
        });

        test('should allow moderator to access moderator route', () => {
            const moderator = createMockModerator();
            expect(canAccessRoute(moderator, '/moderator/tools', routeConfig)).toBe(true);
        });

        test('should allow admin to access moderator route', () => {
            const admin = createMockAdmin();
            expect(canAccessRoute(admin, '/moderator/tools', routeConfig)).toBe(true);
        });

        test('should deny user access to moderator route', () => {
            const user = createMockUser();
            expect(canAccessRoute(user, '/moderator/tools', routeConfig)).toBe(false);
        });

        test('should allow access to unconfigured route', () => {
            const user = createMockUser();
            expect(canAccessRoute(user, '/public/page', routeConfig)).toBe(true);
        });

        test('should handle minimum role requirement', () => {
            const user = createMockUser();
            const moderator = createMockModerator();
            expect(canAccessRoute(user, '/api/users', routeConfig)).toBe(false);
            expect(canAccessRoute(moderator, '/api/users', routeConfig)).toBe(true);
        });

        test('should allow access if no config provided', () => {
            const user = createMockUser();
            expect(canAccessRoute(user, '/any/route', null)).toBe(true);
        });
    });

    describe('ownsResource()', () => {
        test('should return true if user owns resource', () => {
            const user = createMockUser();
            const resource = { createdBy: user._id };
            expect(ownsResource(user, resource)).toBe(true);
        });

        test('should return false if user does not own resource', () => {
            const user = createMockUser();
            const resource = { createdBy: 'different-user-id' };
            expect(ownsResource(user, resource)).toBe(false);
        });

        test('should work with custom owner field', () => {
            const user = createMockUser();
            const resource = { authorId: user._id };
            expect(ownsResource(user, resource, 'authorId')).toBe(true);
        });

        test('should handle nested _id in owner field', () => {
            const user = createMockUser();
            const resource = { createdBy: { _id: user._id } };
            expect(ownsResource(user, resource)).toBe(true);
        });

        test('should return false for null/undefined user or resource', () => {
            const user = createMockUser();
            const resource = { createdBy: user._id };
            expect(ownsResource(null, resource)).toBe(false);
            expect(ownsResource(user, null)).toBe(false);
        });
    });

    describe('canEdit Resource()', () => {
        test('should allow user to edit own resource', () => {
            const user = createMockUser();
            const resource = { createdBy: user._id };
            expect(
                canEditResource(user, resource, PERMISSIONS.EDIT_OWN_FORUM, PERMISSIONS.EDIT_ANY_FORUM)
            ).toBe(true);
        });

        test('should deny user from editing others resource', () => {
            const user = createMockUser();
            const resource = { createdBy: 'other-user-id' };
            expect(
                canEditResource(user, resource, PERMISSIONS.EDIT_OWN_FORUM, PERMISSIONS.EDIT_ANY_FORUM)
            ).toBe(false);
        });

        test('should allow moderator to edit any resource', () => {
            const moderator = createMockModerator();
            const resource = { createdBy: 'other-user-id' };
            expect(
                canEditResource(moderator, resource, PERMISSIONS.EDIT_OWN_FORUM, PERMISSIONS.EDIT_ANY_FORUM)
            ).toBe(true);
        });

        test('should return false for null user', () => {
            const resource = { createdBy: '123' };
            expect(
                canEditResource(null, resource, PERMISSIONS.EDIT_OWN_FORUM, PERMISSIONS.EDIT_ANY_FORUM)
            ).toBe(false);
        });
    });

    describe('canDeleteResource()', () => {
        test('should allow user to delete own resource', () => {
            const user = createMockUser();
            const resource = { createdBy: user._id };
            expect(
                canDeleteResource(user, resource, PERMISSIONS.DELETE_OWN_FORUM, PERMISSIONS.DELETE_ANY_FORUM)
            ).toBe(true);
        });

        test('should deny user from deleting others resource', () => {
            const user = createMockUser();
            const resource = { createdBy: 'other-user-id' };
            expect(
                canDeleteResource(user, resource, PERMISSIONS.DELETE_OWN_FORUM, PERMISSIONS.DELETE_ANY_FORUM)
            ).toBe(false);
        });

        test('should allow admin to delete any resource', () => {
            const admin = createMockAdmin();
            const resource = { createdBy: 'other-user-id' };
            expect(
                canDeleteResource(admin, resource, PERMISSIONS.DELETE_OWN_FORUM, PERMISSIONS.DELETE_ANY_FORUM)
            ).toBe(true);
        });

        test('should return false for null user', () => {
            const resource = { createdBy: '123' };
            expect(
                canDeleteResource(null, resource, PERMISSIONS.DELETE_OWN_FORUM, PERMISSIONS.DELETE_ANY_FORUM)
            ).toBe(false);
        });
    });
});
