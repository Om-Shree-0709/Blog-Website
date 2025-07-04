import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

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
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  retryWrites: true,
  w: "majority",
};

// Connect to MongoDB and start server
mongoose
  .connect(mongoUri, mongoOptions)
  .then(() => {
    console.log("✅ Connected to MongoDB");
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
