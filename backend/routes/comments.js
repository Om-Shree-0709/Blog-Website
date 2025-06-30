import express from "express";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import { protect, ownerOrAdmin } from "../middleware/auth.js";
import { validateComment, validateId } from "../middleware/validation.js";

const router = express.Router();

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post("/", protect, validateComment, async (req, res) => {
  try {
    const { content, postId, parentCommentId } = req.body;

    // Check if post exists and is published
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!post.isPublished) {
      return res
        .status(400)
        .json({ message: "Cannot comment on unpublished posts" });
    }

    // If this is a reply, check if parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
    }

    const comment = await Comment.create({
      content,
      post: postId,
      author: req.user._id,
      parentComment: parentCommentId || null,
    });

    await comment.populate("author", "username avatar");

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private (owner or admin)
router.put("/:id", protect, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    if (content.length > 1000) {
      return res
        .status(400)
        .json({ message: "Comment cannot exceed 1000 characters" });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user is authorized to update this comment
    if (
      req.user.role !== "admin" &&
      comment.author.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this comment" });
    }

    comment.content = content;
    await comment.save();

    await comment.populate("author", "username avatar");

    res.json({
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private (owner or admin)
router.delete("/:id", protect, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user is authorized to delete this comment
    if (
      req.user.role !== "admin" &&
      comment.author.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    // Delete the comment and all its replies
    await Comment.deleteMany({
      $or: [{ _id: id }, { parentComment: id }],
    });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/comments/:id/like
// @desc    Toggle like on a comment
// @access  Private
router.post("/:id/like", protect, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    await comment.toggleLike(req.user._id);

    res.json({
      message: "Like toggled successfully",
      liked: comment.likes.includes(req.user._id),
    });
  } catch (error) {
    console.error("Toggle comment like error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/comments/:id/replies
// @desc    Get replies for a comment
// @access  Public
router.get("/:id/replies", validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const replies = await Comment.getRepliesForComment(id)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments({ parentComment: id });

    res.json({
      replies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReplies: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get replies error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/comments/user/:userId
// @desc    Get all comments by a user
// @access  Public
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const comments = await Comment.find({ author: userId })
      .populate("author", "username avatar")
      .populate("post", "title slug")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments({ author: userId });

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
    console.error("Get user comments error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
