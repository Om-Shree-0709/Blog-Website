import axios from "axios";
import toast from "react-hot-toast";

// Create a map to store abort controllers
const abortControllers = new Map();

// ✅ Use .env value with fallback for production
const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "/api"
      : "http://localhost:7777/api"),
  timeout: 60000,
  withCredentials: false,
});

// Request interceptor to add auth token and abort controller
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Create abort controller for this request
    const controller = new AbortController();
    config.signal = controller.signal;

    // Store controller with request URL as key
    const requestKey = `${config.method}:${config.url}`;
    abortControllers.set(requestKey, controller);

    console.log("🔼 API Request:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error("❌ Request setup error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Remove abort controller after successful response
    const requestKey = `${response.config.method}:${response.config.url}`;
    abortControllers.delete(requestKey);

    console.log("✅ API Response:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("🔥 API Error:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    });

    // Handle aborted requests first - don't show any toasts
    if (
      error.code === "ECONNABORTED" ||
      error.code === "ERR_CANCELED" ||
      error.message === "Request aborted" ||
      error.message === "canceled" ||
      error.name === "AbortError"
    ) {
      // Remove abort controller for aborted requests
      const requestKey = `${error.config?.method}:${error.config?.url}`;
      abortControllers.delete(requestKey);

      console.log("🛑 Request was aborted:", error.config?.url);
      // Return a resolved promise with empty data to prevent error propagation
      return Promise.resolve({ data: null, aborted: true });
    }

    // Handle other errors (only for non-aborted requests)
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      toast.error("Session expired. Please log in again.");
      window.location.href = "/login";
    } else if (error.response?.status === 429) {
      toast.error("Too many requests. Please wait a moment and try again.");
    } else if (error.code === "ERR_NETWORK") {
      toast.error("Network error. Please check your connection and try again.");
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("An unexpected error occurred. Please try again.");
    }

    return Promise.reject(error);
  }
);

// Utility functions for request cancellation
export const cancelRequest = (method, url) => {
  const requestKey = `${method}:${url}`;
  const controller = abortControllers.get(requestKey);
  if (controller) {
    controller.abort();
    abortControllers.delete(requestKey);
    console.log("🛑 Cancelled request:", requestKey);
  }
};

export const cancelAllRequests = () => {
  abortControllers.forEach((controller, key) => {
    controller.abort();
    console.log("🛑 Cancelled request:", key);
  });
  abortControllers.clear();
};

export const cancelRequestsByPattern = (pattern) => {
  abortControllers.forEach((controller, key) => {
    if (key.includes(pattern)) {
      controller.abort();
      console.log("🛑 Cancelled request:", key);
    }
  });
  // Clean up cancelled requests
  for (const [key] of abortControllers) {
    if (key.includes(pattern)) {
      abortControllers.delete(key);
    }
  }
};

export default api;
