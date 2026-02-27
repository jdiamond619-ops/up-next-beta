const bucket = new Map();

function keyFor(req) {
  return `${req.ip}:${req.user ? req.user.id : "anon"}:${req.path}`;
}

function createRateLimiter({ windowMs, max }) {
  return function rateLimit(req, res, next) {
    const key = keyFor(req);
    const now = Date.now();
    const current = bucket.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > current.resetAt) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    bucket.set(key, current);

    if (current.count > max) {
      return res.status(429).json({ error: "Too many requests" });
    }

    return next();
  };
}

module.exports = { createRateLimiter };
