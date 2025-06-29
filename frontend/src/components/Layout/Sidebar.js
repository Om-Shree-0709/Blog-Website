import React from "react";
import { Link } from "react-router-dom";
import {
  X,
  Home,
  BookOpen,
  User,
  Settings,
  Bookmark,
  Plus,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, logout } = useAuth();

  const categories = [
    { name: "Technology", slug: "technology" },
    { name: "Design", slug: "design" },
    { name: "Business", slug: "business" },
    { name: "Lifestyle", slug: "lifestyle" },
    { name: "Travel", slug: "travel" },
    { name: "Food", slug: "food" },
    { name: "Health", slug: "health" },
    { name: "Education", slug: "education" },
    { name: "Entertainment", slug: "entertainment" },
    { name: "Other", slug: "other" },
  ];

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <Link
              to="/"
              className="flex items-center space-x-2"
              onClick={onClose}
            >
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                BlogHub
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link
              to="/"
              className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              onClick={onClose}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/create-post"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={onClose}
                >
                  <Plus className="h-5 w-5" />
                  <span>Write Post</span>
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={onClose}
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to={`/profile/${user?.username}`}
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={onClose}
                >
                  <User className="h-5 w-5" />
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/dashboard?tab=bookmarks"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={onClose}
                >
                  <Bookmark className="h-5 w-5" />
                  <span>Bookmarks</span>
                </Link>
                <Link
                  to="/dashboard?tab=settings"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={onClose}
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
              </>
            )}
          </nav>

          {/* Categories */}
          <div className="px-4 py-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/search?category=${category.name}`}
                  className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={onClose}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          {isAuthenticated && (
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
