import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PostCard from "../components/Posts/PostCard";
import CategoryCard from "../components/UI/CategoryCard";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import { BookOpen } from "lucide-react";
import toast from "react-hot-toast";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchPosts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/posts?page=${page}&limit=6`);

      if (page === 1) {
        setPosts(response.data.posts);
      } else {
        setPosts((prev) => [...prev, ...response.data.posts]);
      }

      setPagination(response.data.pagination);
    } catch (error) {
      let message = "Failed to load posts. Please try again.";
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      toast.error(message);
      setError(message);
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch latest posts
        const postsResponse = await api.get("/posts?limit=6");
        setPosts(postsResponse.data.posts);

        // Fetch featured posts
        const featuredResponse = await api.get("/posts?limit=3&sort=popular");
        setFeaturedPosts(featuredResponse.data.posts);

        // Fetch categories
        const categoriesResponse = await api.get("/search/categories");
        setCategories(categoriesResponse.data.categories);
      } catch (err) {
        let message = "Failed to load posts";
        if (err.response?.data?.message) {
          message = err.response.data.message;
        } else if (err.message) {
          message = err.message;
        }
        toast.error(message);
        setError(message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh posts when user returns to home page
  useEffect(() => {
    const handleFocus = () => {
      // Refresh posts when user returns to the tab/window
      fetchPosts();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleStartWriting = () => {
    if (isAuthenticated) {
      navigate("/create-post");
    } else {
      navigate("/signup");
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/create-post");
    } else {
      navigate("/signup");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

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
              {isAuthenticated ? "Start Writing" : "Start Writing"}
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

            {/* Categories */}
            {categories.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Explore by Category
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {categories.map((category) => (
                    <CategoryCard
                      key={category.category}
                      category={category.category}
                      count={category.count}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Latest Posts */}
            {posts.length > 0 && (
              <section>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Call to Action */}
        <section className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Share Your Story?
            </h2>
            <p className="text-primary-100 mb-8 text-lg max-w-2xl mx-auto">
              Join thousands of writers who are already sharing their knowledge,
              experiences, and insights with the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Get Started
              </button>
              <Link
                to="/search"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Explore More
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
