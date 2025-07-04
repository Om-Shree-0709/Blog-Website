import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search as SearchIcon, Filter, X } from "lucide-react";
import PostCard from "../components/Posts/PostCard";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import api from "../utils/api";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    query: searchParams.get("query") || "",
    category: searchParams.get("category") || "",
    sort: searchParams.get("sort") || "relevance",
  });

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

  const sortOptions = [
    { value: "relevance", label: "Most Relevant" },
    { value: "latest", label: "Latest" },
    { value: "popular", label: "Most Popular" },
    { value: "oldest", label: "Oldest" },
  ];

  // Debounce search
  const debounceTimeout = useRef();
  useEffect(() => {
    if (!filters.query && !filters.category) {
      setPosts([]);
      return;
    }
    setLoading(true);
    setError(null);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (filters.query) params.append("query", filters.query);
        if (filters.category) params.append("category", filters.category);
        if (filters.sort) params.append("sort", filters.sort);
        const response = await api.get("/api/search/posts", { params });
        setPosts(response.data.posts);
      } catch (err) {
        setError("Failed to fetch search results");
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 1000); // 1 second debounce
    return () => clearTimeout(debounceTimeout.current);
  }, [filters]);

  // Remove form submit for search, update search params on input change
  const handleInputChange = (e) => {
    const newFilters = { ...filters, query: e.target.value };
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.query) params.set("query", newFilters.query);
    if (newFilters.category) params.set("category", newFilters.category);
    if (newFilters.sort !== "relevance") params.set("sort", newFilters.sort);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      category: "",
      sort: "relevance",
    });
    setSearchParams({});
  };

  const hasActiveFilters =
    filters.query || filters.category || filters.sort !== "relevance";

  return (
    <>
      <Helmet>
        <title>Search - InkWell</title>
        <meta
          name="description"
          content="Search for posts, authors, and topics on InkWell"
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Search
          </h1>

          {/* Search Form */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.query}
                  onChange={handleInputChange}
                  placeholder="Search posts, authors, or tags..."
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filters:
              </span>
            </div>

            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="input text-sm py-1 px-3"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="input text-sm py-1 px-3"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
                <span>Clear filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="xl" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {posts.length} {posts.length === 1 ? "result" : "results"}{" "}
                  found
                </h2>
                {filters.query && (
                  <p className="text-gray-600 dark:text-gray-400">
                    for "{filters.query}"
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            </>
          ) : hasActiveFilters ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No results found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search terms or filters
              </p>
              <button onClick={clearFilters} className="btn-outline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Start searching
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter a search term to find posts, authors, or topics
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Search;
