import React from "react";
import { Link } from "react-router-dom";
import { User, CheckCircle, AlertCircle } from "lucide-react";

const ProfileCompletion = ({ user, completionPercentage }) => {
  if (completionPercentage >= 100) {
    return null; // Don't show if profile is complete
  }

  const getMissingFields = () => {
    const missing = [];
    if (!user.displayName) missing.push("Display Name");
    if (!user.bio) missing.push("Bio");
    if (!user.avatar) missing.push("Profile Picture");
    if (!user.location) missing.push("Location");
    if (!user.interests || user.interests.length === 0)
      missing.push("Interests");
    if (
      !user.socialLinks?.website &&
      !user.socialLinks?.twitter &&
      !user.socialLinks?.github &&
      !user.socialLinks?.linkedin
    ) {
      missing.push("Social Links");
    }
    return missing;
  };

  const missingFields = getMissingFields();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Complete Your Profile
            </h3>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {completionPercentage}% Complete
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-3">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                Add these to complete your profile:
              </p>
              <div className="flex flex-wrap gap-1">
                {missingFields.slice(0, 3).map((field, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {field}
                  </span>
                ))}
                {missingFields.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                    +{missingFields.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="mb-3">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              Benefits of a complete profile:
            </p>
            <div className="space-y-1">
              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Build trust with readers
              </div>
              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Increase engagement on your posts
              </div>
              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connect with like-minded writers
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Link
            to="/dashboard?tab=settings"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 transition-colors"
          >
            Complete Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
