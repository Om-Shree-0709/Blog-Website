import serverless from "serverless-http";
import mongoose from "mongoose";
import app from "../app.js";

const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  retryWrites: true,
  w: "majority",
};

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  let mongoUri = process.env.MONGODB_URI;
  if (!mongoUri.includes("/inkwell")) {
    mongoUri = mongoUri.endsWith("/")
      ? mongoUri + "inkwell"
      : mongoUri + "/inkwell";
  }
  await mongoose.connect(mongoUri, mongoOptions);
  isConnected = true;
};

const handler = async (req, res) => {
  try {
    await connectDB();
    return serverless(app)(req, res);
  } catch (error) {
    console.error("❌ Connection error:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
};

export default handler;
