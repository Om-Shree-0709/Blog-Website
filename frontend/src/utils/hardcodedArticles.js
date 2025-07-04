// Hardcoded featured articles (replace with your real data)
const HARDCODED_ARTICLES = [
  {
    _id: "hardcoded1",
    title: "The Power of Modern JavaScript",
    slug: "the-power-of-modern-javascript",
    excerpt:
      "Discover how ES6+ features are transforming web development and making code more robust and readable.",
    featuredImage: "https://your-cdn.com/images/js-article.jpg",
    category: "Technology",
    author: {
      username: "alice",
      avatar: "https://your-cdn.com/avatars/alice.jpg",
    },
    createdAt: "2024-06-01T12:00:00Z",
    readTime: 5,
    tags: ["javascript", "webdev"],
    likeCount: 42,
    commentCount: 7,
    viewCount: 1200,
  },
  {
    _id: "hardcoded2",
    title: "Designing for Accessibility: A Modern Approach",
    slug: "designing-for-accessibility",
    excerpt:
      "Learn essential design principles that make your web applications inclusive and accessible to everyone.",
    featuredImage: "https://your-cdn.com/images/accessibility-article.jpg",
    category: "Design",
    author: {
      username: "emily",
      avatar: "https://your-cdn.com/avatars/emily.jpg",
    },
    createdAt: "2024-05-20T09:30:00Z",
    readTime: 6,
    tags: ["accessibility", "ux", "design"],
    likeCount: 58,
    commentCount: 12,
    viewCount: 980,
  },
  {
    _id: "hardcoded3",
    title: "AI and the Future of Creative Work",
    slug: "ai-and-future-of-creative-work",
    excerpt:
      "Explore how artificial intelligence is reshaping creative industries and what it means for artists and developers.",
    featuredImage: "https://your-cdn.com/images/ai-creative.jpg",
    category: "Innovation",
    author: {
      username: "jason",
      avatar: "https://your-cdn.com/avatars/jason.jpg",
    },
    createdAt: "2024-06-15T15:45:00Z",
    readTime: 7,
    tags: ["ai", "creativity", "future"],
    likeCount: 75,
    commentCount: 20,
    viewCount: 2100,
  },
];

export default HARDCODED_ARTICLES;
