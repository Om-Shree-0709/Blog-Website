import axios from "axios";
import toast from "react-hot-toast";

// ✅ Use .env value
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 60000,
  withCredentials: false,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      toast.error("Session expired. Please log in again.");
      window.location.href = "/login";
    } else if (error.response?.status === 429) {
      toast.error("Too many requests. Please wait a moment and try again.");
    } else if (error.code === "ERR_NETWORK") {
      toast.error("Network error. Please check your connection and try again.");
    } else if (
      error.code === "ECONNABORTED" ||
      error.message === "Request aborted"
    ) {
      // Optionally: console.log('Request was aborted, ignoring.');
      return;
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("An unexpected error occurred. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default api;
