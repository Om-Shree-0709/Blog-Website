import React from "react";
import { Link } from "react-router-dom";

const CategoryCard = ({ category, count = 0 }) => {
  // Validate props
  if (!category || typeof category !== "string") {
    console.warn("CategoryCard: Invalid category prop", category);
    return null;
  }

  const getCategoryColor = (category) => {
    const colors = {
      Technology:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      Design:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      Business:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      Lifestyle:
        "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
      Travel:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      Food: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      Health:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      Education:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
      Entertainment:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      Other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return colors[category] || colors["Other"];
  };

  return (
    <Link
      to={`/search?category=${encodeURIComponent(category)}`}
      className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 hover:shadow-md group"
    >
      <div className="text-center">
        <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${getCategoryColor(
            category
          )}`}
        >
          <span className="text-lg font-bold">{category.charAt(0)}</span>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {category}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {count} {count === 1 ? "post" : "posts"}
        </p>
      </div>
    </Link>
  );
};

export default CategoryCard;
