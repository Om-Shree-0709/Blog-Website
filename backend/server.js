import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import { createIndexes } from "./utils/createIndexes.js";

dotenv.config();

// Port from environment or default to 5000
const PORT = process.env.PORT || 7777;

// Check MONGODB_URI
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in your environment!");
  process.exit(1);
}

console.log("✅ MONGODB_URI from env:", process.env.MONGODB_URI);

// Append database name if missing
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri.includes("/inkwell")) {
  mongoUri = mongoUri.endsWith("/")
    ? mongoUri + "inkwell"
    : mongoUri + "/inkwell";
}

const mongoOptions = {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: true,
  retryWrites: true,
  w: "majority",
  maxIdleTimeMS: 60000,
  connectTimeoutMS: 15000,
  heartbeatFrequencyMS: 10000,
  // Performance optimizations
  readPreference: "secondaryPreferred",
  readConcern: { level: "local" },
  writeConcern: { w: "majority", j: false },
};

// Connect to MongoDB and start server
mongoose
  .connect(mongoUri, mongoOptions)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    // Create indexes for optimal performance
    await createIndexes();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(
        `🌟 Visit http://localhost:${PORT}/ to confirm backend is running`
      );
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
