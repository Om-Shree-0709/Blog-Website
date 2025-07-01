import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect route middleware
export const protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Check cookies (for browser use)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Admin middleware
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as admin" });
  }
};

// Author middleware
export const author = (req, res, next) => {
  if (req.user && (req.user.role === "author" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as author" });
  }
};

// Owner or Admin middleware
export const ownerOrAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user._id.toString() === req.params.id || req.user.role === "admin")
  ) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as owner or admin" });
  }
};
