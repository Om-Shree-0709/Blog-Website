import React, { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Eye, Bookmark } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";
import toast from "react-hot-toast";

const PostCard = ({ post, featured = false }) => {
  const { user, isAuthenticated } = useAuth();
  const [likes, setLikes] = useState(post.likes || []);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiked, setIsLiked] = useState(
    user && post.likes?.includes(user._id)
  );
  const [isBookmarked, setIsBookmarked] = useState(
    user && user.bookmarks?.includes(post._id)
  );

  const handleLike = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to like posts");
      return;
    }
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    try {
      await api.post(`/posts/${post._id}/like`);
    } catch (err) {
      setIsLiked((prev) => !prev);
      setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
      toast.error("Failed to like post");
    }
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to bookmark posts");
      return;
    }
    setIsBookmarked((prev) => !prev);
    try {
      await api.post(`/posts/${post._id}/bookmark`);
    } catch (err) {
      setIsBookmarked((prev) => !prev);
      toast.error("Failed to update bookmark");
    }
  };

  return (
    <article
      className={`card overflow-hidden transition-transform hover:scale-[1.02] ${
        featured ? "ring-2 ring-primary-200 dark:ring-primary-800" : ""
      }`}
    >
      {/* Featured Image */}
      {post.featuredImage && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Category */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-block px-2 py-1 text-xs font-medium text-primary-600 bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 rounded-full">
            {post.category}
          </span>
          {featured && (
            <span className="inline-block px-2 py-1 text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
              Featured
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/post/${post.slug}`}>
          <h3
            className={`font-bold text-gray-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors ${
              featured ? "text-xl" : "text-lg"
            }`}
          >
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        {/* Author */}
        <div className="flex items-center mb-4">
          {post.author?.avatar ? (
            <img
              src={post.author.avatar}
              alt={post.author.username}
              className="w-8 h-8 rounded-full mr-3"
            />
          ) : (
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-medium text-sm">
                {post.author?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <Link
              to={`/profile/${post.author?.username}`}
              className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
            >
              {post.author?.username}
            </Link>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <span>
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </span>
              <span className="mx-1">•</span>
              <span>{post.readTime || 5} min read</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                to={`/search?tag=${tag}`}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                #{tag}
              </Link>
            ))}
            {post.tags.length > 3 && (
              <span className="text-xs text-gray-400">
                +{post.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <button onClick={handleLike} className="focus:outline-none">
                <Heart
                  className={`h-4 w-4 ${
                    isLiked ? "text-red-500 fill-current" : ""
                  }`}
                />
              </button>
              <span>{likeCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{post.commentCount || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{post.viewCount || 0}</span>
            </div>
          </div>

          {isAuthenticated && (
            <button
              onClick={handleBookmark}
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isBookmarked ? "text-primary-600" : "text-gray-400"
              }`}
              title={
                isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"
              }
            >
              <Bookmark
                className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`}
              />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default PostCard;
