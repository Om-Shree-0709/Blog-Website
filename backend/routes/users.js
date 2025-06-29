const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const { protect, admin, ownerOrAdmin } = require("../middleware/auth");
const {
  validateProfileUpdate,
  validateUsername,
  validateObjectId,
} = require("../middleware/validation");

const router = express.Router();

// @route   GET /api/users/:username
// @desc    Get user profile by username
// @access  Public
router.get("/:username", validateUsername, async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findOne({ username })
      .populate("bookmarks", "title slug featuredImage excerpt")
      .select("-password");

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
      user: user.getPublicProfile(),
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
  validateObjectId,
  validateProfileUpdate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { bio, avatar, socialLinks } = req.body;

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
      const updateFields = {};
      if (bio !== undefined) updateFields.bio = bio;
      if (avatar !== undefined) updateFields.avatar = avatar;
      if (socialLinks !== undefined) updateFields.socialLinks = socialLinks;

      const updatedUser = await User.findByIdAndUpdate(id, updateFields, {
        new: true,
        runValidators: true,
      }).select("-password");

      res.json({
        message: "Profile updated successfully",
        user: updatedUser.getPublicProfile(),
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
router.delete("/:id", protect, admin, validateObjectId, async (req, res) => {
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
router.post(
  "/:id/bookmark/:postId",
  protect,
  validateObjectId,
  async (req, res) => {
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
  }
);

// @route   GET /api/users/:id/bookmarks
// @desc    Get user's bookmarked posts
// @access  Private
router.get("/:id/bookmarks", protect, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if user is authorized
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(id).populate({
      path: "bookmarks",
      select:
        "title slug featuredImage excerpt author createdAt readTime likeCount commentCount",
      populate: {
        path: "author",
        select: "username avatar",
      },
      options: {
        sort: { createdAt: -1 },
        limit: limit * 1,
        skip: (page - 1) * limit,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get total count
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

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get("/search", async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Search query must be at least 2 characters long" });
    }

    const searchQuery = {
      $or: [
        { username: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
      ],
    };

    const users = await User.find(searchQuery)
      .select("username avatar bio role createdAt")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(searchQuery);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
