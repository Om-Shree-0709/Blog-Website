import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | BlogHub</title>
        <meta
          name="description"
          content="The page you're looking for doesn't exist."
        />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">
              404
            </h1>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 btn-primary"
            >
              <Home className="h-5 w-5" />
              <span>Go Home</span>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center space-x-2 btn-outline"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Go Back</span>
            </button>
          </div>

          <div className="mt-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need help?{" "}
              <Link
                to="/search"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Search for content
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
