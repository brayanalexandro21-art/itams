const db = require('../database');

// Simple in-memory rate limiter
const rateLimits = new Map();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimits.entries()) {
    if (now - data.resetTime > 60000) {
      rateLimits.delete(key);
    }
  }
}, 60000);

function rateLimit(options = {}) {
  const {
    windowMs = 60000, // 1 minute
    max = 100, // requests per window
    message = 'Too many requests',
    skipSuccessfulRequests = false,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress,
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let limitData = rateLimits.get(key);

    if (!limitData || now - limitData.resetTime > windowMs) {
      limitData = {
        count: 0,
        resetTime: now,
      };
      rateLimits.set(key, limitData);
    }

    limitData.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - limitData.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((limitData.resetTime + windowMs) / 1000));

    if (limitData.count > max) {
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((limitData.resetTime + windowMs - now) / 1000),
      });
    }

    next();
  };
}

// Pre-configured rate limiters
// Varias páginas (dashboards) hacen muchas peticiones al cargar: 100/min se agotaba rápido
const apiLimiter = rateLimit({
  windowMs: 60000,
  max: 300,
  message: 'API rate limit exceeded',
});

const strictLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  message: 'Too many requests, please try again later',
});

const authLimiter = rateLimit({
  windowMs: 900000, // 15 minutes
  max: 5,
  message: 'Too many login attempts',
});

module.exports = {
  rateLimit,
  apiLimiter,
  strictLimiter,
  authLimiter,
};
