import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import "react-quill/dist/quill.snow.css";
import { Save, Eye, Upload, X, Plus, Calendar } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import toast from "react-hot-toast";
import api from "../utils/api";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
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

  const onSubmit = async (data) => {
    if (!content.trim()) {
      toast.error("Please add some content to your post");
      return;
    }

    setIsLoading(true);
    try {
      const postData = {
        title: data.title,
        content: content,
        excerpt: data.excerpt || "",
        category: data.category,
        tags: tags,
        featuredImage: featuredImage,
        isPublished: isPublished,
      };

      const response = await api.post("/posts", postData);

      if (response.data && response.data.post) {
        toast.success(
          isPublished ? "Post published successfully!" : "Post saved as draft!"
        );

        // Navigate to the post detail page using the slug
        navigate(`/post/${response.data.post.slug}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      let message = "Failed to create post";

      if (
        error.response?.data?.errors &&
        Array.isArray(error.response.data.errors)
      ) {
        // Show all validation errors from backend
        message = error.response.data.errors.map((e) => e.message).join("\n");
      } else if (error.response?.data?.message) {
        if (error.response.data.message.includes("title already exists")) {
          message =
            "A post with this title already exists. Please choose a different title.";
        } else {
          message = error.response.data.message;
        }
      } else if (error.code === "ECONNABORTED") {
        message = "Request timed out. Please try again.";
      } else if (error.message) {
        message = error.message;
      }

      toast.error(message);
      console.error("Post creation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = () => {
    setIsPublished(false);
    handleSubmit(onSubmit)();
  };

  const handlePublish = () => {
    setIsPublished(true);
    handleSubmit(onSubmit)();
  };

  return (
    <>
      <Helmet>
        <title>Create Post - InkWell</title>
        <meta name="description" content="Create a new blog post" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create New Post
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Share your thoughts with the world
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="btn-outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? "Edit" : "Preview"}
            </button>
          </div>
        </div>

        {showPreview ? (
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
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                  className="btn-outline"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Draft"}
                </button>
              </div>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Publish Post
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

export default CreatePost;
