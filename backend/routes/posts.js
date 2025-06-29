const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const { protect, author, ownerOrAdmin } = require("../middleware/auth");
const {
  validatePost,
  validateObjectId,
  validateSlug,
} = require("../middleware/validation");

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all published posts with pagination
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      author: authorUsername,
      sort = "latest",
    } = req.query;

    // Build query
    const query = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = { $in: [tag.toLowerCase()] };
    }

    if (authorUsername) {
      const author = await User.findOne({ username: authorUsername })
        .select("_id")
        .lean();
      if (author) {
        query.author = author._id;
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

    // Use lean() for better performance and select only needed fields
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

    // Get total count efficiently
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
    console.error("Get posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/posts/:slug
// @desc    Get single post by slug
// @access  Public (but allow author/admin to view their own unpublished post)
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    let userId = null;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      // Try to get user from token
      const token = req.headers.authorization.split(" ")[1];
      const jwt = require("jsonwebtoken");
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (e) {}
    }

    // Try to find published post first
    let post = await Post.findOne({ slug, isPublished: true })
      .populate("author", "username avatar bio socialLinks")
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "author",
          select: "username avatar",
        },
      })
      .lean();

    // If not found, allow author or admin to view their own post
    if (!post && userId) {
      const draft = await Post.findOne({ slug })
        .populate("author", "username avatar bio socialLinks role _id")
        .populate({
          path: "comments",
          options: { sort: { createdAt: -1 } },
          populate: {
            path: "author",
            select: "username avatar",
          },
        })
        .lean();
      if (
        draft &&
        (draft.author?._id?.toString() === userId ||
          draft.author?.role === "admin")
      ) {
        post = draft;
      }
    }

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Increment view count asynchronously (don't wait for it)
    Post.findByIdAndUpdate(post._id, { $inc: { viewCount: 1 } }).exec();

    res.json({ post });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/posts/:id
// @desc    Get a post by ID (for editing)
// @access  Private (owner or admin)
router.get("/id/:id", protect, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate(
      "author",
      "username avatar role"
    );
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Only allow owner or admin
    if (
      req.user.role !== "admin" &&
      post.author._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this post" });
    }
    res.json({ post });
  } catch (error) {
    console.error("Get post by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private (author or admin)
router.post("/", protect, author, validatePost, async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      featuredImage,
      tags,
      category,
      isPublished = false,
    } = req.body;

    const post = await Post.create({
      title,
      content,
      excerpt,
      featuredImage,
      tags: tags || [],
      category,
      author: req.user._id,
      isPublished,
    });

    await post.populate("author", "username avatar");

    res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Create post error:", error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "A post with this title already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private (owner or admin)
router.put(
  "/:id",
  protect,
  validateObjectId,
  validatePost,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        content,
        excerpt,
        featuredImage,
        tags,
        category,
        isPublished,
      } = req.body;

      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Check if user is authorized to update this post
      if (
        req.user.role !== "admin" &&
        post.author.toString() !== req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this post" });
      }

      const updateFields = {};
      if (title !== undefined) updateFields.title = title;
      if (content !== undefined) updateFields.content = content;
      if (excerpt !== undefined) updateFields.excerpt = excerpt;
      if (featuredImage !== undefined)
        updateFields.featuredImage = featuredImage;
      if (tags !== undefined) updateFields.tags = tags;
      if (category !== undefined) updateFields.category = category;
      if (isPublished !== undefined) updateFields.isPublished = isPublished;

      const updatedPost = await Post.findByIdAndUpdate(id, updateFields, {
        new: true,
        runValidators: true,
      }).populate("author", "username avatar");

      res.json({
        message: "Post updated successfully",
        post: updatedPost,
      });
    } catch (error) {
      console.error("Update post error:", error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ message: "A post with this title already exists" });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private (owner or admin)
router.delete("/:id", protect, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is authorized to delete this post
    if (
      req.user.role !== "admin" &&
      post.author.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(id);

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Toggle like on a post
// @access  Private
router.post("/:id/like", protect, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!post.isPublished) {
      return res.status(400).json({ message: "Cannot like unpublished posts" });
    }

    await post.toggleLike(req.user._id);

    res.json({
      message: "Like toggled successfully",
      liked: post.likes.includes(req.user._id),
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/posts/:id/comments
// @desc    Get comments for a post
// @access  Public
router.get("/:id/comments", validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const Comment = require("../models/Comment");
    const comments = await Comment.getCommentsForPost(id)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments({
      post: id,
      parentComment: null,
    });

    res.json({
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/posts/user/drafts
// @desc    Get user's draft posts
// @access  Private
router.get("/user/drafts", protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({
      author: req.user._id,
      isPublished: false,
    })
      .populate("author", "username avatar")
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({
      author: req.user._id,
      isPublished: false,
    });

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
    console.error("Get drafts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/posts/user/published
// @desc    Get user's published posts
// @access  Private
router.get("/user/published", protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({
      author: req.user._id,
      isPublished: true,
    })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({
      author: req.user._id,
      isPublished: true,
    });

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
    console.error("Get published posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
