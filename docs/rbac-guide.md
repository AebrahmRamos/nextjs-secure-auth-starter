# RBAC System Guide

This guide explains how to use and extend the Role-Based Access Control (RBAC) system.

## Overview

The RBAC system provides a flexible, permission-based authorization framework with three default roles:
- **User**: Basic permissions for creating and managing own content
- **Moderator**: Can moderate content created by others
- **Admin**: Full system access

## Architecture

### Configuration Files

```
src/config/
├── permissions.js    # 45 granular permissions
├── roles.js          # Role definitions & mappings
└── route-config.js   # Protected route configuration
```

### Core Utilities

```
src/lib/rbac.js       # Permission check functions
src/hooks/usePermission.js  # React hook for frontend
```

## Default Permissions

### User Permissions
- View users and user details
- Create/edit/delete own forums, threads, replies

### Moderator Permissions  
- All user permissions, plus:
- Edit/delete any forum, thread, reply
- Lock forums and threads
- View reports and moderate content

### Admin Permissions
- All moderator permissions, plus:
- Create/edit/delete users
- Change user roles
- Ban users
- View system logs and analytics
- Manage system settings

## Usage Examples

### Backend (API Routes)

#### Check Specific Permission
```javascript
import { hasPermission } from '@/lib/rbac.js';
import { PERMISSIONS } from '@/config/permissions.js';

export async function DELETE(request, { params }) {
  const user = await getUserFromRequest(request);
  
  if (!hasPermission(user, PERMISSIONS.DELETE_USER)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Proceed with deletion
}
```

#### Check Resource Ownership
```javascript
import { canEditResource } from '@/lib/rbac.js';
import { PERMISSIONS } from '@/config/permissions.js';

export async function PUT(request, { params }) {
  const user = await getUserFromRequest(request);
  const forum = await Forum.findById(params.id);
  
  if (!canEditResource(
    user,
    forum,
    PERMISSIONS.EDIT_OWN_FORUM,
    PERMISSIONS.EDIT_ANY_FORUM
  )) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Proceed with edit
}
```

#### Check Multiple Roles
```javascript
import { hasAnyRole } from '@/lib/rbac.js';
import { ROLES } from '@/config/roles.js';

if (!hasAnyRole(user, [ROLES.ADMIN, ROLES.MODERATOR])) {
  return NextResponse.json(
    { error: 'Requires admin or moderator role' },
    { status: 403 }
  );
}
```

### Frontend (React Components)

#### Basic Permission Check
```javascript
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/config/permissions';

function ForumActions({ forum }) {
  const { can } = usePermission();
  
  return (
    <div>
      {can(PERMISSIONS.EDIT_OWN_FORUM) && (
        <button>Edit</button>
      )}
      {can(PERMISSIONS.DELETE_ANY_FORUM) && (
        <button>Delete</button>
      )}
    </div>
  );
}
```

#### Role-Based Rendering
```javascript
import { usePermission } from '@/hooks/usePermission';
import { ROLES } from '@/config/roles';

function Navigation() {
  const { hasRole, hasAnyRole } = usePermission();
  
  return (
    <nav>
      <Link href="/forums">Forums</Link>
      
      {hasAnyRole([ROLES.ADMIN, ROLES.MODERATOR]) && (
        <Link href="/moderator">Moderator</Link>
      )}
      
      {hasRole(ROLES.ADMIN) && (
        <Link href="/admin">Admin</Link>
      )}
    </nav>
  );
}
```

#### Resource Ownership Check
```javascript
import { usePermission } from '@/hooks/usePermission';

function PostCard({ post }) {
  const { ownsResource, can } = usePermission();
  const canEdit = ownsResource(post) && can(PERMISSIONS.EDIT_OWN_POST);
  
  return (
    <div>
      <p>{post.content}</p>
      {canEdit && <button>Edit</button>}
    </div>
  );
}
```

## Extending the System

### Adding New Permissions

1. **Define permission** in `src/config/permissions.js`:
```javascript
export const PERMISSIONS = {
  // ... existing permissions
  
  // New feature permissions
  CREATE_REPORT: 'create_report',
  VIEW_REPORTS: 'view_reports',
  RESOLVE_REPORT: 'resolve_report',
};
```

2. **Map to roles** in `src/config/roles.js`:
```javascript
const MODERATOR_PERMISSIONS = [
  ...USER_PERMISSIONS,
  // ... existing moderator permissions
  
  // Add new permissions
  PERMISSIONS.VIEW_REPORTS,
  PERMISSIONS.RESOLVE_REPORT,
];
```

3. **Use in code**:
```javascript
if (!hasPermission(user, PERMISSIONS.VIEW_REPORTS)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Adding New Roles

1. **Define role** in `src/config/roles.js`:
```javascript
export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  GUEST: 'guest',  // New role
};

export const ROLE_HIERARCHY = {
  [ROLES.GUEST]: 0,   // Lowest
  [ROLES.USER]: 1,
  [ROLES.MODERATOR]: 2,
  [ROLES.ADMIN]: 3,   // Highest
};
```

2. **Define permissions** for the role:
```javascript
const GUEST_PERMISSIONS = [
  PERMISSIONS.VIEW_FORUMS,
  PERMISSIONS.VIEW_THREADS,
  // Read-only permissions
];

