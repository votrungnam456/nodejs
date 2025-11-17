import express from "express";
const router = express.Router();
import User from "@/model/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authMiddleware from "@/middleware/auth.js";
import { HTTP_STATUS } from "@/constants/http.js";
import { MESSAGES } from "@/constants/messages.js";
import { API } from "@/constants/api.js";

// POST /auth/login
router.post(API.AUTH.LOGIN, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: HTTP_STATUS.BAD_REQUEST,
        message: MESSAGES.LOGIN_REQUIRED,
      });
    }

    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.LOGIN_INVALID,
      });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.LOGIN_INVALID,
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "fallback-secret-key",
      { expiresIn: "1h" }
    );

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res.json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.LOGIN_SUCCESS,
      user: {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Auth login error:", error.message);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
});

// POST /auth/signup
router.post(API.AUTH.SIGNUP, async (req, res) => {
  try {
    const { username, password, firstName, lastName, email } = req.body;

    if (!username || !password || !firstName || !lastName || !email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: HTTP_STATUS.BAD_REQUEST,
        message: MESSAGES.SIGNUP_REQUIRED,
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username: username }, { email: email }],
    });

    if (existingUser) {
      return res.status(409).json({
        status: 409,
        message: MESSAGES.SIGNUP_CONFLICT,
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const user = new User({
      username,
      password: hash,
      firstName: firstName,
      lastName: lastName,
      email: email,
    });

    await user.save();

    res.status(HTTP_STATUS.CREATED).json({
      status: HTTP_STATUS.CREATED,
      message: MESSAGES.SIGNUP_SUCCESS,
      user: {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Auth signup error:", error.message);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
});

// POST /auth/logout
router.post(API.AUTH.LOGOUT, (req, res) => {
  res.clearCookie("authToken");
  res.json({ status: HTTP_STATUS.OK, message: MESSAGES.LOGOUT_SUCCESS });
});

// POST /auth/forgot-password
router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email && !username) {
      return res.status(400).json({
        status: 400,
        message: "Email or username is required",
      });
    }

    const user = await User.findOne(
      email ? { email: email } : { username: username }
    );

    // For security, respond with success even if user not found
    if (!user) {
      return res.json({
        status: 200,
        message: "If that account exists, a reset link has been generated",
      });
    }

    const resetSecret =
      (process.env.JWT_SECRET || "fallback-secret-key") + user.password;
    const resetToken = jwt.sign(
      { userId: user._id.toString(), purpose: "password-reset" },
      resetSecret,
      { expiresIn: "15m" }
    );

    // In real app, email this token as a link
    return res.json({
      status: 200,
      message: "Password reset token generated",
      resetToken,
      expiresInMinutes: 15,
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
});

// POST /auth/reset-password
router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        status: 400,
        message: "Token and newPassword are required",
      });
    }

    const decodedUnverified = jwt.decode(token);
    if (!decodedUnverified || !decodedUnverified.userId) {
      return res.status(400).json({ status: 400, message: "Invalid token" });
    }

    const user = await User.findById(decodedUnverified.userId);
    if (!user) {
      return res.status(400).json({ status: 400, message: "Invalid token" });
    }

    const resetSecret =
      (process.env.JWT_SECRET || "fallback-secret-key") + user.password;

    let decoded;
    try {
      decoded = jwt.verify(token, resetSecret);
    } catch (err) {
      return res
        .status(400)
        .json({ status: 400, message: "Invalid or expired token" });
    }

    if (decoded.purpose !== "password-reset") {
      return res.status(400).json({ status: 400, message: "Invalid token" });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({
        status: 400,
        message: "Password must be at least 6 characters",
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);

    user.password = hash;
    await user.save();

    return res.json({
      status: 200,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
});

// POST /auth/change-password (requires auth)
router.post("/auth/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 400,
        message: "currentPassword and newPassword are required",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({
        status: 400,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: 401, message: "Current password is incorrect" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    user.password = hash;
    await user.save();

    return res.json({ status: 200, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error.message);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
});

export default router;
