import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Twitter,
  Github,
  Linkedin,
  Globe,
  Edit,
  BookOpen,
  Eye,
} from "lucide-react";
import PostCard from "../components/Posts/PostCard";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/users/${username}?page=1&limit=6`);
        setUser(response.data.user);
        setPosts(response.data.posts);
        setPagination(response.data.pagination);
      } catch (err) {
        setError("User not found");
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  const loadMorePosts = async (page) => {
    try {
      const response = await api.get(
        `/api/users/${username}?page=${page}&limit=6`
      );
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error("Error loading more posts:", err);
    }
  };

  const isOwnProfile =
    currentUser && user && currentUser.username === user.username;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            User not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The user you're looking for doesn't exist.
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
        <title>{user.username} - InkWell</title>
        <meta
          name="description"
          content={user.bio || `Read posts by ${user.username}`}
        />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-24 h-24 rounded-full"
                  loading="lazy"
                />
              ) : (
                <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user.username}
                </h1>
                {user.role === "admin" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Admin
                  </span>
                )}
                {user.role === "author" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Author
                  </span>
                )}
                {isOwnProfile && (
                  <Link
                    to="/dashboard?tab=settings"
                    className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium text-primary-600 bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Profile
                  </Link>
                )}
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl">
                  {user.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined{" "}
                    {formatDistanceToNow(new Date(user.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{user.postCount || 0} posts</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>
                    {posts.reduce(
                      (total, post) => total + (post.viewCount || 0),
                      0
                    )}{" "}
                    views
                  </span>
                </div>
              </div>

              {/* Social Links */}
              {user.socialLinks &&
                Object.values(user.socialLinks).some((link) => link) && (
                  <div className="flex items-center space-x-3 mt-4">
                    {user.socialLinks.website && (
                      <a
                        href={user.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
                    {user.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${user.socialLinks.twitter.replace(
                          "@",
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {user.socialLinks.github && (
                      <a
                        href={`https://github.com/${user.socialLinks.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <Github className="h-5 w-5" />
                      </a>
                    )}
                    {user.socialLinks.linkedin && (
                      <a
                        href={user.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("posts")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "posts"
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Posts ({posts.length})
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab("bookmarks")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "bookmarks"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Bookmarks
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === "posts" && (
          <div>
            {posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-8">
                    <button
                      onClick={() => loadMorePosts(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => loadMorePosts(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No posts yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {isOwnProfile
                    ? "Get started by creating your first post."
                    : "This user hasn't published any posts yet."}
                </p>
                {isOwnProfile && (
                  <div className="mt-6">
                    <Link to="/create-post" className="btn-primary">
                      Create Post
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "bookmarks" && isOwnProfile && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Bookmarks feature coming soon
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You'll be able to save and organize your favorite posts here.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;
