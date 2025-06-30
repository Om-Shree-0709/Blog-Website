import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Heart, Bookmark, Share2, Calendar, Clock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import toast from "react-hot-toast";
import api from "../utils/api";

const PostDetail = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!post) return;

    try {
      const response = await api.get(`/posts/${post._id}/comments`);
      setComments(response.data.comments);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  }, [post]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/posts/${slug}`);
        setPost(response.data.post);
      } catch (error) {
        console.error("Error fetching post:", error);
        setError("Post not found");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (post) {
      fetchComments();
    }
  }, [post, fetchComments]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      await api.post(`/posts/${post._id}/like`);
      setPost((prev) => ({
        ...prev,
        likes: prev.likes.includes(user._id)
          ? prev.likes.filter((id) => id !== user._id)
          : [...prev.likes, user._id],
      }));
    } catch (err) {
      toast.error("Failed to like post");
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to bookmark posts");
      return;
    }

    try {
      await api.post(`/users/${user._id}/bookmark/${post._id}`);
      toast.success("Bookmark updated");
    } catch (err) {
      toast.error("Failed to update bookmark");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await api.post("/comments", {
        content: newComment,
        postId: post._id,
      });
      setNewComment("");
      fetchComments();
      toast.success("Comment added successfully");
    } catch (err) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

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

  const isLiked = user && post.likes?.includes(user._id);
  const isBookmarked = user && user.bookmarks?.includes(post._id);

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Post Header */}
        <article className="mb-8">
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-8">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>

          {/* Meta Information */}
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
                <span>{post.readTime || 5} min read</span>
              </div>
            </div>
          </div>

          {/* Category and Tags */}
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked
                    ? "text-red-600 bg-red-100 dark:bg-red-900/30"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                <span>{post.likeCount || 0}</span>
              </button>

              {isAuthenticated && (
                <button
                  onClick={handleBookmark}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isBookmarked
                      ? "text-primary-600 bg-primary-100 dark:bg-primary-900/30"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Bookmark
                    className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`}
                  />
                  <span>Bookmark</span>
                </button>
              )}

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span>Share</span>
              </button>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              {post.viewCount || 0} views
            </div>
          </div>
        </article>

        {/* Post Content */}
        <div className="prose prose-lg max-w-none dark:prose-invert mb-12">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {/* Comments Section */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Comments
          </h2>

          {post.isPublished ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="btn-primary"
                >
                  {submittingComment ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 text-yellow-600 dark:text-yellow-400">
              Comments are only available on published posts.
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div
                key={comment._id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  {comment.author?.avatar ? (
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
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
            ))}
          </div>

          {comments.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No comments yet. Be the first to comment!
            </p>
          )}
        </section>
      </div>
    </>
  );
};

export default PostDetail;
