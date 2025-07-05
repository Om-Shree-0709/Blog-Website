import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import "react-quill/dist/quill.snow.css";
import { Save, Eye, Upload, X, Plus, Calendar, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import toast from "react-hot-toast";
import api from "../utils/api";

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm();

  const title = watch("title");

  const categories = [
    "Technology",
    "Design",
    "Business",
    "Lifestyle",
    "Travel",
    "Food",
    "Health",
    "Education",
    "Entertainment",
    "Other",
  ];

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/posts/id/${id}`);
        const post = response.data.post;

        // Check if user is authorized to edit this post
        if (post.author._id !== user._id && user.role !== "admin") {
          toast.error("You are not authorized to edit this post");
          navigate("/");
          return;
        }

        setPost(post);
        setContent(post.content);
        setTags(post.tags || []);
        setFeaturedImage(post.featuredImage || "");
        setIsPublished(post.isPublished);

        // Set form values
        reset({
          title: post.title,
          excerpt: post.excerpt,
          category: post.category,
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
          console.log("🛑 Post fetch request was aborted");
          return;
        }
        console.error("Error fetching post:", error);
        toast.error("Failed to load post");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, user._id, user.role, setValue, reset, navigate]);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags([...tags, newTag.trim().toLowerCase()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFeaturedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data, publishStatus = null) => {
    setIsLoading(true);
    try {
      // Use the passed publishStatus or fall back to the current state
      const shouldPublish =
        publishStatus !== null ? publishStatus : isPublished;

      const postData = {
        title: data.title,
        content: content,
        excerpt: data.excerpt || "",
        category: data.category,
        tags: tags,
        featuredImage: featuredImage,
        isPublished: shouldPublish,
      };

      const response = await api.put(`/api/posts/${id}`, postData);

      if (response.data && response.data.post) {
        const wasDraft = !post.isPublished;
        const isNowPublished = shouldPublish;

        if (wasDraft && isNowPublished) {
          // Draft was published for the first time
          toast.success("Draft published successfully! Your post is now live.");
          navigate(`/post/${response.data.post.slug}`);
        } else if (isNowPublished) {
          // Published post was updated
          toast.success("Post updated successfully!");
          navigate(`/post/${response.data.post.slug}`);
        } else {
          // Draft was updated
          toast.success("Draft updated successfully!");
          navigate(`/post/${response.data.post.slug}`);
        }
      } else {
        throw new Error("Invalid response from server");
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
        console.log("🛑 Post update request was aborted");
        return;
      }
      const message = error.response?.data?.message || "Failed to update post";
      toast.error(message);
      console.error("Post update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await api.delete(`/api/posts/${id}`);
      toast.success("Post deleted successfully!");
      navigate("/dashboard");
    } catch (error) {
      // Don't show error for aborted requests
      if (
        error?.aborted ||
        error.code === "ECONNABORTED" ||
        error.code === "ERR_CANCELED" ||
        error.message === "canceled" ||
        error.name === "AbortError"
      ) {
        console.log("🛑 Post delete request was aborted");
        return;
      }
      const message = error.response?.data?.message || "Failed to delete post";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDraft = () => {
    handleSubmit((data) => onSubmit(data, false))();
  };

  const handlePublishDraft = () => {
    handleSubmit((data) => onSubmit(data, true))();
  };

  const handleUpdatePublished = () => {
    handleSubmit((data) => onSubmit(data, true))();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Post not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The post you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit Post - InkWell</title>
        <meta name="description" content="Edit your blog post" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Post
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Update your post content and settings
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="btn-outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              {isPreview ? "Edit" : "Preview"}
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="btn-outline text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {isPreview ? (
          /* Preview Mode */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {title || "Untitled Post"}
            </h1>
            {featuredImage && (
              <img
                src={featuredImage}
                alt="Featured"
                className="w-full h-64 object-cover rounded-lg mb-6"
                loading="lazy"
              />
            )}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                {...register("title", {
                  required: "Title is required",
                  maxLength: {
                    value: 200,
                    message: "Title cannot exceed 200 characters",
                  },
                })}
                className={`input text-2xl font-bold ${
                  errors.title
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : ""
                }`}
                placeholder="Enter your post title..."
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                {...register("category", { required: "Category is required" })}
                className={`input ${
                  errors.category
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : ""
                }`}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Featured Image
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="btn-outline cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </label>
                {featuredImage && (
                  <button
                    type="button"
                    onClick={() => setFeaturedImage("")}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {featuredImage && (
                <div className="mt-4">
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-32 h-32 object-cover rounded-lg"
                    loading="lazy"
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                  placeholder="Add a tag..."
                  className="input flex-1"
                />
                <button type="button" onClick={addTag} className="btn-outline">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Excerpt
              </label>
              <textarea
                {...register("excerpt", {
                  maxLength: {
                    value: 300,
                    message: "Excerpt cannot exceed 300 characters",
                  },
                })}
                rows={3}
                className={`input ${
                  errors.excerpt
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : ""
                }`}
                placeholder="Brief description of your post (optional)..."
              />
              {errors.excerpt && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.excerpt.message}
                </p>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content *
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={15}
                  className="w-full p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none font-mono text-sm"
                  placeholder={`# Welcome to InkWell!

Start writing your story in **Markdown** format.

## Features you can use:

- **Bold text** with \`**text**\`
- *Italic text* with \`*text*\`
- [Links](https://example.com) with \`[text](url)\`
- \`Inline code\` with backticks
- Lists like this one
- And much more!

Write your content here...`}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Use Markdown formatting. Click "Preview" to see how it will
                look.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="btn-outline text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </button>
              </div>
              <div className="flex items-center space-x-4">
                {post.isPublished ? (
                  // If post is currently published, show "Update Post" button
                  <button
                    type="button"
                    onClick={handleUpdatePublished}
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        Update Post
                      </>
                    )}
                  </button>
                ) : (
                  // If post is currently a draft, show both "Update Draft" and "Publish Draft" buttons
                  <>
                    <button
                      type="button"
                      onClick={handleUpdateDraft}
                      disabled={isLoading}
                      className="btn-outline"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? "Updating..." : "Update Draft"}
                    </button>
                    <button
                      type="button"
                      onClick={handlePublishDraft}
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          Publish Draft
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

export default EditPost;
