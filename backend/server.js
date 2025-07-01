import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import app from "./app.js";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = process.env.PORT || 5000;

// MongoDB connect (local run)
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  retryWrites: true,
  w: "majority",
};

const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;
  if (!mongoUri.includes("/inkwell")) {
    mongoUri = mongoUri.endsWith("/")
      ? mongoUri + "inkwell"
      : mongoUri + "/inkwell";
  }
  await mongoose.connect(mongoUri, mongoOptions);
  console.log("✅ Connected to MongoDB");
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
