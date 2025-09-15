const jwt = require("jsonwebtoken");
const User = require("../model/user");

const redirectIfLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.authToken;

    if (!token) {
      // No token, user is not logged in, continue to login page
      return next();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret-key"
    );

    // Check if user exists
    const user = await User.findById(decoded.userId).select("-password");

    if (user) {
      // User is logged in, redirect to homepage
      return res.redirect("/homepage");
    } else {
      // Invalid token, clear it and continue to login page
      res.clearCookie("authToken");
      return next();
    }
  } catch (error) {
    console.error("Redirect if logged in middleware error:", error.message);
    // Invalid token, clear it and continue to login page
    res.clearCookie("authToken");
    next();
  }
};

module.exports = redirectIfLoggedIn;
