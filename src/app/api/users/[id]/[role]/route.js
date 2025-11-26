import { NextResponse } from "next/server";
import User from "@/model/users.js";
import connectToDatabase from "@/lib/mongodb.js";
import SecurityLog from "@/model/securitylog.js";
import { hasPermission } from "@/lib/rbac.js";
import { PERMISSIONS } from "@/config/permissions.js";

export async function PUT(req, { params }) {
  const { id } = params;
  const { newRole } = await req.json();

  const validRoles = ["user", "moderator", "admin"]; // Added 'admin' to validRoles

  if (!validRoles.includes(newRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const oldRole = targetUser.role;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role: newRole },
      { new: true }
    );

    await SecurityLog.create({
      eventType: "ROLE_UPDATE",
      username: actingUser.username,
      ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
      severity: "MEDIUM",
      details: {
        targetUserId: updatedUser._id,
        oldRole,
        newRole,
        by: actingUser.username,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (err) {
    console.error("Role update error:", err);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}
