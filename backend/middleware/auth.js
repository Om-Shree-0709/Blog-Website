const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Middleware to check if user is admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Access denied. Admin role required." });
  }
};

// Middleware to check if user is author or admin
const author = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Access denied. Authentication required." });
  }
};

// Middleware to check if user owns the resource or is admin
const ownerOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (
      req.user.role === "admin" ||
      req.user._id.toString() === resourceUserId.toString()
    ) {
      next();
    } else {
      return res.status(403).json({
        message: "Access denied. You can only modify your own resources.",
      });
    }
  };
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.error("Optional auth error:", error);
    }
  }

  next();
};

module.exports = {
  protect,
  admin,
  author,
  ownerOrAdmin,
  optionalAuth,
};
