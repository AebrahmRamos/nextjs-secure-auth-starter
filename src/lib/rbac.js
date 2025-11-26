import { getRolePermissions, getRoleLevel } from '../config/roles.js';

/**
 * Check if a user has a specific permission
 * @param {Object} user - The user object with role property
 * @param {string} permission - The permission to check
 * @returns {boolean} True if user has the permission
 */
export function hasPermission(user, permission) {
    if (!user || !user.role) {
        return false;
    }

    const userPermissions = getRolePermissions(user.role);
    return userPermissions.includes(permission);
}

/**
 * Check if a user has a specific role
 * @param {Object} user - The user object with role property
 * @param {string} role - The role to check
 * @returns {boolean} True if user has the role
 */
export function hasRole(user, role) {
    if (!user || !user.role) {
        return false;
    }

    return user.role === role;
}

/**
 * Check if a user has any of the specified roles
 * @param {Object} user - The user object with role property
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean} True if user has any of the roles
 */
export function hasAnyRole(user, roles) {
    if (!user || !user.role || !Array.isArray(roles)) {
        return false;
    }

    return roles.includes(user.role);
}

/**
 * Check if a user's role is at or above a certain level
 * @param {Object} user - The user object with role property
 * @param {string} minimumRole - The minimum required role
 * @returns {boolean} True if user's role level is >= minimum role level
 */
export function hasMinimumRole(user, minimumRole) {
    if (!user || !user.role) {
        return false;
    }

    const userLevel = getRoleLevel(user.role);
    const requiredLevel = getRoleLevel(minimumRole);

    if (userLevel === -1 || requiredLevel === -1) {
        return false;
    }

    return userLevel >= requiredLevel;
}

/**
 * Check if a user can access a specific route based on route configuration
 * @param {Object} user - The user object
 * @param {string} route - The route path
 * @param {Object} routeConfig - Route configuration mapping
 * @returns {boolean} True if user can access the route
 */
export function canAccessRoute(user, route, routeConfig) {
    if (!routeConfig || !route) {
        return true; // If no config, allow access
    }

    // Find matching route in config
    for (const [pattern, requirements] of Object.entries(routeConfig)) {
        if (route.startsWith(pattern)) {
            // Check if requirements are met
            if (requirements.role) {
                if (Array.isArray(requirements.role)) {
                    return hasAnyRole(user, requirements.role);
                } else {
                    return hasRole(user, requirements.role);
                }
            }

            if (requirements.permission) {
                return hasPermission(user, requirements.permission);
            }

            if (requirements.minimumRole) {
                return hasMinimumRole(user, requirements.minimumRole);
            }
        }
    }

    return true; // No matching restrictions found
}

/**
 * Check if a user owns a resource
 * @param {Object} user - The user object
 * @param {Object} resource - The resource object with createdBy or similar field
 * @param {string} ownerField - The field name that contains the owner ID (default: 'createdBy')
 * @returns {boolean} True if user owns the resource
 */
export function ownsResource(user, resource, ownerField = 'createdBy') {
    if (!user || !resource) {
        return false;
    }

    const userId = user._id?.toString() || user.id?.toString();
    const resourceOwnerId = resource[ownerField]?._id?.toString() || resource[ownerField]?.toString();

    return userId === resourceOwnerId;
}

/**
 * Check if a user can edit a resource
 * Combines ownership check with permission check
 * @param {Object} user - The user object
 * @param {Object} resource - The resource to edit
 * @param {string} editOwnPermission - Permission for editing own resources
 * @param {string} editAnyPermission - Permission for editing any resources
 * @param {string} ownerField - The field name that contains the owner ID
 * @returns {boolean} True if user can edit the resource
 */
export function canEditResource(user, resource, editOwnPermission, editAnyPermission, ownerField = 'createdBy') {
    if (!user) {
        return false;
    }

    // Check if user can edit any resource
    if (hasPermission(user, editAnyPermission)) {
        return true;
    }

    // Check if user owns the resource AND has permission to edit own
    if (ownsResource(user, resource, ownerField) && hasPermission(user, editOwnPermission)) {
        return true;
    }

    return false;
}

/**
 * Check if a user can delete a resource
 * Combines ownership check with permission check
 * @param {Object} user - The user object
 * @param {Object} resource - The resource to delete
 * @param {string} deleteOwnPermission - Permission for deleting own resources
 * @param {string} deleteAnyPermission - Permission for deleting any resources
 * @param {string} ownerField - The field name that contains the owner ID
 * @returns {boolean} True if user can delete the resource
 */
export function canDeleteResource(user, resource, deleteOwnPermission, deleteAnyPermission, ownerField = 'createdBy') {
    if (!user) {
        return false;
    }

    // Check if user can delete any resource
    if (hasPermission(user, deleteAnyPermission)) {
        return true;
    }

    // Check if user owns the resource AND has permission to delete own
    if (ownsResource(user, resource, ownerField) && hasPermission(user, deleteOwnPermission)) {
        return true;
    }

    return false;
}
