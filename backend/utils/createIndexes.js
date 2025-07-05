import mongoose from "mongoose";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";

export const createIndexes = async () => {
  try {
    console.log("🔄 Creating database indexes...");

    // Post indexes
    await Post.collection.createIndex({ isPublished: 1, createdAt: -1 });
    await Post.collection.createIndex({ slug: 1 });
    await Post.collection.createIndex({ category: 1, isPublished: 1 });
    await Post.collection.createIndex({ tags: 1, isPublished: 1 });
    await Post.collection.createIndex({ author: 1, isPublished: 1 });
    await Post.collection.createIndex({ isPublished: 1, viewCount: -1 });
    await Post.collection.createIndex({ title: "text", content: "text" });

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex({ isVerified: 1 });
    await User.collection.createIndex({ username: "text", bio: "text" });

    // Comment indexes
    await Comment.collection.createIndex({ post: 1, createdAt: -1 });
    await Comment.collection.createIndex({ author: 1, createdAt: -1 });
    await Comment.collection.createIndex({ parentComment: 1, createdAt: 1 });

    console.log("✅ Database indexes created successfully!");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
  }
};
