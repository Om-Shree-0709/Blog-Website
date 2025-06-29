const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const { validateSearch } = require("../middleware/validation");

const router = express.Router();

// @route   GET /api/search/posts
// @desc    Search posts
// @access  Public
router.get("/posts", async (req, res) => {
  try {
    const {
      q = "",
      category,
      tag,
      author,
      sort = "latest",
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = { isPublished: true };

    // Text search
    if (q.trim()) {
      query.$text = { $search: q };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Tag filter
    if (tag) {
      query.tags = { $in: [tag.toLowerCase()] };
    }

    // Author filter
    if (author) {
      const authorUser = await User.findOne({ username: author })
        .select("_id")
        .lean();
      if (authorUser) {
        query.author = authorUser._id;
      }
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case "popular":
        sortOptions = { viewCount: -1, createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      case "latest":
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // If text search is used, add text score to sort
    if (q.trim()) {
      sortOptions = { score: { $meta: "textScore" }, ...sortOptions };
    }

    // Execute query with lean for better performance
    const posts = await Post.find(query)
      .select(
        "title excerpt slug featuredImage readTime viewCount createdAt category tags"
      )
      .populate("author", "username avatar bio")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()
      .exec();

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Search posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/search/users
// @desc    Search users
// @access  Public
router.get("/users", validateSearch, async (req, res) => {
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
      query,
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

// @route   GET /api/search/tags
// @desc    Search and get popular tags
// @access  Public
router.get("/tags", async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;

    let searchQuery = {};
    if (query && query.trim()) {
      searchQuery = { tags: { $regex: query, $options: "i" } };
    }

    // Get all posts with tags
    const posts = await Post.find({
      ...searchQuery,
      isPublished: true,
    }).select("tags");

    // Count tag occurrences
    const tagCounts = {};
    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Convert to array and sort by count
    const tags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    res.json({ tags });
  } catch (error) {
    console.error("Search tags error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/search/categories
// @desc    Get all categories with post counts
// @access  Public
router.get("/categories", async (req, res) => {
  try {
    // Use aggregation pipeline for better performance
    const categories = await Post.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { category: "$_id", count: 1, _id: 0 } },
    ]);

    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/search/global
// @desc    Global search across posts and users
// @access  Public
router.get("/global", validateSearch, async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Search query must be at least 2 characters long" });
    }

    // Search posts
    const posts = await Post.find({
      $text: { $search: query },
      isPublished: true,
    })
      .populate("author", "username avatar")
      .sort({ score: { $meta: "textScore" } })
      .limit(Math.ceil(limit / 2))
      .exec();

    // Search users
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
      ],
    })
      .select("username avatar bio role")
      .limit(Math.ceil(limit / 2))
      .exec();

    res.json({
      query,
      results: {
        posts,
        users,
      },
      totalResults: posts.length + users.length,
    });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get("/suggestions", async (req, res) => {
  try {
    const { query, type = "posts" } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    let suggestions = [];

    if (type === "posts" || type === "all") {
      const postSuggestions = await Post.find({
        $text: { $search: query },
        isPublished: true,
      })
        .select("title slug")
        .limit(5)
        .exec();

      suggestions.push(
        ...postSuggestions.map((post) => ({
          type: "post",
          title: post.title,
          slug: post.slug,
        }))
      );
    }

    if (type === "users" || type === "all") {
      const userSuggestions = await User.find({
        username: { $regex: query, $options: "i" },
      })
        .select("username")
        .limit(5)
        .exec();

      suggestions.push(
        ...userSuggestions.map((user) => ({
          type: "user",
          title: user.username,
          username: user.username,
        }))
      );
    }

    if (type === "tags" || type === "all") {
      const tagSuggestions = await Post.distinct("tags", {
        tags: { $regex: query, $options: "i" },
        isPublished: true,
      });

      suggestions.push(
        ...tagSuggestions.slice(0, 5).map((tag) => ({
          type: "tag",
          title: tag,
          tag: tag,
        }))
      );
    }

    res.json({ suggestions });
  } catch (error) {
    console.error("Get suggestions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
