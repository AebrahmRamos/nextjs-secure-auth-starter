import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "@/model/users";
import RefreshToken from "@/model/refreshtoken";
import SecurityLog from "@/model/securitylog";
import { connectToDatabase } from "@/lib/mongodb";

import { getClientIP } from "@/lib/utils";

export async function POST(request) {
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    await connectToDatabase();
    const { username, password } = await request.json();

    if (!username || !password) {
      await SecurityLog.logEvent({
        eventType: "LOGIN_FAILURE",
        userId: null,
        username: username || "unknown",
        ipAddress: clientIP,
        userAgent,
        severity: "LOW",
        details: { reason: "Missing credentials" },
      });

      return NextResponse.json(
        { error: "Invalid username and/or password" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      await SecurityLog.logEvent({
        eventType: "LOGIN_FAILURE",
        userId: null,
        username,
        ipAddress: clientIP,
        userAgent,
        severity: "MEDIUM",
        details: { reason: "User not found" },
      });

      return NextResponse.json(
        { error: "Invalid username and/or password" },
        { status: 401 }
      );
    }

    if (user.isAccountLocked) {
      await SecurityLog.logEvent({
        eventType: "LOGIN_FAILURE",
        userId: user._id,
        username: user.username,
        ipAddress: clientIP,
        userAgent,
        severity: "HIGH",
        details: { reason: "Account locked" },
      });

      return NextResponse.json(
        {
          error:
            "Account is temporarily locked due to multiple failed login attempts. Please try again later.",
        },
        { status: 423 }
      );
    }

    if (!user.isActive) {
      await SecurityLog.logEvent({
        eventType: "LOGIN_FAILURE",
        userId: user._id,
        username: user.username,
        ipAddress: clientIP,
        userAgent,
        severity: "HIGH",
        details: { reason: "Account inactive" },
      });

      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 403 }
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Update lastFailedAttempt without triggering validation
      await User.updateOne(
        { _id: user._id },
        { $set: { lastFailedAttempt: new Date() } }
      );
      await user.incLoginAttempts();

      await SecurityLog.logEvent({
        eventType: "LOGIN_FAILURE",
        userId: user._id,
        username: user.username,
        ipAddress: clientIP,
        userAgent,
        severity: "MEDIUM",
        details: {
          reason: "Invalid password",
          attemptCount: user.loginAttempts + 1,
        },
      });

      return NextResponse.json(
        { error: "Invalid username and/or password" },
        { status: 401 }
      );
    }

    await user.resetLoginAttempts();

    const accessToken = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id, jti: Date.now() + Math.random() }, // Add unique identifier
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await RefreshToken.deleteMany({ user: user._id });
    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ip: clientIP,
      userAgent,
    });

    await SecurityLog.logEvent({
      eventType: "LOGIN_SUCCESS",
      userId: user._id,
      username: user.username,
      ipAddress: clientIP,
      userAgent,
      severity: "LOW",
      details: { loginMethod: "credentials" },
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: "accessToken",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });

    cookieStore.set({
      name: "refreshToken",
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
      maxAge: 60 * 60 * 24 * 7,
    });

    const responseData = {
      message: "Login successful!",
      user: {
        username: user.username,
        role: user.role,
      },
      loginInfo: {
        currentLogin: new Date(),
        message: `Login successful at ${new Date().toLocaleString()}`,
        showModal: true // Always show modal for login info
      }
    };

    if (user.previousLogin) {
      responseData.lastLogin = {
        timestamp: user.previousLogin,
        message: `Last login: ${user.previousLogin.toLocaleString()}`,
      };
    }

    // Add failed attempt information
    if (user.lastFailedAttempt) {
      responseData.securityInfo = {
        lastFailedAttempt: user.lastFailedAttempt,
        message: `Last failed login attempt: ${user.lastFailedAttempt.toLocaleString()}`,
        hasFailedAttempts: true
      };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Login API Error:", error);

    await SecurityLog.logEvent({
      eventType: "LOGIN_FAILURE",
      userId: null,
      username: "unknown",
      ipAddress: clientIP,
      userAgent,
      severity: "HIGH",
      details: {
        reason: "System error",
        error: error.message,
      },
    });

    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
