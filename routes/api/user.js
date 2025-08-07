const express = require("express");
const axios = require("axios");
const router = express.Router();
const { connectDB } = require("../../connectDB");
const User = require("../../model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../../middleware/auth");

router.post("/user/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({
        status: 400,
        message: "Username and password are required",
      });
    }

    console.log("Login attempt:", { username, password });

    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(401).json({
        status: 401,
        message: "Invalid username or password",
      });
    }
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 401,
        message: "Invalid username or password",
      });
    }
    const token = jwt.sign(
      { userId: user._id }, // Payload
      process.env.JWT_SECRET || "fallback-secret-key", // Khóa bí mật
      { expiresIn: "1h" } // Tùy chọn (token sống 1 giờ)
    );

    // Set token as HTTP-only cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
    });

    res.json({
      status: 200,
      message: "Login successful",
      user: {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
    // // Demo login logic (replace with actual authentication)
    // if (username === 'admin' && password === 'password123') {
    //   res.json({
    //     status: 200,
    //     message: "Login successful",
    //     user: {
    //       username: username,
    //       role: "admin"
    //     }
    //   });
    // } else {
    //   res.status(401).json({
    //     status: 401,
    //     message: "Invalid username or password"
    //   });
    // }
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

router.post("/user/signup", async (req, res, next) => {
  try {
    const { username, password, firstName, lastName, email } = req.body;

    // Basic validation
    if (!username || !password || !firstName || !lastName || !email) {
      return res.status(400).json({
        status: 400,
        message: "All fields are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username: username }, { email: email }],
    });

    if (existingUser) {
      return res.status(409).json({
        status: 409,
        message: "Username or email already exists",
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
    res.status(201).json({
      status: 201,
      message: "Account created successfully",
      user: {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// Logout endpoint
router.post("/user/logout", (req, res) => {
  res.clearCookie("authToken");
  res.json({
    status: 200,
    message: "Logout successful",
  });
});

// Get current user endpoint (protected route)
router.get("/user/me", authMiddleware, async (req, res, next) => {
  try {
    res.json({
      status: 200,
      user: {
        username: req.user.username,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error("Get user error:", error.message);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// Update user profile endpoint (protected route)
router.put("/user/me", authMiddleware, async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        status: 400,
        message: "All fields are required",
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
        message: "Email already exists",
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
      status: 200,
      message: "Profile updated successfully",
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
      status: 500,
      message: "Internal server error",
    });
  }
});

module.exports = router;
