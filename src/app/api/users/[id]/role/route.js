import { NextResponse } from "next/server";
import User from "@/model/users.js";
import connectToDatabase from "@/lib/mongodb.js";
import SecurityLog from "@/model/securitylog.js";
import { hasPermission } from "@/lib/rbac.js";
import { PERMISSIONS } from "@/config/permissions.js";

/**
 * PATCH /api/users/[id]/role
 * Update a user's role (partial update)
 * Requires CHANGE_USER_ROLE permission (admin only)
 */
export async function PATCH(req, { params }) {
  try {
    await connectToDatabase();

    const { id } = await params; // Next.js 15: params must be awaited
    const { newRole } = await req.json();

    // Get acting user from headers (set by middleware)
    const actingUserId = req.headers.get('x-user-id');
    const actingUserRole = req.headers.get('x-user-role');
    const actingUsername = req.headers.get('x-user-username');

    if (!actingUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const actingUser = await User.findById(actingUserId);
    if (!actingUser) {
      return NextResponse.json(
        { error: 'Acting user not found' },
        { status: 401 }
      );
    }

    // Check permission
    if (!hasPermission(actingUser, PERMISSIONS.CHANGE_USER_ROLE)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate new role
    const validRoles = ["user", "moderator", "admin"];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be: user, moderator, or admin" },
        { status: 400 }
      );
    }

    // Get target user
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const oldRole = targetUser.role;

    // Prevent changing own role
    if (actingUser._id.toString() === targetUser._id.toString()) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // Update role
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role: newRole },
      { new: true, runValidators: true }
    );

    // Log the role change
    await SecurityLog.create({
      eventType: "ROLE_UPDATE",
      username: actingUsername,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
      severity: "MEDIUM",
      details: {
        targetUserId: updatedUser._id.toString(),
        targetUsername: updatedUser.username,
        oldRole,
        newRole,
        by: actingUsername,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });

  } catch (err) {
    console.error("Role update error:", err);
    return NextResponse.json(
      { error: "Failed to update role", details: err.message },
      { status: 500 }
    );
  }
}
