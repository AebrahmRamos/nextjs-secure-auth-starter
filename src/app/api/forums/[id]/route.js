import { NextResponse } from "next/server";
import Forum from "@/model/forum";
import Thread from "@/model/thread";
import { connectToDatabase } from "@/lib/mongodb";
import { getUserFromCookie } from "@/lib/auth";
import SecurityLog from '@/model/securitylog';
import mongoose from "mongoose";

import { getClientIP } from "@/lib/utils";

/**
 * Validate if the provided ID is a valid MongoDB ObjectId
 *
 * @param {string} id The ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * GET /api/forums/[id]
 * Retrieve a specific forum by ID with optional thread count
 */
export async function GET(request, { params }) {
  const clientIP = getClientIP(request);

  try {
    await connectToDatabase();

    const { id } = await params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid forum ID format" },
        { status: 400 }
      );
    }

    // Find forum by ID
    const forum = await Forum.findById(id)
      .populate('createdBy', 'username email')
      .lean();

    if (!forum) {
      return NextResponse.json(
        { success: false, error: "Forum not found" },
        { status: 404 }
      );
    }

    // Get thread count for this forum (optional enhancement)
    const threadCount = await Thread.countDocuments({ forum: id });

    return NextResponse.json({
      success: true,
      data: {
        ...forum,
        threadCount
      }
    });

  } catch (error) {
    console.error('Error fetching forum:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch forum",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/forums/[id]
 * Update a specific forum by ID (requires authentication and ownership or admin)
 */
export async function PUT(request, { params }) {
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    await connectToDatabase();

    // Check authentication
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid forum ID format" },
        { status: 400 }
      );
    }

    const { title, description } = await request.json();

    // Find existing forum
    const existingForum = await Forum.findById(id).populate('createdBy');
    if (!existingForum) {
      return NextResponse.json({ success: false, error: 'Forum not found' }, { status: 404 });
    }

    // Use RBAC system for authorization
    const { canEditResource } = await import('@/lib/rbac.js');
    const { PERMISSIONS } = await import('@/config/permissions.js');

    if (!canEditResource(user, existingForum, PERMISSIONS.EDIT_OWN_FORUM, PERMISSIONS.EDIT_ANY_FORUM)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to edit this forum' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 }
      );
    }

    // Validate field lengths (based on schema)
    if (title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { success: false, error: "Title must be between 5 and 100 characters" },
        { status: 400 }
      );
    }

    if (description.length < 10 || description.length > 500) {
      return NextResponse.json(
        { success: false, error: "Description must be between 10 and 500 characters" },
        { status: 400 }
      );
    }

    // Update forum
    const updatedForum = await Forum.findByIdAndUpdate(
      id,
      {
        title: title.trim(),
        description: description.trim(),
        updatedAt: new Date()
      },
      {
        new: true, // Return updated document
        runValidators: true // Run schema validation
      }
    ).populate('createdBy', 'username email');

    return NextResponse.json({
      success: true,
      message: "Forum updated successfully",
      data: updatedForum
    });

  } catch (error) {
    console.error('Error updating forum:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationErrors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update forum",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/forums/[id]
 * Delete a specific forum by ID (requires authentication and ownership or admin)
 * Note: This will also need to handle cascading deletion of threads and posts
 */
export async function DELETE(request, { params }) {
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    await connectToDatabase();

    const user = await getUserFromCookie();
    const { id } = await params;

    if (!user) {
      await SecurityLog.logEvent({
        eventType: "FORUM_DELETE_UNAUTHORIZED",
        username: "unknown",
        ipAddress: clientIP,
        userAgent,
        details: { forumId: id },
        severity: "HIGH",
      });

      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid forum ID format" },
        { status: 400 }
      );
    }

    const existingForum = await Forum.findById(id);
    if (!existingForum) {
      return NextResponse.json(
        { success: false, error: "Forum not found" },
        { status: 404 }
      );
    }

    // Use RBAC system for authorization
    const { canDeleteResource } = await import('@/lib/rbac.js');
    const { PERMISSIONS } = await import('@/config/permissions.js');

    if (!canDeleteResource(
      user,
      existingForum,
      PERMISSIONS.DELETE_OWN_FORUM,
      PERMISSIONS.DELETE_ANY_FORUM
    )) {
      await SecurityLog.logEvent({
        eventType: "FORUM_DELETE_UNAUTHORIZED",
        username: user.username,
        ipAddress: clientIP,
        userAgent,
        details: { forumId: id },
        severity: "MEDIUM",
      });

      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: You do not have permission to delete this forum",
        },
        { status: 403 }
      );
    }

    const threadCount = await Thread.countDocuments({ forum: id });
    if (threadCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete forum with existing threads",
          details: `Forum has ${threadCount} thread(s). Please delete all threads first.`,
        },
        { status: 409 }
      );
    }

    await Forum.findByIdAndDelete(id);

    await SecurityLog.logEvent({
      eventType: "FORUM_DELETED",
      username: user.username,
      ipAddress: clientIP,
      userAgent,
      details: { forumId: id },
      severity: "LOW",
    });

    return NextResponse.json({
      success: true,
      message: "Forum deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting forum:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete forum",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}



