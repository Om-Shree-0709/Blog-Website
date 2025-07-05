import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    // Enhanced profile fields
    displayName: {
      type: String,
      maxlength: [50, "Display name cannot exceed 50 characters"],
      default: "",
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      maxlength: [100, "Location cannot exceed 100 characters"],
      default: "",
    },
    interests: [
      {
        type: String,
        maxlength: [30, "Interest cannot exceed 30 characters"],
      },
    ],
    // Profile customization
    profileTheme: {
      type: String,
      enum: ["default", "minimal", "creative", "professional"],
      default: "default",
    },
    accentColor: {
      type: String,
      default: "#3B82F6", // Default blue
    },
    // Privacy settings
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ["public", "followers", "private"],
        default: "public",
      },
      showEmail: {
        type: Boolean,
        default: false,
      },
      showLocation: {
        type: Boolean,
        default: true,
      },
      showInterests: {
        type: Boolean,
        default: true,
      },
      showSocialLinks: {
        type: Boolean,
        default: true,
      },
    },
    // Notification preferences
    notificationPreferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      commentNotifications: {
        type: Boolean,
        default: true,
      },
      likeNotifications: {
        type: Boolean,
        default: true,
      },
      followNotifications: {
        type: Boolean,
        default: true,
      },
      newsletter: {
        type: Boolean,
        default: false,
      },
    },
    role: {
      type: String,
      enum: ["admin", "author", "reader"],
      default: "reader",
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    socialLinks: {
      website: String,
      twitter: String,
      github: String,
      linkedin: String,
      instagram: String,
      youtube: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for post count
userSchema.virtual("postCount", {
  ref: "Post",
  localField: "_id",
  foreignField: "author",
  count: true,
});

// Virtual for follower count
userSchema.virtual("followerCount", {
  ref: "User",
  localField: "_id",
  foreignField: "following",
  count: true,
});

// Virtual for following count
userSchema.virtual("followingCount", {
  ref: "User",
  localField: "following",
  foreignField: "_id",
  count: true,
});

// Virtual for profile completion percentage
userSchema.virtual("profileCompletion", {
  get: function () {
    const fields = [
      this.displayName,
      this.bio,
      this.avatar,
      this.location,
      this.interests?.length > 0,
      this.socialLinks?.website,
      this.socialLinks?.twitter,
      this.socialLinks?.github,
      this.socialLinks?.linkedin,
    ];

    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  },
});

// Virtual for default avatar
userSchema.virtual("defaultAvatar", {
  get: function () {
    if (this.avatar) return this.avatar;

    // Generate a colorful default avatar based on username
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
      "#F8C471",
      "#82E0AA",
    ];

    const colorIndex = this.username.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];
    const initials = this.displayName
      ? this.displayName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : this.username.substring(0, 2).toUpperCase();

    return `data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${backgroundColor}"/>
        <text x="50" y="50" font-family="Arial, sans-serif" font-size="40" 
              font-weight="bold" fill="white" text-anchor="middle" dy=".3em">
          ${initials}
        </text>
      </svg>
    `)}`;
  },
});

// Add indexes for better performance
userSchema.index({ role: 1 });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ "privacySettings.profileVisibility": 1 });

// Text search index
userSchema.index({
  username: "text",
  displayName: "text",
  bio: "text",
  location: "text",
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.email;

  // Apply privacy settings
  if (!this.privacySettings?.showEmail) {
    delete userObject.email;
  }
  if (!this.privacySettings?.showLocation) {
    delete userObject.location;
  }
  if (!this.privacySettings?.showInterests) {
    delete userObject.interests;
  }
  if (!this.privacySettings?.showSocialLinks) {
    delete userObject.socialLinks;
  }

  return userObject;
};

export default mongoose.model("User", userSchema);
