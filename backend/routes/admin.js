import express from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { admin, protect } from "../middleware/auth.js";
import { cacheMiddleware } from "../middleware/cache.js";

const router = express.Router();

// Middleware: must be logged in and admin
router.use(protect, admin);

// USERS
router.get("/users", cacheMiddleware(60), async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select("username email role createdAt avatar bio")
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(skip)
    .lean();

  const total = await User.countDocuments();

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
});

router.put("/users/:id", async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  }).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

router.delete("/users/:id", async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User deleted" });
});

// POSTS
router.get("/posts", cacheMiddleware(60), async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const posts = await Post.find()
    .select(
      "title slug excerpt author createdAt isPublished viewCount likeCount commentCount"
    )
    .populate("author", "username email")
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(skip)
    .lean();

  const total = await Post.countDocuments();

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
});

router.put("/posts/:id", async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!post) return res.status(404).json({ message: "Post not found" });
  res.json({ post });
});

router.delete("/posts/:id", async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  res.json({ message: "Post deleted" });
});

// Remove a user's like from a post
router.delete("/posts/:postId/like/:userId", async (req, res) => {
  const { postId, userId } = req.params;
  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ message: "Post not found" });
  const likeIndex = post.likes.indexOf(userId);
  if (likeIndex > -1) {
    post.likes.splice(likeIndex, 1);
    await post.save();
    return res.json({ message: "Like removed from post" });
  }
  res
    .status(404)
    .json({ message: "Like not found for this user on this post" });
});

// Remove a user's like from a comment
router.delete("/comments/:commentId/like/:userId", async (req, res) => {
  const { commentId, userId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment) return res.status(404).json({ message: "Comment not found" });
  const likeIndex = comment.likes.indexOf(userId);
  if (likeIndex > -1) {
    comment.likes.splice(likeIndex, 1);
    await comment.save();
    return res.json({ message: "Like removed from comment" });
  }
  res
    .status(404)
    .json({ message: "Like not found for this user on this comment" });
});

// Remove a user's bookmark from a post
router.delete("/users/:userId/bookmark/:postId", async (req, res) => {
  const { userId, postId } = req.params;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  const bookmarkIndex = user.bookmarks.indexOf(postId);
  if (bookmarkIndex > -1) {
    user.bookmarks.splice(bookmarkIndex, 1);
    await user.save();
    return res.json({ message: "Bookmark removed from user" });
  }
  res
    .status(404)
    .json({ message: "Bookmark not found for this user on this post" });
});

// COMMENTS
router.get("/comments", cacheMiddleware(60), async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const comments = await Comment.find()
    .select("content author post createdAt likeCount")
    .populate("author", "username")
    .populate("post", "title slug")
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(skip)
    .lean();

  const total = await Comment.countDocuments();

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
});

router.put("/comments/:id", async (req, res) => {
  const comment = await Comment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!comment) return res.status(404).json({ message: "Comment not found" });
  res.json({ comment });
});

router.delete("/comments/:id", async (req, res) => {
  const comment = await Comment.findByIdAndDelete(req.params.id);
  if (!comment) return res.status(404).json({ message: "Comment not found" });
  res.json({ message: "Comment deleted" });
});

export default router;
