const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const app = require("./app");

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

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
