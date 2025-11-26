import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import RefreshToken from "@/model/refreshtoken";
import User from "@/model/users";

export async function POST() {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token found" }, { status: 401 });
    }

    // Check if token exists in DB
    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 403 });
    }

    // Verify token validity
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Optional: rotate refresh token
    await RefreshToken.deleteOne({ token: refreshToken });

    const newRefreshToken = jwt.sign(
      { id: user._id, role: user.role, jti: Date.now() + Math.random() },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await RefreshToken.create({
      user: user._id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ip: "refresh",
      userAgent: "refresh"
    });

    // Issue new access token
    const newAccessToken = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Set both cookies
    cookieStore.set("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 15, // 15 minutes
    });

    cookieStore.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/refresh",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ message: "Tokens refreshed" }, { status: 200 });
  } catch (err) {
    console.error("Token refresh error:", err);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }
}
