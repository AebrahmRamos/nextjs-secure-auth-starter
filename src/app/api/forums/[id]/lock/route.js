export async function PATCH(req, { params }) {
  const { id } = params;
  const { lock } = await req.json(); // true or false

  const user = await getUserFromCookie(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use RBAC system for authorization
  const { hasPermission } = await import("@/lib/rbac.js");
  const { PERMISSIONS } = await import("@/config/permissions.js");

  if (!hasPermission(user, PERMISSIONS.LOCK_FORUM)) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to lock forums" },
      { status: 403 }
    );
  }

  const forum = await Forum.findById(id);
  if (!forum)
    return NextResponse.json({ error: "Forum not found" }, { status: 404 });

  forum.locked = lock;
  await forum.save();

  return NextResponse.json({ success: true, data: forum });
}
