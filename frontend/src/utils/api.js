import axios from "axios";
import toast from "react-hot-toast";

// Create axios instance with base URL
const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "/api"
      : "http://localhost:5000/api",
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging
    console.error("API Error:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      toast.error("Session expired. Please log in again.");
      window.location.href = "/login";
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      toast.error("Too many requests. Please wait a moment and try again.");
    }

    // Handle network errors
    if (error.code === "ERR_NETWORK") {
      toast.error("Network error. Please check your connection and try again.");
    }

    // Handle timeout errors
    if (error.code === "ECONNABORTED") {
      toast.error("Request timed out. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default api;
