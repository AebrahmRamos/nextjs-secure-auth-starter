"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { usePermission } from "@/hooks/usePermission";
import { ROLES } from "@/config/roles";

export default function Navigation() {
  const router = useRouter();
  const { user, loading, loggingOut, logout } = useAuth();
  const { hasRole, hasMinimumRole } = usePermission();

  if (loading) {
    return (
      <nav className="p-4 bg-white shadow flex gap-4">
        <span>Loading...</span>
      </nav>
    );
  }

  return (
    <nav className="p-4 bg-white shadow flex gap-4 items-center justify-between">
      <div className="flex gap-4">
        <Button
          variant="link"
          onClick={() => router.push("/")}
          className="text-blue-600 p-0"
        >
          Home
        </Button>

        {user && (
          <Button
            variant="link"
            onClick={() => router.push("/forums")}
            className="p-0"
          >
            Forums
          </Button>
        )}

        {hasRole(ROLES.ADMIN) && (
          <Button
            variant="link"
            onClick={() => router.push("/admin")}
            className="p-0"
          >
            Admin
          </Button>
        )}

        {hasMinimumRole(ROLES.MODERATOR) && (
          <Button
            variant="link"
            onClick={() => router.push("/moderator")}
            className="p-0"
          >
            Moderator
          </Button>
        )}
      </div>

      <div className="flex gap-4 items-center">
        {user ? (
          <Dropdown
            trigger={
              <Button variant="ghost" className="text-gray-600">
                Welcome, {user.username} ▼
              </Button>
            }
          >
            <DropdownMenuItem onClick={() => router.push("/change-password")}>
              Change Password
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={logout}
              className="text-red-600 hover:bg-red-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </Dropdown>
        ) : (
          <>
            <Button onClick={() => router.push("/login")}>Login</Button>
            <Button variant="outline" onClick={() => router.push("/register")}>
              Register
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
