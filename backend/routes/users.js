import express from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { protect, admin, ownerOrAdmin } from "../middleware/auth.js";
import { validateProfileUpdate, validateId } from "../middleware/validation.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

// Configure Cloudinary (optional)
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("✅ Cloudinary configured successfully");
} else {
  console.log("⚠️ Cloudinary not configured - avatar uploads will be disabled");
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// @route   GET /api/users/:username
// @desc    Get user profile by username
// @access  Public
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findOne({ username })
      .populate("bookmarks", "title slug featuredImage excerpt")
      .select("-password")
      .populate("postCount");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's published posts
    const posts = await Post.find({
      author: user._id,
      isPublished: true,
    })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const total = await Post.countDocuments({
      author: user._id,
      isPublished: true,
    });

    res.json({
      user: {
        ...user.getPublicProfile(),
        postCount: await Post.countDocuments({
          author: user._id,
          isPublished: true,
        }),
      },
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (owner or admin)
router.put(
  "/:id",
  protect,
  validateId,
  validateProfileUpdate,
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log(
        "Profile update request body:",
        JSON.stringify(req.body, null, 2)
      );
      const {
        bio,
        avatar,
        socialLinks,
        displayName,
        location,
        interests,
        profileTheme,
        accentColor,
        privacySettings,
        notificationPreferences,
      } = req.body;

      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is authorized to update this profile
      if (req.user.role !== "admin" && req.user._id.toString() !== id) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this profile" });
      }

      // Update fields
      if (bio !== undefined) user.bio = bio;
      if (avatar !== undefined) user.avatar = avatar;
      if (displayName !== undefined) user.displayName = displayName;
      if (location !== undefined) user.location = location;
      if (interests !== undefined) {
        // Filter out empty interests
        user.interests = interests.filter(
          (interest) => interest && interest.trim()
        );
      }
      if (profileTheme !== undefined) user.profileTheme = profileTheme;
      if (accentColor !== undefined) user.accentColor = accentColor;

      // Handle nested objects properly
      if (socialLinks !== undefined) {
        user.socialLinks = {
          website: socialLinks.website || "",
          twitter: socialLinks.twitter || "",
          github: socialLinks.github || "",
          linkedin: socialLinks.linkedin || "",
          instagram: socialLinks.instagram || "",
          youtube: socialLinks.youtube || "",
        };
      }

      if (privacySettings !== undefined) {
        user.privacySettings = {
          profileVisibility: privacySettings.profileVisibility || "public",
          showEmail: privacySettings.showEmail || false,
          showLocation: privacySettings.showLocation !== false,
          showInterests: privacySettings.showInterests !== false,
          showSocialLinks: privacySettings.showSocialLinks !== false,
        };
      }

      if (notificationPreferences !== undefined) {
        user.notificationPreferences = {
          emailNotifications:
            notificationPreferences.emailNotifications !== false,
          commentNotifications:
            notificationPreferences.commentNotifications !== false,
          likeNotifications:
            notificationPreferences.likeNotifications !== false,
          followNotifications:
            notificationPreferences.followNotifications !== false,
          newsletter: notificationPreferences.newsletter || false,
        };
      }

      await user.save();

      res.json({
        message: "Profile updated successfully",
        user: user.getPublicProfile(),
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (admin)
router.delete("/:id", protect, admin, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === id) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/users/:id/bookmark/:postId
// @desc    Toggle bookmark for a post
// @access  Private
router.post("/:id/bookmark/:postId", protect, validateId, async (req, res) => {
  try {
    const { id, postId } = req.params;

    // Check if user is authorized
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Toggle bookmark
    const bookmarkIndex = user.bookmarks.indexOf(postId);
    if (bookmarkIndex > -1) {
      user.bookmarks.splice(bookmarkIndex, 1);
    } else {
      user.bookmarks.push(postId);
    }

    await user.save();

    res.json({
      message:
        bookmarkIndex > -1
          ? "Post removed from bookmarks"
          : "Post added to bookmarks",
      bookmarked: bookmarkIndex === -1,
    });
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/users/:id/bookmarks
// @desc    Get user's bookmarked posts
// @access  Private
router.get("/:id/bookmarks", protect, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if user is authorized
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(id).populate({
      path: "bookmarks",
      select: "title slug featuredImage excerpt createdAt",
      options: {
        sort: { createdAt: -1 },
        limit: limit * 1,
        skip: (page - 1) * limit,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const total = user.bookmarks.length;

    res.json({
      bookmarks: user.bookmarks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookmarks: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Private
router.get("/:id/stats", protect, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is authorized
    if (req.user._id.toString() !== id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get statistics
    const totalPosts = await Post.countDocuments({ author: id });
    const publishedPosts = await Post.countDocuments({
      author: id,
      isPublished: true,
    });
    const draftPosts = totalPosts - publishedPosts;
    const totalViews = await Post.aggregate([
      { $match: { author: user._id } },
      { $group: { _id: null, totalViews: { $sum: "$viewCount" } } },
    ]);

    res.json({
      stats: {
        totalPosts,
        publishedPosts,
        draftPosts,
        totalViews: totalViews[0]?.totalViews || 0,
        totalBookmarks: user.bookmarks.length,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/users/:id/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post(
  "/:id/upload-avatar",
  protect,
  validateId,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user is authorized
      if (req.user.role !== "admin" && req.user._id.toString() !== id) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this profile" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      let avatarUrl;

      // Check if Cloudinary is configured
      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "avatars",
              transformation: [
                { width: 400, height: 400, crop: "fill" },
                { quality: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          stream.end(req.file.buffer);
        });

        avatarUrl = result.secure_url;
      } else {
        // Fallback: Convert to base64 data URL
        const base64Image = req.file.buffer.toString("base64");
        const mimeType = req.file.mimetype;
        avatarUrl = `data:${mimeType};base64,${base64Image}`;

        console.log(
          "⚠️ Using base64 fallback for avatar upload (Cloudinary not configured)"
        );
      }

      // Update user avatar
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.avatar = avatarUrl;
      await user.save();

      res.json({
        message: "Avatar uploaded successfully",
        avatar: avatarUrl,
        user: user.getPublicProfile(),
      });
    } catch (error) {
      console.error("Avatar upload error:", error);

      // Handle specific Cloudinary errors
      if (error.message && error.message.includes("cloudinary")) {
        res.status(500).json({
          message:
            "Failed to upload image. Please try again or use a different image.",
          error: "UPLOAD_FAILED",
        });
      } else {
        res.status(500).json({
          message: "Failed to upload avatar",
          error: "SERVER_ERROR",
        });
      }
    }
  }
);

export default router;
