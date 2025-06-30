import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { validateSearch } from "../middleware/validation.js";

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
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Search query must be at least 2 characters long" });
    }

    const searchQuery = {
      $or: [
        { username: { $regex: q, $options: "i" } },
        { bio: { $regex: q, $options: "i" } },
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
      query: q,
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
    const { q, limit = 20 } = req.query;

    let searchQuery = {};
    if (q && q.trim()) {
      searchQuery = { tags: { $regex: q, $options: "i" } };
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
      { $project: { name: "$_id", count: 1, _id: 0 } },
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
router.get("/global", async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Search query must be at least 2 characters long" });
    }

    const searchQuery = q.trim();

    // Search posts
    const postsQuery = {
      $and: [
        { isPublished: true },
        {
          $or: [
            { title: { $regex: searchQuery, $options: "i" } },
            { content: { $regex: searchQuery, $options: "i" } },
            { excerpt: { $regex: searchQuery, $options: "i" } },
            { tags: { $in: [new RegExp(searchQuery, "i")] } },
          ],
        },
      ],
    };

    const posts = await Post.find(postsQuery)
      .select(
        "title excerpt slug featuredImage readTime viewCount createdAt category tags"
      )
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Search users
    const usersQuery = {
      $or: [
        { username: { $regex: searchQuery, $options: "i" } },
        { bio: { $regex: searchQuery, $options: "i" } },
      ],
    };

    const users = await User.find(usersQuery)
      .select("username avatar bio role createdAt")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total counts
    const totalPosts = await Post.countDocuments(postsQuery);
    const totalUsers = await User.countDocuments(usersQuery);

    res.json({
      posts,
      users,
      query: searchQuery,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(Math.max(totalPosts, totalUsers) / limit),
        totalPosts,
        totalUsers,
        hasNextPage: page * limit < Math.max(totalPosts, totalUsers),
        hasPrevPage: page > 1,
      },
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

export default router;
