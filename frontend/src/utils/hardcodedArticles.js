// Hardcoded featured articles (replace with your real data)
const HARDCODED_ARTICLES = [
  {
    _id: "hardcoded1",
    title: "The Power of Modern JavaScript",
    slug: "the-power-of-modern-javascript",
    excerpt:
      "Modern JavaScript (ES6+) has revolutionized the way developers build applications. With features like arrow functions, async/await, modules, and destructuring, JavaScript has become more expressive and readable. These enhancements not only improve developer productivity but also make codebases easier to maintain and scale. As web applications grow more complex, mastering modern JavaScript is essential for creating high-performance, robust, and future-proof solutions.",
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
      "Accessibility is no longer optional — it is a core requirement for modern web design. Inclusive design ensures that digital products are usable by everyone, including people with disabilities. By following principles like sufficient color contrast, keyboard navigability, and proper semantic HTML, designers can create interfaces that are both elegant and empowering. Prioritizing accessibility reflects empathy and broadens your audience, making the web a better place for all.",
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
      "Artificial Intelligence is dramatically changing creative industries, from design and music to writing and film. Tools powered by AI help automate repetitive tasks, spark new ideas, and enhance productivity. However, they also raise important questions about authorship and originality. The future belongs to those who can collaborate with AI rather than fear it, combining human intuition with machine intelligence to push creative boundaries further than ever before.",
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
  {
    _id: "hardcoded4",
    title: "Building Scalable Front-End Architectures",
    slug: "building-scalable-front-end-architectures",
    excerpt:
      "Creating scalable front-end applications is a vital challenge for modern developers. As applications grow, a solid architecture helps maintain code quality and ensures smooth collaboration across teams. Techniques like component-driven development, modular design, and effective state management (with tools like Redux or Zustand) are key. By investing in scalable architectures early, developers can build robust, maintainable systems that adapt easily to new features and evolving business needs.",
    category: "Development",
    author: {
      username: "michael",
      avatar: "https://your-cdn.com/avatars/michael.jpg",
    },
    createdAt: "2024-06-22T11:10:00Z",
    readTime: 8,
    tags: ["frontend", "architecture", "scalability"],
    likeCount: 63,
    commentCount: 15,
    viewCount: 1750,
  },
];

export default HARDCODED_ARTICLES;
