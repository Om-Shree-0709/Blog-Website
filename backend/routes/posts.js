import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { protect, author, ownerOrAdmin } from "../middleware/auth.js";
import {
  validatePost,
  validateId,
  validateSearch,
} from "../middleware/validation.js";

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
      const jwt = await import("jsonwebtoken");
      try {
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
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

// @route   GET /api/posts/id/:id
// @desc    Get a post by ID (for editing)
// @access  Private (owner or admin)
router.get("/id/:id", protect, validateId, async (req, res) => {
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
      seoTitle,
      seoDescription,
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
      seoTitle,
      seoDescription,
    });

    await post.populate("author", "username avatar");

    res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private (owner or admin)
router.put("/:id", protect, validateId, validatePost, async (req, res) => {
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
      seoTitle,
      seoDescription,
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

    // Update fields
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (featuredImage !== undefined) post.featuredImage = featuredImage;
    if (tags !== undefined) post.tags = tags;
    if (category !== undefined) post.category = category;
    if (isPublished !== undefined) post.isPublished = isPublished;
    if (seoTitle !== undefined) post.seoTitle = seoTitle;
    if (seoDescription !== undefined) post.seoDescription = seoDescription;

    await post.save();
    await post.populate("author", "username avatar");

    res.json({
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private (owner or admin)
router.delete("/:id", protect, validateId, async (req, res) => {
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
router.post("/:id/like", protect, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the post
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    let update;
    let liked;
    if (post.likes.includes(userId)) {
      // Unlike
      update = { $pull: { likes: userId } };
      liked = false;
    } else {
      // Like
      update = { $addToSet: { likes: userId } };
      liked = true;
    }

    const updatedPost = await Post.findByIdAndUpdate(id, update, { new: true });

    res.json({
      message: "Like toggled successfully",
      liked,
      likeCount: updatedPost.likes.length,
    });
  } catch (error) {
    console.error("Toggle post like error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/posts/:id/bookmark
// @desc    Toggle bookmark on a post
// @access  Private
router.post("/:id/bookmark", protect, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user._id);
    const bookmarkIndex = user.bookmarks.indexOf(id);

    if (bookmarkIndex > -1) {
      user.bookmarks.splice(bookmarkIndex, 1);
    } else {
      user.bookmarks.push(id);
    }

    await user.save();

    res.json({
      message: "Bookmark toggled successfully",
      bookmarked: user.bookmarks.includes(id),
    });
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/posts/user/published
// @desc    Get current user's published posts
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

// @route   GET /api/posts/user/drafts
// @desc    Get current user's draft posts
// @access  Private
router.get("/user/drafts", protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({
      author: req.user._id,
      isPublished: false,
    })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
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
    console.error("Get draft posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get all posts by a user
// @access  Public
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, published = true } = req.query;

    const query = { author: userId };
    if (published === "true") {
      query.isPublished = true;
    }

    const posts = await Post.find(query)
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

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
    console.error("Get user posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/posts/:id/comments
// @desc    Get comments for a post
// @access  Public
router.get("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const Comment = (await import("../models/Comment.js")).default;
    const comments = await Comment.find({ post: id, parentComment: null })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
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
    console.error("Get comments for post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
