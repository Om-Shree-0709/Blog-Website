import { body, param, query, validationResult } from "express-validator";

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  next();
};

// Validation rules for user signup
const validateSignup = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  handleValidationErrors,
];

// Validation rules for user login
const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// Validation rules for post creation
const validatePost = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("content")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters long"),
  body("category")
    .isIn([
      "Technology",
      "Design",
      "Business",
      "Lifestyle",
      "Travel",
      "Food",
      "Health",
      "Education",
      "Entertainment",
      "Other",
    ])
    .withMessage("Please select a valid category"),
  handleValidationErrors,
];

// Validation rules for comment creation
const validateComment = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Comment must be between 1 and 1000 characters"),
  handleValidationErrors,
];

// Validation rules for user profile update
const validateProfileUpdate = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
  body("displayName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Display name cannot exceed 50 characters"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),
  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),
  body("interests")
    .optional()
    .isArray({ max: 10 })
    .withMessage("You can have up to 10 interests"),
  body("interests.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Each interest must be between 1 and 30 characters"),
  body("profileTheme")
    .optional()
    .isIn(["default", "minimal", "creative", "professional"])
    .withMessage("Invalid profile theme"),
  body("accentColor")
    .optional()
    .isLength({ max: 7 })
    .withMessage("Color must be a valid hex color"),
  body("privacySettings.profileVisibility")
    .optional()
    .isIn(["public", "followers", "private"])
    .withMessage("Invalid profile visibility setting"),
  body("privacySettings.showEmail")
    .optional()
    .isBoolean()
    .withMessage("showEmail must be a boolean"),
  body("privacySettings.showLocation")
    .optional()
    .isBoolean()
    .withMessage("showLocation must be a boolean"),
  body("privacySettings.showInterests")
    .optional()
    .isBoolean()
    .withMessage("showInterests must be a boolean"),
  body("privacySettings.showSocialLinks")
    .optional()
    .isBoolean()
    .withMessage("showSocialLinks must be a boolean"),
  body("notificationPreferences.emailNotifications")
    .optional()
    .isBoolean()
    .withMessage("emailNotifications must be a boolean"),
  body("notificationPreferences.commentNotifications")
    .optional()
    .isBoolean()
    .withMessage("commentNotifications must be a boolean"),
  body("notificationPreferences.likeNotifications")
    .optional()
    .isBoolean()
    .withMessage("likeNotifications must be a boolean"),
  body("notificationPreferences.followNotifications")
    .optional()
    .isBoolean()
    .withMessage("followNotifications must be a boolean"),
  body("notificationPreferences.newsletter")
    .optional()
    .isBoolean()
    .withMessage("newsletter must be a boolean"),
  body("socialLinks.website")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Website URL cannot exceed 200 characters"),
  body("socialLinks.twitter")
    .optional()
    .trim()
    .isLength({ max: 15 })
    .withMessage("Twitter username cannot exceed 15 characters"),
  body("socialLinks.github")
    .optional()
    .trim()
    .isLength({ max: 39 })
    .withMessage("GitHub username cannot exceed 39 characters"),
  body("socialLinks.linkedin")
    .optional()
    .isLength({ max: 200 })
    .withMessage("LinkedIn URL cannot exceed 200 characters"),
  body("socialLinks.instagram")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Instagram username cannot exceed 30 characters"),
  body("socialLinks.youtube")
    .optional()
    .isLength({ max: 200 })
    .withMessage("YouTube URL cannot exceed 200 characters"),
  handleValidationErrors,
];

// Validation rules for ID parameters
const validateId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidationErrors,
];

// Validation rules for search queries
const validateSearch = [
  query("q")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Search query cannot be empty"),
  query("category")
    .optional()
    .isIn([
      "Technology",
      "Design",
      "Business",
      "Lifestyle",
      "Travel",
      "Food",
      "Health",
      "Education",
      "Entertainment",
      "Other",
    ])
    .withMessage("Invalid category"),
  handleValidationErrors,
];

export {
  handleValidationErrors,
  validateSignup,
  validateLogin,
  validatePost,
  validateComment,
  validateProfileUpdate,
  validateId,
  validateSearch,
};
