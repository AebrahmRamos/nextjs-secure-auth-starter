'use client';

import { useSession } from 'next-auth/react';
import { getRolePermissions, getRoleLevel } from '../config/roles.js';

/**
 * Custom hook for permission-based access control in React components
 * @returns {Object} Permission check utilities
 */
export function usePermission() {
    const { data: session, status } = useSession();
    const user = session?.user;
    const isLoading = status === 'loading';

    /**
     * Check if current user has a specific permission
     * @param {string} permission - The permission to check
     * @returns {boolean} True if user has the permission
     */
    const can = (permission) => {
        if (!user || !user.role) return false;
        const userPermissions = getRolePermissions(user.role);
        return userPermissions.includes(permission);
    };

    /**
     * Check if current user has a specific role
     * @param {string} role - The role to check
     * @returns {boolean} True if user has the role
     */
    const hasRole = (role) => {
        if (!user || !user.role) return false;
        return user.role === role;
    };

    /**
     * Check if current user has any of the specified roles
     * @param {string[]} roles - Array of roles to check
     * @returns {boolean} True if user has any of the roles
     */
    const hasAnyRole = (roles) => {
        if (!user || !user.role || !Array.isArray(roles)) return false;
        return roles.includes(user.role);
    };

    /**
     * Check if current user's role is at or above a certain level
     * @param {string} minimumRole - The minimum required role
     * @returns {boolean} True if user's role level is >= minimum role level
     */
    const hasMinimumRole = (minimumRole) => {
        if (!user || !user.role) return false;
        const userLevel = getRoleLevel(user.role);
        const requiredLevel = getRoleLevel(minimumRole);
        if (userLevel === -1 || requiredLevel === -1) return false;
        return userLevel >= requiredLevel;
    };

    /**
     * Check if current user owns a resource
     * @param {Object} resource - The resource object
     * @param {string} ownerField - The field name that contains the owner ID
     * @returns {boolean} True if user owns the resource
     */
    const ownsResource = (resource, ownerField = 'createdBy') => {
        if (!user || !resource) return false;
        const userId = user.id?.toString();
        const resourceOwnerId = resource[ownerField]?._id?.toString() || resource[ownerField]?.toString();
        return userId === resourceOwnerId;
    };

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        can,
        hasRole,
        hasAnyRole,
        hasMinimumRole,
        ownsResource,
    };
}

export default usePermission;
