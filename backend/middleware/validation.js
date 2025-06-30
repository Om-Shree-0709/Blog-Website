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
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),
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
