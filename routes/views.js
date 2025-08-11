const express = require("express");
const path = require("path");
const router = express.Router();

// Home page route
router.get("/", (req, res) => {
  res.render("login.ejs");
});

// Homepage route
router.get("/homepage", (req, res) => {
  res.render("homepage.ejs");
});

// Signup route
router.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

// Profile route
router.get("/profile", (req, res) => {
  res.render("profile.ejs");
});

// Products route
router.get("/products", (req, res) => {
  res.render("products.ejs");
});

// Import route
router.get("/import", (req, res) => {
  res.render("import.ejs", {
    BASE_API_URL: process.env.BASE_API_URL,
  });
});

// Test routes for different error types
router.get("/error/404", (req, res, next) => {
  const error = new Error("Custom 404 Error");
  error.status = 404;
  next(error);
});

router.get("/error/500", (req, res, next) => {
  const error = new Error("Custom 500 Error");
  error.status = 500;
  next(error);
});

router.get("/error/403", (req, res, next) => {
  const error = new Error("Access Forbidden");
  error.status = 403;
  next(error);
});

router.get("/error/throw", (req, res) => {
  throw new Error("Unexpected error occurred!");
});

router.get("/error/api", async (req, res, next) => {
  try {
    // Simulate API error
    const axios = require("axios");
    const response = await axios.get("https://invalid-url-that-will-fail.com");
    res.json(response.data);
  } catch (error) {
    const customError = new Error("API request failed");
    customError.status = 502;
    customError.details = error.message;
    next(customError);
  }
});

// 404 – Không tìm thấy route nào khớp
router.use((req, res) => {
  res.status(404).render("error", {
    error: {
      status: 404,
      title: "Page Not Found",
      message: "The page you're looking for doesn't exist.",
      details: `Requested URL: ${req.originalUrl}`,
    },
  });
});

// Xử lý lỗi tổng quát
router.use((err, req, res, next) => {
  console.error("Lỗi:", err.message);
  res.status(err.status || 500).render("error", {
    error: {
      status: err.status || 500,
      title: err.status >= 500 ? "Internal Server Error" : "Error",
      message: err.message || "Something went wrong on our end.",
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    },
  });
});

module.exports = router;
