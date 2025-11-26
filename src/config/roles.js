import { PERMISSIONS } from './permissions.js';

/**
 * Role definitions with constants
 */
export const ROLES = {
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    USER: 'user',
};

/**
 * Role hierarchy - higher roles inherit permissions from lower roles
 */
export const ROLE_HIERARCHY = {
    [ROLES.USER]: 0,
    [ROLES.MODERATOR]: 1,
    [ROLES.ADMIN]: 2,
};

/**
 * Map roles to their permissions
 * Each role has a set of permissions they can perform
 */
const USER_PERMISSIONS = [
    // User can view users
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_USER_DETAILS,

    // User can manage their own forums
    PERMISSIONS.CREATE_FORUM,
    PERMISSIONS.EDIT_OWN_FORUM,
    PERMISSIONS.DELETE_OWN_FORUM,

    // User can manage their own threads
    PERMISSIONS.CREATE_THREAD,
    PERMISSIONS.EDIT_OWN_THREAD,
    PERMISSIONS.DELETE_OWN_THREAD,

    // User can manage their own replies
    PERMISSIONS.CREATE_REPLY,
    PERMISSIONS.EDIT_OWN_REPLY,
    PERMISSIONS.DELETE_OWN_REPLY,
];

const MODERATOR_PERMISSIONS = [
    // Inherit all user permissions
    ...USER_PERMISSIONS,

    // Moderator can edit/delete any content
    PERMISSIONS.EDIT_ANY_FORUM,
    PERMISSIONS.DELETE_ANY_FORUM,
    PERMISSIONS.EDIT_ANY_THREAD,
    PERMISSIONS.DELETE_ANY_THREAD,
    PERMISSIONS.EDIT_ANY_REPLY,
    PERMISSIONS.DELETE_ANY_REPLY,

    // Moderator can lock content
    PERMISSIONS.LOCK_FORUM,
    PERMISSIONS.LOCK_THREAD,

    // Moderation capabilities
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.VIEW_REPORTS,
];

const ADMIN_PERMISSIONS = [
    // Inherit all moderator permissions
    ...MODERATOR_PERMISSIONS,

    // Admin-specific permissions
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.CHANGE_USER_ROLE,
    PERMISSIONS.BAN_USER,

    // System capabilities
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_SYSTEM,
];

export const ROLE_PERMISSIONS = {
    [ROLES.USER]: USER_PERMISSIONS,
    [ROLES.MODERATOR]: MODERATOR_PERMISSIONS,
    [ROLES.ADMIN]: ADMIN_PERMISSIONS,
};

/**
 * Get all permissions for a given role
 * @param {string} role - The role name
 * @returns {string[]} Array of permission strings
 */
export function getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role is valid
 * @param {string} role - The role to check
 * @returns {boolean} True if the role is valid
 */
export function isValidRole(role) {
    return Object.values(ROLES).includes(role);
}

/**
 * Get role level in hierarchy
 * @param {string} role - The role name
 * @returns {number} The role level (higher = more permissions)
 */
export function getRoleLevel(role) {
    return ROLE_HIERARCHY[role] ?? -1;
}

export default ROLES;
