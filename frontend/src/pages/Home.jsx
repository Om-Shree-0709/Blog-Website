import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PostCard from "../components/Posts/PostCard";
import CategoryCard from "../components/UI/CategoryCard";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import { useRequestCancellation } from "../hooks/useRequestCancellation";
import { BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import HARDCODED_ARTICLES from "../utils/hardcodedArticles";

const Home = () => {
  // Start with hardcoded articles for instant render
  const [posts, setPosts] = useState(HARDCODED_ARTICLES);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  // Set loading to false initially to show hardcoded articles
  const [loading, setLoading] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Cancel requests when component unmounts
  useRequestCancellation("/api/posts", false);
  useRequestCancellation("/api/search", false);

  const fetchPosts = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      const response = await api.get(`/api/posts?page=${page}&limit=6`);

      if (page === 1) {
        setPosts(response.data.posts);
      } else {
        setPosts((prev) => [...prev, ...response.data.posts]);
      }

      setPagination(response.data.pagination);
    } catch (error) {
      // Don't show toast for aborted requests
      if (
        error?.aborted ||
        error.code === "ECONNABORTED" ||
        error.code === "ERR_CANCELED" ||
        error.message === "canceled" ||
        error.name === "AbortError"
      ) {
        console.log("🛑 fetchPosts request was aborted");
        return;
      }

      let message = "Failed to load posts. Please try again.";
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      toast.error(message);
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Progressive loading: Preview → Full data
  useEffect(() => {
    const fetchDataProgressively = async () => {
      try {
        // Phase 1: Fetch previews (ultra-fast)
        const [previewLatest, previewFeatured, categoriesResponse] =
          await Promise.all([
            api.get("/api/posts/preview?limit=4&sort=latest"),
            api.get("/api/posts/preview?limit=3&sort=popular"),
            api.get("/api/search/categories"),
          ]);

        // Set preview data immediately
        if (Array.isArray(previewLatest.data?.posts)) {
          setPosts(previewLatest.data.posts);
        }
        if (Array.isArray(previewFeatured.data?.posts)) {
          setFeaturedPosts(previewFeatured.data.posts);
        }
        if (Array.isArray(categoriesResponse.data?.categories)) {
          setCategories(categoriesResponse.data.categories);
        }

        setPreviewLoaded(true);

        // Phase 2: Fetch full data progressively (one by one)
        const fetchFullData = async () => {
          // Fetch full data for latest posts (4 posts)
          const latestPromises = previewLatest.data.posts.map(
            async (previewPost) => {
              try {
                const fullPost = await api.get(
                  `/api/posts/${previewPost.slug}`
                );
                return fullPost.data.post;
              } catch (error) {
                // Don't log errors for aborted requests
                if (
                  error?.aborted ||
                  error.code === "ECONNABORTED" ||
                  error.code === "ERR_CANCELED" ||
                  error.message === "canceled" ||
                  error.name === "AbortError"
                ) {
                  console.log(`🛑 Request aborted for ${previewPost.slug}`);
                  return null; // Return null to filter out aborted requests
                }
                console.error(
                  `Error fetching full data for ${previewPost.slug}:`,
                  error
                );
                return previewPost; // Fallback to preview data
              }
            }
          );

          // Fetch full data for featured posts (3 posts)
          const featuredPromises = previewFeatured.data.posts.map(
            async (previewPost) => {
              try {
                const fullPost = await api.get(
                  `/api/posts/${previewPost.slug}`
                );
                return fullPost.data.post;
              } catch (error) {
                // Don't log errors for aborted requests
                if (
                  error?.aborted ||
                  error.code === "ECONNABORTED" ||
                  error.code === "ERR_CANCELED" ||
                  error.message === "canceled" ||
                  error.name === "AbortError"
                ) {
                  console.log(`🛑 Request aborted for ${previewPost.slug}`);
                  return null; // Return null to filter out aborted requests
                }
                console.error(
                  `Error fetching full data for ${previewPost.slug}:`,
                  error
                );
                return previewPost; // Fallback to preview data
              }
            }
          );

          // Execute all promises in parallel but update state progressively
          const [latestResults, featuredResults] = await Promise.all([
            Promise.all(latestPromises),
            Promise.all(featuredPromises),
          ]);

          // Filter out null results from aborted requests
          const filteredLatest = latestResults.filter(
            (result) => result !== null
          );
          const filteredFeatured = featuredResults.filter(
            (result) => result !== null
          );

          // Update state with full data (only if we have results)
          if (filteredLatest.length > 0) {
            setPosts(filteredLatest);
          }
          if (filteredFeatured.length > 0) {
            setFeaturedPosts(filteredFeatured);
          }
        };

        // Start fetching full data
        fetchFullData();
      } catch (err) {
        // Don't show toast for aborted requests
        if (
          err?.aborted ||
          err.code === "ECONNABORTED" ||
          err.code === "ERR_CANCELED" ||
          err.message === "canceled" ||
          err.name === "AbortError"
        ) {
          console.log("🛑 Home component requests were aborted");
          return;
        }

        let message = "Failed to load posts";
        if (err.response?.data?.message) {
          message = err.response.data.message;
        } else if (err.message) {
          message = err.message;
        }
        toast.error(message);
        console.error("Error fetching data:", err);
      }
    };

    fetchDataProgressively();
  }, []);

  // Refresh posts when user returns to home page
  useEffect(() => {
    const handleFocus = () => {
      fetchPosts();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchPosts]);

  const handleStartWriting = () => {
    if (isAuthenticated) {
      navigate("/create-post");
    } else {
      navigate("/signup");
    }
  };

  // Modern card-style shimmer skeleton loader
  const PostSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 w-full animate-pulse overflow-hidden">
      <div
        className="h-48 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 rounded mb-4 shimmer"
        style={{ backgroundSize: "200% 100%" }}
      />
      <div
        className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 rounded w-3/4 mb-2 shimmer"
        style={{ backgroundSize: "200% 100%" }}
      />
      <div
        className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 rounded w-1/2 mb-2 shimmer"
        style={{ backgroundSize: "200% 100%" }}
      />
      <div
        className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 rounded w-1/3 shimmer"
        style={{ backgroundSize: "200% 100%" }}
      />
    </div>
  );

  // Show placeholder content if no posts
  const hasPosts = posts.length > 0 || featuredPosts.length > 0;

  return (
    <>
      <Helmet>
        <title>InkWell - Modern Blogging Platform</title>
        <meta
          name="description"
          content="Discover amazing stories, insights, and ideas from writers around the world."
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Discover Amazing Stories
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Explore insights, ideas, and perspectives from writers around the
            world. Join our community of creators and readers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search" className="btn-primary text-lg px-8 py-3">
              Explore Posts
            </Link>
            <button
              onClick={handleStartWriting}
              className="btn-outline text-lg px-8 py-3"
            >
              Start Writing
            </button>
          </div>
        </div>

        {!hasPosts ? (
          // Placeholder content when no posts exist
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to InkWell!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              This is a fresh start. Be the first to share your story and
              inspire others.
            </p>
            <button
              onClick={handleStartWriting}
              className="btn-primary text-lg px-8 py-3"
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          <>
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Featured Stories
                  </h2>
                  <Link
                    to="/search?sort=popular"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                  >
                    View all →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredPosts.map((post) => (
                    <PostCard key={post._id} post={post} featured />
                  ))}
                </div>
              </section>
            )}

            {/* Latest Posts */}
            {posts.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Latest Stories
                  </h2>
                  <Link
                    to="/search"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                  >
                    View all →
                  </Link>
                </div>
                {/* Posts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Explore Categories
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {categories.map((category) => (
                    <CategoryCard
                      key={category.name}
                      category={category.name}
                      count={category.count}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Load More Button */}
            {pagination.hasNextPage && (
              <div className="text-center">
                <button
                  onClick={() => fetchPosts(pagination.currentPage + 1)}
                  className="btn-outline"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load More Posts"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Home;
