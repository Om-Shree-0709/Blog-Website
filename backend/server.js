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

// Ensure NODE_ENV is set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

// Check MONGODB_URI
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in your environment!");
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

const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  retryWrites: true,
  w: "majority",
};

mongoose
  .connect(mongoUri, mongoOptions)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Export app for Vercel
export default app;
