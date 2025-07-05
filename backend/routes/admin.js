import express from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { admin, protect } from "../middleware/auth.js";

const router = express.Router();

// Middleware: must be logged in and admin
router.use(protect, admin);

// USERS
router.get("/users", async (req, res) => {
  const users = await User.find().select("-password -__v").lean();
  res.json({ users });
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
router.get("/posts", async (req, res) => {
  const posts = await Post.find()
    .select("title slug author createdAt isPublished likes")
    .populate("author", "username email")
    .lean();
  res.json({ posts });
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
router.get("/comments", async (req, res) => {
  const comments = await Comment.find()
    .select("content author post createdAt likes")
    .populate("author", "username")
    .populate("post", "title")
    .lean();
  res.json({ comments });
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