export const ROLE_PERMISSIONS = {
  [ROLES.GUEST]: GUEST_PERMISSIONS,
  [ROLES.USER]: USER_PERMISSIONS,
  // ...
};
```

3. **Update User model** in `src/model/users.js`:
```javascript
role: {
  type: String,
  enum: ['admin', 'moderator', 'user', 'guest'],
  required: true,
  default: 'guest',  // Changed from 'user'
},
```

### Protecting New Routes

The application uses standard admin and moderator routes:
- `/admin` - Admin-only dashboard
- `/moderator` - Moderator and admin dashboard

Add new protected routes to `src/config/route-config.js`:

```javascript
export const ROUTE_CONFIG = {
  '/admin': {
    role: ROLES.ADMIN,
  },
  
  '/moderator': {
    role: [ROLES.ADMIN, ROLES.MODERATOR],
  },
  
  // Add your custom routes
  '/reports': {
    role: [ROLES.ADMIN, ROLES.MODERATOR],
  },
  
  '/api/reports': {
    minimumRole: ROLES.MODERATOR,
  },
};
```

## API HTTP Method Standards

The application follows RESTful conventions for API routes:

| HTTP Method | Use Case | Example |
|-------------|----------|---------|
| `GET` | Retrieve resources | `GET /api/users` - list users |
| `POST` | Create new resources | `POST /api/forums` - create forum |
| `PATCH` | Partial update of resources | `PATCH /api/users/:id/role` - update role |
| `PUT` | Full replacement of resources | `PUT /api/forums/:id` - replace entire forum |
| `DELETE` | Remove resources | `DELETE /api/threads/:id` - delete thread |

**Best Practice**: Use `PATCH` for partial updates (like changing a single field) and `PUT` for replacing entire resources. This follows RFC 5789 standards.

```javascript
// Good: PATCH for partial update
const response = await fetch('/api/users/123/role', {
  method: 'PATCH',
  body: JSON.stringify({ newRole: 'moderator' })
});

// Good: PUT for full replacement
const response = await fetch('/api/forums/456', {
  method: 'PUT',
  body: JSON.stringify({ name, description, category, isLocked })
});
```

## Available Utility Functions

### Backend (`src/lib/rbac.js`)

| Function | Purpose | Example |
|----------|---------|---------|
| `hasPermission(user, permission)` | Check if user has specific permission | `hasPermission(user, PERMISSIONS.DELETE_USER)` |
| `hasRole(user, role)` | Check if user has specific role | `hasRole(user, ROLES.ADMIN)` |
| `hasAnyRole(user, roles)` | Check if user has any of specified roles | `hasAnyRole(user, [ROLES.ADMIN, ROLES.MOD])` |
| `hasMinimumRole(user, minRole)` | Check if user role >= minimum | `hasMinimumRole(user, ROLES.MODERATOR)` |
| `ownsResource(user, resource)` | Check resource ownership | `ownsResource(user, forum)` |
| `canEditResource(...)` | Combined ownership + permission check | See examples above |
| `canDeleteResource(...)` | Combined ownership + permission check | See examples above |
| `canAccessRoute(user, route, config)` | Route-based access check | Used in middleware |

### Frontend (`src/hooks/usePermission.js`)

```javascript
const {
  user,              // Current user object
  isAuthenticated,   // Boolean: is user logged in?
  isLoading,         // Boolean: is auth state loading?
  can,               // Check permission
  hasRole,           // Check role
  hasAnyRole,        // Check multiple roles
  hasMinimumRole,    // Check role hierarchy
  ownsResource,      // Check ownership
} = usePermission();
```

##Best Practices

### ✅ Do
- Use permission checks instead of role checks when possible
- Centralize permission definitions in `permissions.js`
- Test authorization logic with unit tests
- Document custom permissions clearly

### ❌ Don't
- Hardcode role strings (use `ROLES` constants)
- Check roles directly in components (use hooks)
- Create overly granular permissions (keep it simple)
- Skip authorization checks in API routes

## Troubleshooting

### Permission check returns false unexpectedly
- Verify permission is defined in `permissions.js`
- Check permission is mapped to role in `roles.js`
- Ensure user object has `role` property
- Check for typos in permission names

### Hook returns `isAuthenticated: false`
- Verify user is logged in via NextAuth
- Check session configuration in `auth.js`
- Ensure user data includes `role` property

### Route protection not working
- Check route is in `route-config.js`
- Verify middleware matcher includes the route
- Ensure middleware is enabled in `middleware.js`

## Migration from Hardcoded Roles

If you have existing code with hardcoded role checks:

### Before
```javascript
if (user.role === 'admin') {
  // Allow action
}
```

### After (Backend)
```javascript
import { hasRole } from '@/lib/rbac.js';
import { ROLES } from '@/config/roles.js';

if (hasRole(user, ROLES.ADMIN)) {
  // Allow action
}
```

### After (Frontend)
```javascript
import { usePermission } from '@/hooks/usePermission';
import { ROLES } from '@/config/roles';

const { hasRole } = usePermission();

if (hasRole(ROLES.ADMIN)) {
  // Render admin UI
}
```

## Security Considerations

1. **Always check permissions server-side** - Frontend checks are UX only
2. **Use specific permissions** - Prefer `PERMISSIONS.DELETE_USER` over `ROLES.ADMIN`
3. **Validate user object** - Check for null/undefined before permission checks
4. **Log authorization failures** - Monitor for potential security issues
5. **Keep permissions atomic** - One permission = one action

## Additional Resources

- [Testing Guide](./testing-guide.md) - How to test RBAC logic
- [Account Lockout Testing](./test-lockout.md) - Security features
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
