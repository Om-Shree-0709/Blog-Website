const { body, param, query, validationResult } = require("express-validator");

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

// Validation rules for user registration
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
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

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

// Validation rules for post creation/update
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

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("tags.*")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Each tag must be between 1 and 20 characters"),

  body("excerpt")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Excerpt cannot exceed 300 characters"),

  handleValidationErrors,
];

// Validation rules for comment creation/update
const validateComment = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Comment must be between 1 and 1000 characters"),

  body("postId").isMongoId().withMessage("Invalid post ID"),

  body("parentCommentId")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent comment ID"),

  handleValidationErrors,
];

// Validation rules for user profile update
const validateProfileUpdate = [
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),

  body("socialLinks.website")
    .optional()
    .isURL()
    .withMessage("Please provide a valid website URL"),

  body("socialLinks.twitter")
    .optional()
    .matches(/^@?[a-zA-Z0-9_]{1,15}$/)
    .withMessage("Please provide a valid Twitter username"),

  body("socialLinks.github")
    .optional()
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage("Please provide a valid GitHub username"),

  body("socialLinks.linkedin")
    .optional()
    .isURL()
    .withMessage("Please provide a valid LinkedIn URL"),

  handleValidationErrors,
];

// Validation rules for search queries
const validateSearch = [
  query("query")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters"),

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
    .withMessage("Please select a valid category"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),

  handleValidationErrors,
];

// Validation rules for MongoDB ObjectId parameters
const validateObjectId = [
  param("id").isMongoId().withMessage("Invalid ID format"),

  handleValidationErrors,
];

// Validation rules for username parameter
const validateUsername = [
  param("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),

  handleValidationErrors,
];

// Validation rules for post slug parameter
const validateSlug = [
  param("slug")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Invalid slug format"),

  handleValidationErrors,
];

module.exports = {
  validateSignup,
  validateLogin,
  validatePost,
  validateComment,
  validateProfileUpdate,
  validateSearch,
  validateObjectId,
  validateUsername,
  validateSlug,
  handleValidationErrors,
};
