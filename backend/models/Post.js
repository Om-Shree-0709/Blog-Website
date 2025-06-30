import mongoose from "mongoose";
import slugify from "slugify";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      minlength: [10, "Content must be at least 10 characters long"],
    },
    excerpt: {
      type: String,
      maxlength: [300, "Excerpt cannot exceed 300 characters"],
    },
    featuredImage: {
      type: String,
      default: "",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Technology",
        "Design",
        "Business",
        "Lifestyle",
        "Travel",
        "Food",
        "Health",
        "Education",
        "Entertainment",
        "Other",
      ],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    readTime: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    seoTitle: {
      type: String,
      maxlength: [60, "SEO title cannot exceed 60 characters"],
    },
    seoDescription: {
      type: String,
      maxlength: [160, "SEO description cannot exceed 160 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for like count
postSchema.virtual("likeCount").get(function () {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
postSchema.virtual("commentCount").get(function () {
  return this.comments ? this.comments.length : 0;
});

// Virtual for reading time calculation
postSchema.virtual("readingTime").get(function () {
  if (!this.content) return 0;
  const wordsPerMinute = 200;
  const wordCount = this.content.split(" ").length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Add indexes for better performance
postSchema.index({ slug: 1 }, { unique: true });
postSchema.index({ author: 1, isPublished: 1 });
postSchema.index({ isPublished: 1, createdAt: -1 });
postSchema.index({ isPublished: 1, viewCount: -1 });
postSchema.index({ category: 1, isPublished: 1 });
postSchema.index({ tags: 1, isPublished: 1 });
postSchema.index({ title: "text", content: "text" });

// Pre-save middleware to generate slug and reading time
postSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return next();

  try {
    // Generate base slug from title
    let baseSlug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    // Check for existing posts with the same slug
    let slug = baseSlug;
    let counter = 1;

    // Limit the number of attempts to prevent infinite loops
    const maxAttempts = 5;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const existingPost = await this.constructor
        .findOne({
          slug,
          _id: { $ne: this._id },
        })
        .select("_id")
        .lean();

      if (!existingPost) break;

      if (attempts === maxAttempts - 1) {
        // If we've tried too many times, add a timestamp to ensure uniqueness
        const timestamp = Date.now().toString().slice(-6);
        slug = `${baseSlug}-${timestamp}`;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      attempts++;
    }

    this.slug = slug;

    // Generate excerpt if not provided and not explicitly set to empty
    if (!this.excerpt && this.excerpt !== "") {
      this.excerpt =
        this.content.substring(0, 150).replace(/<[^>]*>/g, "") + "...";
    }

    // Calculate reading time
    this.readTime = this.readingTime;

    // Generate SEO fields if not provided
    if (!this.seoTitle) {
      // Truncate title to 60 characters for SEO title
      this.seoTitle =
        this.title.length > 60
          ? this.title.substring(0, 57) + "..."
          : this.title;
    }

    if (!this.seoDescription) {
      this.seoDescription = this.excerpt;
    }

    next();
  } catch (error) {
    console.error("Error in pre-save middleware:", error);
    next(error);
  }
});

// Method to increment view count
postSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

// Method to toggle like
postSchema.methods.toggleLike = function (userId) {
  const likeIndex = this.likes.indexOf(userId);

  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
  } else {
    this.likes.push(userId);
  }

  return this.save();
};

// Static method to get published posts
postSchema.statics.getPublishedPosts = function () {
  return this.find({ isPublished: true })
    .populate("author", "username avatar")
    .sort({ createdAt: -1 });
};

// Static method to get posts by category
postSchema.statics.getPostsByCategory = function (category) {
  return this.find({
    category,
    isPublished: true,
  })
    .populate("author", "username avatar")
    .sort({ createdAt: -1 });
};

// Static method to search posts
postSchema.statics.searchPosts = function (query) {
  return this.find({
    $text: { $search: query },
    isPublished: true,
  })
    .populate("author", "username avatar")
    .sort({ score: { $meta: "textScore" } });
};

export default mongoose.model("Post", postSchema);
