import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import app from "./app.js";

// ES6 module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = process.env.PORT || 5000;

// Check MONGODB_URI
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in your environment!");
  console.error("Current working directory:", process.cwd());
  console.error("Looking for .env file at:", path.join(__dirname, ".env"));
  process.exit(1);
}

console.log("✅ MONGODB_URI from env:", process.env.MONGODB_URI);

// Ensure the connection string includes a database name
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri.includes("/inkwell")) {
  mongoUri = mongoUri.endsWith("/")
    ? mongoUri + "inkwell"
    : mongoUri + "/inkwell";
}

// MongoDB connection options for production
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false,
  ...(process.env.NODE_ENV === "production" && {
    ssl: true,
    sslValidate: true,
    retryWrites: true,
    w: "majority",
  }),
};

mongoose
  .connect(mongoUri, mongoOptions)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(
        `📊 Health check available at: http://localhost:${PORT}/api/health`
      );
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});
