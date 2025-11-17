import jwt from "jsonwebtoken";
import User from "@/model/user.js";

const pageAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.authToken;

    if (!token) {
      // Redirect to login page if no token
      return res.redirect("/");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret-key"
    );

    // Get user info without password
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      // Clear invalid token and redirect to login
      res.clearCookie("authToken");
      return res.redirect("/");
    }

    // Add user info to request for use in templates
    req.user = user;
    next();
  } catch (error) {
    console.error("Page auth middleware error:", error.message);
    // Clear invalid token and redirect to login
    res.clearCookie("authToken");
    res.redirect("/");
  }
};

export default pageAuthMiddleware;
