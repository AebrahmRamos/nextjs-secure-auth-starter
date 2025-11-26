/**
 * Permission definitions for the RBAC system
 * These are granular capabilities that can be assigned to roles
 */

// User Management Permissions
export const PERMISSIONS = {
    // User Management
    VIEW_USERS: 'view_users',
    CREATE_USERS: 'create_users',
    EDIT_USER: 'edit_user',
    DELETE_USER: 'delete_user',
    CHANGE_USER_ROLE: 'change_user_role',
    VIEW_USER_DETAILS: 'view_user_details',

    // Forum Management
    CREATE_FORUM: 'create_forum',
    EDIT_OWN_FORUM: 'edit_own_forum',
    EDIT_ANY_FORUM: 'edit_any_forum',
    DELETE_OWN_FORUM: 'delete_own_forum',
    DELETE_ANY_FORUM: 'delete_any_forum',
    LOCK_FORUM: 'lock_forum',

    // Thread Management
    CREATE_THREAD: 'create_thread',
    EDIT_OWN_THREAD: 'edit_own_thread',
    EDIT_ANY_THREAD: 'edit_any_thread',
    DELETE_OWN_THREAD: 'delete_own_thread',
    DELETE_ANY_THREAD: 'delete_any_thread',
    LOCK_THREAD: 'lock_thread',

    // Reply Management
    CREATE_REPLY: 'create_reply',
    EDIT_OWN_REPLY: 'edit_own_reply',
    EDIT_ANY_REPLY: 'edit_any_reply',
    DELETE_OWN_REPLY: 'delete_own_reply',
    DELETE_ANY_REPLY: 'delete_any_reply',

    // Moderation
    MODERATE_CONTENT: 'moderate_content',
    VIEW_REPORTS: 'view_reports',
    BAN_USER: 'ban_user',

    // System
    VIEW_LOGS: 'view_logs',
    VIEW_ANALYTICS: 'view_analytics',
    MANAGE_SYSTEM: 'manage_system',
};

/**
 * Permission categories for better organization
 */
export const PERMISSION_CATEGORIES = {
    USER_MANAGEMENT: [
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.CREATE_USERS,
        PERMISSIONS.EDIT_USER,
        PERMISSIONS.DELETE_USER,
        PERMISSIONS.CHANGE_USER_ROLE,
        PERMISSIONS.VIEW_USER_DETAILS,
    ],
    FORUM_MANAGEMENT: [
        PERMISSIONS.CREATE_FORUM,
        PERMISSIONS.EDIT_OWN_FORUM,
        PERMISSIONS.EDIT_ANY_FORUM,
        PERMISSIONS.DELETE_OWN_FORUM,
        PERMISSIONS.DELETE_ANY_FORUM,
        PERMISSIONS.LOCK_FORUM,
    ],
    THREAD_MANAGEMENT: [
        PERMISSIONS.CREATE_THREAD,
        PERMISSIONS.EDIT_OWN_THREAD,
        PERMISSIONS.EDIT_ANY_THREAD,
        PERMISSIONS.DELETE_OWN_THREAD,
        PERMISSIONS.DELETE_ANY_THREAD,
        PERMISSIONS.LOCK_THREAD,
    ],
    REPLY_MANAGEMENT: [
        PERMISSIONS.CREATE_REPLY,
        PERMISSIONS.EDIT_OWN_REPLY,
        PERMISSIONS.EDIT_ANY_REPLY,
        PERMISSIONS.DELETE_OWN_REPLY,
        PERMISSIONS.DELETE_ANY_REPLY,
    ],
    MODERATION: [
        PERMISSIONS.MODERATE_CONTENT,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.BAN_USER,
    ],
    SYSTEM: [
        PERMISSIONS.VIEW_LOGS,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.MANAGE_SYSTEM,
    ],
};

export default PERMISSIONS;
