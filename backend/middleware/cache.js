import NodeCache from "node-cache";

// Cache with 5 minutes TTL
const cache = new NodeCache({ stdTTL: 300 });

export const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Skip caching for authenticated requests (except admin routes)
    if (req.headers.authorization && !req.path.startsWith("/admin")) {
      return next();
    }

    const key = `__express__${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cachedResponse);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function (data) {
      cache.set(key, data, duration);
      res.setHeader("X-Cache", "MISS");
      return originalJson.call(this, data);
    };

    next();
  };
};

export const clearCache = (pattern) => {
  if (pattern) {
    const keys = cache.keys();
    const matchingKeys = keys.filter((key) => key.includes(pattern));
    cache.del(matchingKeys);
  } else {
    cache.flushAll();
  }
};

export default cache;
