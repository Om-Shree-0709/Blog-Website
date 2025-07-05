import { useEffect } from "react";
import { cancelRequestsByPattern, cancelAllRequests } from "../utils/api";

/**
 * Custom hook for request cancellation
 * @param {string} pattern - URL pattern to match for cancellation
 * @param {boolean} cancelAll - Whether to cancel all requests on unmount
 */
export const useRequestCancellation = (pattern = null, cancelAll = false) => {
  useEffect(() => {
    return () => {
      if (cancelAll) {
        console.log("🧹 Cancelling all requests");
        cancelAllRequests();
      } else if (pattern) {
        console.log(`🧹 Cancelling requests matching: ${pattern}`);
        cancelRequestsByPattern(pattern);
      }
    };
  }, [pattern, cancelAll]);
};

/**
 * Hook to cancel requests when navigating away
 * @param {string} pattern - URL pattern to match for cancellation
 */
export const useNavigationCancellation = (pattern) => {
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pattern) {
        cancelRequestsByPattern(pattern);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (pattern) {
        cancelRequestsByPattern(pattern);
      }
    };
  }, [pattern]);
};
