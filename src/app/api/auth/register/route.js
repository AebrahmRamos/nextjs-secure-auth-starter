import { NextResponse } from "next/server";
import User from "@/model/users";
import RefreshToken from "@/model/refreshtoken";
import SecurityLog from "@/model/securitylog";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";
import { getClientIP } from "@/lib/utils";

export async function POST(request) {
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    await connectToDatabase();

    const { username, email, password, role } = await request.json();

    if (!username || !email || !password) {
      await SecurityLog.logEvent({
        eventType: "VALIDATION_FAILURE",
        username: username || "unknown",
        ipAddress: clientIP,
        userAgent,
        details: { reason: "Missing required fields" },
        severity: "LOW",
      });
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      await SecurityLog.logEvent({
        eventType: "REGISTRATION",
        username,
        ipAddress: clientIP,
        userAgent,
        details: { reason: "User already exists", email },
        severity: "LOW",
      });
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    const userRole =
      role && ["admin", "moderator"].includes(role) ? role : "user";

    const newUser = new User({
      username,
      email,
      password,
      role: userRole,
    });
    await newUser.save();

    const accessToken = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: newUser._id, jti: Date.now() + Math.random() }, // Add unique identifier
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await RefreshToken.deleteMany({ user: newUser._id }); // Clear any existing tokens
    await RefreshToken.create({
      user: newUser._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ip: clientIP,
      userAgent,
    });

    await SecurityLog.logEvent({
      eventType: "REGISTRATION",
      userId: newUser._id,
      username: newUser.username,
      ipAddress: clientIP,
      userAgent,
      details: { email: newUser.email, role: newUser.role },
      severity: "LOW",
    });

    await SecurityLog.logEvent({
      eventType: "LOGIN_SUCCESS",
      userId: newUser._id,
      username: newUser.username,
      ipAddress: clientIP,
      userAgent,
      severity: "LOW",
      details: { loginMethod: "auto-login after registration" },
    });

    const response = NextResponse.json(
      {
        message: "Registered successfully",
        user: {
          username: newUser.username,
          role: newUser.role,
        },
        requiresSecuritySetup: true,
      },
      { status: 201 }
    );

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15,
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);

    if (error.name === "ValidationError") {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }

      await SecurityLog.logEvent({
        eventType: "VALIDATION_FAILURE",
        username: "unknown",
        ipAddress: clientIP,
        userAgent,
        details: { validationErrors },
        severity: "LOW",
      });

      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];

      await SecurityLog.logEvent({
        eventType: "VALIDATION_FAILURE",
        username: "unknown",
        ipAddress: clientIP,
        userAgent,
        details: { reason: `Duplicate ${field}`, field },
        severity: "LOW",
      });

      return NextResponse.json(
        {
          error: `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } already exists`,
        },
        { status: 409 }
      );
    }

    await SecurityLog.logEvent({
      eventType: "REGISTRATION",
      username: "unknown",
      ipAddress: clientIP,
      userAgent,
      details: { reason: "System error", error: error.message },
      severity: "HIGH",
    });

    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
