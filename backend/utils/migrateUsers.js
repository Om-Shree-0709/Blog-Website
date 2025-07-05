import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const migrateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    let updatedCount = 0;

    for (const user of users) {
      const updates = {};

      // Set default values for new fields if they don't exist
      if (!user.displayName) {
        updates.displayName = "";
      }

      if (!user.location) {
        updates.location = "";
      }

      if (!user.interests) {
        updates.interests = [];
      }

      if (!user.profileTheme) {
        updates.profileTheme = "default";
      }

      if (!user.accentColor) {
        updates.accentColor = "#3B82F6";
      }

      if (!user.privacySettings) {
        updates.privacySettings = {
          profileVisibility: "public",
          showEmail: false,
          showLocation: true,
          showInterests: true,
          showSocialLinks: true,
        };
      }

      if (!user.notificationPreferences) {
        updates.notificationPreferences = {
          emailNotifications: true,
          commentNotifications: true,
          likeNotifications: true,
          followNotifications: true,
          newsletter: false,
        };
      }

      if (!user.socialLinks) {
        updates.socialLinks = {
          website: "",
          twitter: "",
          github: "",
          linkedin: "",
          instagram: "",
          youtube: "",
        };
      }

      // Update user if there are changes
      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(user._id, updates);
        updatedCount++;
        console.log(`Updated user: ${user.username}`);
      }
    }

    console.log(`Migration completed! Updated ${updatedCount} users`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsers();
}

export default migrateUsers;
