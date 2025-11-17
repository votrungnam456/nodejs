import express from "express";
const router = express.Router();
import User from "@/model/user.js";
import authMiddleware from "@/middleware/auth.js";
import { HTTP_STATUS } from "@/constants/http.js";
import { MESSAGES } from "@/constants/messages.js";
import { API } from "@/constants/api.js";

// Get current user endpoint (protected route)
router.get(API.USER.ME, authMiddleware, async (req, res, next) => {
  try {
    res.json({
      status: HTTP_STATUS.OK,
      user: {
        username: req.user.username,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error("Get user error:", error.message);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
});

// Update user profile endpoint (protected route)
router.put(API.USER.ME, authMiddleware, async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: HTTP_STATUS.BAD_REQUEST,
        message: MESSAGES.SIGNUP_REQUIRED,
      });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      email: email,
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      return res.status(409).json({
        status: 409,
        message: MESSAGES.EMAIL_EXISTS,
      });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        firstName: firstName,
        lastName: lastName,
        email: email,
      },
      { new: true }
    );

    res.json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.PROFILE_UPDATED,
      user: {
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
});

export default router;
