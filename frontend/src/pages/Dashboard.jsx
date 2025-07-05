import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  BarChart3,
  FileText,
  Bookmark,
  Settings,
  Heart,
  MessageCircle,
  Save,
  Lock,
  Upload,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import ProfileCompletion from "../components/UI/ProfileCompletion";
import toast from "react-hot-toast";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "overview"
  );
  const [posts, setPosts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch published posts
      const publishedResponse = await api.get("/api/posts/user/published");
      setPosts(publishedResponse.data.posts);

      // Fetch draft posts
      const draftsResponse = await api.get("/api/posts/user/drafts");
      setDrafts(draftsResponse.data.posts);

      // Fetch bookmarks
      const bookmarksResponse = await api.get(
        `/api/users/${user._id}/bookmarks`
      );
      setBookmarks(bookmarksResponse.data.bookmarks);

      // Calculate stats
      const allPosts = [
        ...publishedResponse.data.posts,
        ...draftsResponse.data.posts,
      ];
      const totalViews = allPosts.reduce(
        (sum, post) => sum + (post.viewCount || 0),
        0
      );
      const totalLikes = allPosts.reduce(
        (sum, post) => sum + (post.likeCount || 0),
        0
      );
      const totalComments = allPosts.reduce(
        (sum, post) => sum + (post.commentCount || 0),
        0
      );

      setStats({
        totalPosts: allPosts.length,
        publishedPosts: publishedResponse.data.posts.length,
        draftPosts: draftsResponse.data.posts.length,
        totalViews,
        totalLikes,
        totalComments,
      });
    } catch (error) {
      // Don't show error for aborted requests
      if (
        error?.aborted ||
        error.code === "ECONNABORTED" ||
        error.code === "ERR_CANCELED" ||
        error.message === "canceled" ||
        error.name === "AbortError"
      ) {
        console.log("🛑 Dashboard data fetch was aborted");
        return;
      }
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const handleDeletePost = async (postId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/posts/${postId}`);
      toast.success("Post deleted successfully");
      fetchDashboardData();
    } catch (error) {
      // Don't show error for aborted requests
      if (
        error?.aborted ||
        error.code === "ECONNABORTED" ||
        error.code === "ERR_CANCELED" ||
        error.message === "canceled" ||
        error.name === "AbortError"
      ) {
        console.log("🛑 Delete post request was aborted");
        return;
      }
      toast.error("Failed to delete post");
    }
  };

  const handleProfileUpdate = async (data) => {
    try {
      // Clean up the data before sending
      const cleanedData = {
        ...data,
        interests: data.interests
          ? data.interests.filter((interest) => interest && interest.trim())
          : [],
        socialLinks: {
          website: data.socialLinks?.website || "",
          twitter: data.socialLinks?.twitter || "",
          github: data.socialLinks?.github || "",
          linkedin: data.socialLinks?.linkedin || "",
          instagram: data.socialLinks?.instagram || "",
          youtube: data.socialLinks?.youtube || "",
        },
        privacySettings: {
          profileVisibility:
            data.privacySettings?.profileVisibility || "public",
          showEmail: data.privacySettings?.showEmail || false,
          showLocation: data.privacySettings?.showLocation !== false,
          showInterests: data.privacySettings?.showInterests !== false,
          showSocialLinks: data.privacySettings?.showSocialLinks !== false,
        },
        notificationPreferences: {
          emailNotifications:
            data.notificationPreferences?.emailNotifications !== false,
          commentNotifications:
            data.notificationPreferences?.commentNotifications !== false,
          likeNotifications:
            data.notificationPreferences?.likeNotifications !== false,
          followNotifications:
            data.notificationPreferences?.followNotifications !== false,
          newsletter: data.notificationPreferences?.newsletter || false,
        },
      };

      await updateProfile(cleanedData);
      toast.success("Profile updated successfully");
    } catch (error) {
      // Don't show error for aborted requests
      if (
        error?.aborted ||
        error.code === "ECONNABORTED" ||
        error.code === "ERR_CANCELED" ||
        error.message === "canceled" ||
        error.name === "AbortError"
      ) {
        console.log("🛑 Profile update request was aborted");
        return;
      }
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await api.post(
        `/api/users/${user._id}/upload-avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update the form value
      setValue("avatar", response.data.avatar);

      // Update the user context
      updateProfile({ avatar: response.data.avatar });

      toast.success("Avatar uploaded successfully!");
    } catch (error) {
      console.error("Avatar upload error:", error);

      // Handle specific error cases
      if (error.response?.data?.error === "UPLOAD_FAILED") {
        toast.error(
          "Failed to upload image. Please try a different image or use a URL."
        );
      } else {
        toast.error("Failed to upload avatar. Please try again.");
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = () => {
    setValue("avatar", "");
    updateProfile({ avatar: "" });
    toast.success("Avatar removed");
  };

  const handlePasswordChange = async (data) => {
    try {
      await changePassword(data);
      resetPassword();
      toast.success("Password changed successfully");
    } catch (error) {
      // Don't show error for aborted requests
      if (
        error?.aborted ||
        error.code === "ECONNABORTED" ||
        error.code === "ERR_CANCELED" ||
        error.message === "canceled" ||
        error.name === "AbortError"
      ) {
        console.log("🛑 Password change request was aborted");
        return;
      }
      toast.error("Failed to change password");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - InkWell</title>
        <meta
          name="description"
          content="Manage your blog posts and account settings"
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {user.displayName || user.username}!
            </p>
          </div>
          <Link to="/create-post" className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Link>
        </div>

        {/* Profile Completion */}
        <ProfileCompletion
          user={user}
          completionPercentage={user.profileCompletion || 0}
        />

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                {
                  id: "posts",
                  label: `Published Posts${
                    stats.publishedPosts ? ` (${stats.publishedPosts})` : ""
                  }`,
                  icon: FileText,
                },
                {
                  id: "drafts",
                  label: `Drafts${
                    stats.draftPosts ? ` (${stats.draftPosts})` : ""
                  }`,
                  icon: BookOpen,
                },
                {
                  id: "bookmarks",
                  label: `Bookmarks${
                    bookmarks.length ? ` (${bookmarks.length})` : ""
                  }`,
                  icon: Bookmark,
                },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-primary-500 text-primary-600 dark:text-primary-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Posts
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalPosts}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Eye className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Views
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalViews}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Heart className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Likes
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalLikes}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageCircle className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Comments
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalComments}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Recent Posts
                </h3>
              </div>
              <div className="p-6">
                {posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.slice(0, 5).map((post) => (
                      <div
                        key={post._id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {post.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/post/${post.slug}`}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/edit-post/${post._id}`}
                            className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No posts yet. Create your first post to get started!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "posts" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Published Posts ({posts.length})
              </h3>
            </div>
            <div className="p-6">
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post._id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {post.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span>
                            {formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          <span>•</span>
                          <span>{post.viewCount || 0} views</span>
                          <span>•</span>
                          <span>{post.likeCount || 0} likes</span>
                          <span>•</span>
                          <span>{post.commentCount || 0} comments</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/post/${post.slug}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/edit-post/${post._id}`}
                          className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No published posts yet.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "drafts" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Draft Posts ({drafts.length})
              </h3>
            </div>
            <div className="p-6">
              {drafts.length > 0 ? (
                <div className="space-y-4">
                  {drafts.map((post) => (
                    <div
                      key={post._id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {post.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Last updated{" "}
                          {formatDistanceToNow(new Date(post.updatedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/edit-post/${post._id}`}
                          className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No draft posts yet.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "bookmarks" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Bookmarked Posts ({bookmarks.length})
              </h3>
            </div>
            <div className="p-6">
              {bookmarks.length > 0 ? (
                <div className="space-y-4">
                  {bookmarks.map((post) => (
                    <div
                      key={post._id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {post.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          By {post.author?.username} •{" "}
                          {formatDistanceToNow(new Date(post.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <Link
                        to={`/post/${post.slug}`}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No bookmarked posts yet.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Profile Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Profile Settings
                </h3>
              </div>
              <div className="p-6">
                <form
                  onSubmit={handleSubmit(handleProfileUpdate)}
                  className="space-y-6"
                >
                  {/* Avatar Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 relative">
                        {user.avatar ? (
                          <div className="relative">
                            <img
                              src={user.avatar}
                              alt={user.displayName || user.username}
                              className="w-16 h-16 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                            <button
                              type="button"
                              onClick={removeAvatar}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {(user.displayName || user.username)
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploadingAvatar ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {uploadingAvatar ? "Uploading..." : "Upload Image"}
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </div>
                        <div>
                          <input
                            type="url"
                            {...register("avatar")}
                            defaultValue={user.avatar}
                            className="input"
                            placeholder="Or enter image URL"
                          />
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Upload an image or enter a URL. Leave empty to use
                            default avatar.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        {...register("displayName", {
                          maxLength: {
                            value: 50,
                            message: "Display name cannot exceed 50 characters",
                          },
                        })}
                        defaultValue={user.displayName}
                        className="input"
                        placeholder="Your display name"
                      />
                      {errors.displayName && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.displayName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        {...register("location", {
                          maxLength: {
                            value: 100,
                            message: "Location cannot exceed 100 characters",
                          },
                        })}
                        defaultValue={user.location}
                        className="input"
                        placeholder="City, Country"
                      />
                      {errors.location && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.location.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      {...register("bio", {
                        maxLength: {
                          value: 500,
                          message: "Bio cannot exceed 500 characters",
                        },
                      })}
                      defaultValue={user.bio}
                      rows="3"
                      className="input"
                      placeholder="Tell us about yourself..."
                    />
                    {errors.bio && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.bio.message}
                      </p>
                    )}
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Interests (up to 10)
                    </label>
                    <div className="space-y-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                        <input
                          key={index}
                          type="text"
                          {...register(`interests.${index}`, {
                            maxLength: {
                              value: 30,
                              message: "Interest cannot exceed 30 characters",
                            },
                          })}
                          defaultValue={user.interests?.[index] || ""}
                          className="input"
                          placeholder={`Interest ${index + 1} (optional)`}
                        />
                      ))}
                    </div>
                    {errors.interests && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.interests.message}
                      </p>
                    )}
                  </div>

                  {/* Profile Customization */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Profile Theme
                      </label>
                      <select
                        {...register("profileTheme")}
                        defaultValue={user.profileTheme || "default"}
                        className="input"
                      >
                        <option value="default">Default</option>
                        <option value="minimal">Minimal</option>
                        <option value="creative">Creative</option>
                        <option value="professional">Professional</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Accent Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          {...register("accentColor")}
                          defaultValue={user.accentColor || "#3B82F6"}
                          className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                        />
                        <input
                          type="text"
                          {...register("accentColor")}
                          defaultValue={user.accentColor || "#3B82F6"}
                          className="input flex-1"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                      Social Links
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          {...register("socialLinks.website")}
                          defaultValue={user.socialLinks?.website}
                          className="input"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Twitter
                        </label>
                        <input
                          type="text"
                          {...register("socialLinks.twitter")}
                          defaultValue={user.socialLinks?.twitter}
                          className="input"
                          placeholder="@username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          GitHub
                        </label>
                        <input
                          type="text"
                          {...register("socialLinks.github")}
                          defaultValue={user.socialLinks?.github}
                          className="input"
                          placeholder="username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          LinkedIn
                        </label>
                        <input
                          type="url"
                          {...register("socialLinks.linkedin")}
                          defaultValue={user.socialLinks?.linkedin}
                          className="input"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Instagram
                        </label>
                        <input
                          type="text"
                          {...register("socialLinks.instagram")}
                          defaultValue={user.socialLinks?.instagram}
                          className="input"
                          placeholder="username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          YouTube
                        </label>
                        <input
                          type="url"
                          {...register("socialLinks.youtube")}
                          defaultValue={user.socialLinks?.youtube}
                          className="input"
                          placeholder="https://youtube.com/@channel"
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </form>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Privacy Settings
                </h3>
              </div>
              <div className="p-6">
                <form
                  onSubmit={handleSubmit(handleProfileUpdate)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      {...register("privacySettings.profileVisibility")}
                      defaultValue={
                        user.privacySettings?.profileVisibility || "public"
                      }
                      className="input"
                    >
                      <option value="public">Public - Anyone can view</option>
                      <option value="followers">Followers only</option>
                      <option value="private">Private - Only you</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Show Email Address
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Display your email on your public profile
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...register("privacySettings.showEmail")}
                        defaultChecked={
                          user.privacySettings?.showEmail || false
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Show Location
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Display your location on your public profile
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...register("privacySettings.showLocation")}
                        defaultChecked={
                          user.privacySettings?.showLocation !== false
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Show Interests
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Display your interests on your public profile
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...register("privacySettings.showInterests")}
                        defaultChecked={
                          user.privacySettings?.showInterests !== false
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Show Social Links
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Display your social media links on your public profile
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...register("privacySettings.showSocialLinks")}
                        defaultChecked={
                          user.privacySettings?.showSocialLinks !== false
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Save Privacy Settings
                  </button>
                </form>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Notification Preferences
                </h3>
              </div>
              <div className="p-6">
                <form
                  onSubmit={handleSubmit(handleProfileUpdate)}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email Notifications
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive notifications via email
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...register(
                          "notificationPreferences.emailNotifications"
                        )}
                        defaultChecked={
                          user.notificationPreferences?.emailNotifications !==
                          false
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Comment Notifications
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Notify when someone comments on your posts
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...register(
                          "notificationPreferences.commentNotifications"
                        )}
                        defaultChecked={
                          user.notificationPreferences?.commentNotifications !==
                          false
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Like Notifications
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Notify when someone likes your posts
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...register(
                          "notificationPreferences.likeNotifications"
                        )}
                        defaultChecked={
                          user.notificationPreferences?.likeNotifications !==
                          false
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Follow Notifications
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Notify when someone follows you
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...register(
                          "notificationPreferences.followNotifications"
                        )}
                        defaultChecked={
                          user.notificationPreferences?.followNotifications !==
                          false
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Newsletter
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive weekly newsletter with latest posts
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        {...register("notificationPreferences.newsletter")}
                        defaultChecked={
                          user.notificationPreferences?.newsletter || false
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Save Notification Settings
                  </button>
                </form>
              </div>
            </div>

            {/* Password Change */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Change Password
                </h3>
              </div>
              <div className="p-6">
                <form
                  onSubmit={handleSubmitPassword(handlePasswordChange)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      {...registerPassword("currentPassword", {
                        required: "Current password is required",
                      })}
                      className="input"
                      placeholder="Enter current password"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {passwordErrors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      {...registerPassword("newPassword", {
                        required: "New password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters",
                        },
                      })}
                      className="input"
                      placeholder="Enter new password"
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {passwordErrors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <button type="submit" className="btn-primary">
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
