import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import {
  Heart,
  Bookmark,
  Share2,
  Calendar,
  Clock,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import toast from "react-hot-toast";
import api from "../utils/api";

const PostDetail = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();

  // Main content state (loads first)
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Secondary features state (load after main content)
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // User interaction state
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Reading progress state
  const [readingProgress, setReadingProgress] = useState(0);

  // Ref to track if comments have been loaded for current post
  const commentsLoadedRef = useRef(false);

  // Calculate estimated reading time
  const calculateReadingTime = (content) => {
    if (!content) return 5;
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return Math.max(readingTime, 1); // Minimum 1 minute
  };

  // Reading progress tracking
  useEffect(() => {
    const updateReadingProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min((scrollTop / docHeight) * 100, 100);
      setReadingProgress(progress);
    };

    window.addEventListener("scroll", updateReadingProgress);
    return () => window.removeEventListener("scroll", updateReadingProgress);
  }, []);

  // Phase 1: Load main content first (title, image, content)
  useEffect(() => {
    let isMounted = true;

    const fetchPost = async () => {
      try {
        setLoading(true);
        console.log("📖 Loading main post content...");
        const response = await api.get(`/api/posts/${slug}`);

        if (isMounted) {
          setPost(response.data.post);
          console.log("✅ Main post content loaded");
        }
      } catch (error) {
        // Don't show error for aborted requests
        if (
          error?.aborted ||
          error.code === "ECONNABORTED" ||
          error.code === "ERR_CANCELED" ||
          error.message === "canceled" ||
          error.name === "AbortError"
        ) {
          console.log("🛑 Post fetch request was aborted");
          return;
        }
        console.error("Error fetching post:", error);
        if (isMounted) {
          setError("Post not found");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPost();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Phase 2: Load comments after main content is ready
  useEffect(() => {
    if (!post || commentsLoading || commentsLoadedRef.current) return;

    const fetchComments = async () => {
      try {
        setCommentsLoading(true);
        console.log("💬 Loading comments...");
        const response = await api.get(`/api/posts/${post._id}/comments`);
        setComments(
          Array.isArray(response.data.comments) ? response.data.comments : []
        );
        commentsLoadedRef.current = true;
        console.log("✅ Comments loaded");
      } catch (err) {
        // Don't show error for aborted requests
        if (
          err?.aborted ||
          err.code === "ECONNABORTED" ||
          err.code === "ERR_CANCELED" ||
          err.message === "canceled" ||
          err.name === "AbortError"
        ) {
          console.log("🛑 Comments fetch request was aborted");
          return;
        }
        console.error("Error fetching comments:", err);
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };

    // Small delay to ensure main content renders first
    const timer = setTimeout(() => {
      fetchComments();
    }, 100);

    return () => clearTimeout(timer);
  }, [post?._id]); // Only depend on post._id, not the entire post object

  // Reset comments loaded ref when post changes
  useEffect(() => {
    commentsLoadedRef.current = false;
    setComments([]);
  }, [post?._id]);

  // Set up user interaction state after post loads
  useEffect(() => {
    if (post && user) {
      setIsLiked(post.likes?.includes(user._id));
      setIsBookmarked(user.bookmarks?.includes(post._id));
      setLikeCount(post.likeCount || 0);
    }
  }, [post, user]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to like posts");
      return;
    }
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    try {
      await api.post(`/api/posts/${post._id}/like`);
    } catch (err) {
      // Don't show error for aborted requests
      if (
        err?.aborted ||
        err.code === "ECONNABORTED" ||
        err.code === "ERR_CANCELED" ||
        err.message === "canceled" ||
        err.name === "AbortError"
      ) {
        console.log("🛑 Like request was aborted");
        return;
      }
      setIsLiked((prev) => !prev);
      setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
      toast.error("Failed to like post");
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to bookmark posts");
      return;
    }
    setIsBookmarked((prev) => !prev);
    try {
      await api.post(`/api/posts/${post._id}/bookmark`);
    } catch (err) {
      // Don't show error for aborted requests
      if (
        err?.aborted ||
        err.code === "ECONNABORTED" ||
        err.code === "ERR_CANCELED" ||
        err.message === "canceled" ||
        err.name === "AbortError"
      ) {
        console.log("🛑 Bookmark request was aborted");
        return;
      }
      setIsBookmarked((prev) => !prev);
      toast.error("Failed to update bookmark");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await api.post("/api/comments", {
        content: newComment,
        postId: post._id,
      });
      setNewComment("");

      // Refresh comments after adding a new one
      const response = await api.get(`/api/posts/${post._id}/comments`);
      setComments(
        Array.isArray(response.data.comments) ? response.data.comments : []
      );

      toast.success("Comment added successfully");
    } catch (err) {
      // Don't show error for aborted requests
      if (
        err?.aborted ||
        err.code === "ECONNABORTED" ||
        err.code === "ERR_CANCELED" ||
        err.message === "canceled" ||
        err.name === "AbortError"
      ) {
        console.log("🛑 Comment request was aborted");
        return;
      }
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  // Loading state for main content
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Post not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} - InkWell</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.featuredImage && (
          <meta property="og:image" content={post.featuredImage} />
        )}
      </Helmet>

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-50">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content - Renders immediately when post loads */}
        <article className="mb-8">
          {/* Featured Image - Loads with main content */}
          {post.featuredImage && (
            <div className="mb-8">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg transition-opacity duration-300"
                loading="lazy"
                onError={(e) => {
                  console.log("🖼️ Image failed to load, using fallback");
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23f3f4f6'/%3E%3Ctext x='400' y='200' text-anchor='middle' fill='%236b7280' font-family='system-ui' font-size='16'%3EImage not available%3C/text%3E%3C/svg%3E";
                  e.target.classList.add("opacity-50");
                }}
                onLoad={(e) => {
                  e.target.classList.remove("opacity-50");
                }}
              />
            </div>
          )}

          {/* Title - Available immediately */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>

          {/* Meta Information - Available immediately */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                to={`/profile/${post.author?.username}`}
                className="flex items-center space-x-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {post.author?.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.username}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      console.log("🖼️ Author avatar failed to load");
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {post.author?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="font-medium text-gray-900 dark:text-white">
                  {post.author?.username}
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{calculateReadingTime(post.content)} min read</span>
              </div>
            </div>
          </div>

          {/* Category and Tags - Available immediately */}
          <div className="flex items-center space-x-4 mb-6">
            <span className="inline-block px-3 py-1 text-sm font-medium text-primary-600 bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 rounded-full">
              {post.category}
            </span>
            {post.tags && post.tags.length > 0 && (
              <div className="flex items-center space-x-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/search?tag=${tag}`}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons - Available immediately */}
          <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked
                    ? "text-red-600 bg-red-100 dark:bg-red-900/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                }`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                <span>{likeCount}</span>
              </button>
              <button
                onClick={handleBookmark}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isBookmarked
                    ? "text-blue-600 bg-blue-100 dark:bg-blue-900/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                <Bookmark
                  className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`}
                />
                <span>Bookmark</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Main Content - Available immediately */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </article>

        {/* Comments Section - Loads progressively after main content */}
        <section className="mt-12">
          <div className="flex items-center space-x-2 mb-6">
            <MessageCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Comments
            </h2>
            {commentsLoading && (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Loading comments...
                </span>
              </div>
            )}
          </div>

          {/* Comment Form */}
          {isAuthenticated && (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows="3"
                disabled={submittingComment}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingComment ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {commentsLoading ? (
              // Skeleton loading for comments
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div
                  key={comment._id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start space-x-3">
                    {comment.author?.avatar ? (
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.username}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          console.log("🖼️ Comment avatar failed to load");
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {comment.author?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {comment.author?.username}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No comments yet. Be the first to share your thoughts!
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default PostDetail;
