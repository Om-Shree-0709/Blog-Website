import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import path from "path";
import { fileURLToPath } from "url";

// ES6 __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI not defined");
  process.exit(1);
}

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
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

export default app;
