import {
    ROLES,
    ROLE_PERMISSIONS,
    ROLE_HIERARCHY,
    getRolePermissions,
    isValidRole,
    getRoleLevel
} from '../../../src/config/roles.js';
import { PERMISSIONS } from '../../../src/config/permissions.js';

describe('Roles Configuration', () => {
    describe('ROLES constants', () => {
        test('should have expected role values', () => {
            expect(ROLES.ADMIN).toBe('admin');
            expect(ROLES.MODERATOR).toBe('moderator');
            expect(ROLES.USER).toBe('user');
        });
    });

    describe('ROLE_HIERARCHY', () => {
        test('should have correct hierarchy levels', () => {
            expect(ROLE_HIERARCHY[ROLES.USER]).toBe(0);
            expect(ROLE_HIERARCHY[ROLES.MODERATOR]).toBe(1);
            expect(ROLE_HIERARCHY[ROLES.ADMIN]).toBe(2);
        });

        test('admin should have highest level', () => {
            const adminLevel = ROLE_HIERARCHY[ROLES.ADMIN];
            const modLevel = ROLE_HIERARCHY[ROLES.MODERATOR];
            const userLevel = ROLE_HIERARCHY[ROLES.USER];

            expect(adminLevel).toBeGreaterThan(modLevel);
            expect(modLevel).toBeGreaterThan(userLevel);
        });
    });

    describe('ROLE_PERMISSIONS', () => {
        test('user should have basic permissions', () => {
            const userPerms = ROLE_PERMISSIONS[ROLES.USER];
            expect(userPerms).toContain(PERMISSIONS.CREATE_FORUM);
            expect(userPerms).toContain(PERMISSIONS.EDIT_OWN_FORUM);
            expect(userPerms).toContain(PERMISSIONS.CREATE_THREAD);
            expect(userPerms).toContain(PERMISSIONS.CREATE_REPLY);
        });

        test('user should not have moderation permissions', () => {
            const userPerms = ROLE_PERMISSIONS[ROLES.USER];
            expect(userPerms).not.toContain(PERMISSIONS.MODERATE_CONTENT);
            expect(userPerms).not.toContain(PERMISSIONS.LOCK_FORUM);
            expect(userPerms).not.toContain(PERMISSIONS.EDIT_ANY_FORUM);
        });

        test('moderator should inherit user permissions', () => {
            const userPerms = ROLE_PERMISSIONS[ROLES.USER];
            const modPerms = ROLE_PERMISSIONS[ROLES.MODERATOR];

            userPerms.forEach(perm => {
                expect(modPerms).toContain(perm);
            });
        });

        test('moderator should have moderation permissions', () => {
            const modPerms = ROLE_PERMISSIONS[ROLES.MODERATOR];
            expect(modPerms).toContain(PERMISSIONS.MODERATE_CONTENT);
            expect(modPerms).toContain(PERMISSIONS.LOCK_FORUM);
            expect(modPerms).toContain(PERMISSIONS.LOCK_THREAD);
            expect(modPerms).toContain(PERMISSIONS.EDIT_ANY_FORUM);
            expect(modPerms).toContain(PERMISSIONS.DELETE_ANY_THREAD);
        });

        test('moderator should not have admin permissions', () => {
            const modPerms = ROLE_PERMISSIONS[ROLES.MODERATOR];
            expect(modPerms).not.toContain(PERMISSIONS.CHANGE_USER_ROLE);
            expect(modPerms).not.toContain(PERMISSIONS.VIEW_LOGS);
            expect(modPerms).not.toContain(PERMISSIONS.MANAGE_SYSTEM);
        });

        test('admin should inherit moderator permissions', () => {
            const modPerms = ROLE_PERMISSIONS[ROLES.MODERATOR];
            const adminPerms = ROLE_PERMISSIONS[ROLES.ADMIN];

            modPerms.forEach(perm => {
                expect(adminPerms).toContain(perm);
            });
        });

        test('admin should have admin-specific permissions', () => {
            const adminPerms = ROLE_PERMISSIONS[ROLES.ADMIN];
            expect(adminPerms).toContain(PERMISSIONS.CHANGE_USER_ROLE);
            expect(adminPerms).toContain(PERMISSIONS.VIEW_LOGS);
            expect(adminPerms).toContain(PERMISSIONS.MANAGE_SYSTEM);
            expect(adminPerms).toContain(PERMISSIONS.BAN_USER);
        });
    });

    describe('getRolePermissions()', () => {
        test('should return permissions for valid role', () => {
            const userPerms = getRolePermissions(ROLES.USER);
            expect(Array.isArray(userPerms)).toBe(true);
            expect(userPerms.length).toBeGreaterThan(0);
        });

        test('should return empty array for invalid role', () => {
            const perms = getRolePermissions('invalid_role');
            expect(perms).toEqual([]);
        });

        test('should return empty array for null/undefined', () => {
            expect(getRolePermissions(null)).toEqual([]);
            expect(getRolePermissions(undefined)).toEqual([]);
        });
    });

    describe('isValidRole()', () => {
        test('should return true for valid roles', () => {
            expect(isValidRole(ROLES.ADMIN)).toBe(true);
            expect(isValidRole(ROLES.MODERATOR)).toBe(true);
            expect(isValidRole(ROLES.USER)).toBe(true);
        });

        test('should return false for invalid roles', () => {
            expect(isValidRole('superadmin')).toBe(false);
            expect(isValidRole('guest')).toBe(false);
            expect(isValidRole('')).toBe(false);
            expect(isValidRole(null)).toBe(false);
            expect(isValidRole(undefined)).toBe(false);
        });
    });

    describe('getRoleLevel()', () => {
        test('should return correct level for valid roles', () => {
            expect(getRoleLevel(ROLES.USER)).toBe(0);
            expect(getRoleLevel(ROLES.MODERATOR)).toBe(1);
            expect(getRoleLevel(ROLES.ADMIN)).toBe(2);
        });

        test('should return -1 for invalid role', () => {
            expect(getRoleLevel('invalid')).toBe(-1);
            expect(getRoleLevel(null)).toBe(-1);
            expect(getRoleLevel(undefined)).toBe(-1);
        });
    });
});
