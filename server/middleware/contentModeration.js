const Filter = require('bad-words');

// Initialize the profanity filter
const filter = new Filter();

// Add any custom words to the filter if needed
// filter.addWords('customword1', 'customword2');

// Remove false positives if needed
// filter.removeWords('word1', 'word2');

/**
 * Recursively sanitize an object by checking all string values for profanity
 * @param {*} obj - The object to sanitize
 * @param {string} path - Current path in the object (for error reporting)
 * @returns {Array} - Array of paths that contained profanity
 */
function sanitizeObject(obj, path = '') {
  let violations = [];

  if (typeof obj === 'string') {
    if (filter.isProfane(obj)) {
      violations.push({
        path: path || 'root',
        originalValue: obj,
        cleanedValue: filter.clean(obj)
      });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const currentPath = path ? `${path}[${index}]` : `[${index}]`;
      const itemViolations = sanitizeObject(item, currentPath);
      violations = violations.concat(itemViolations);
    });
  } else if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const keyViolations = sanitizeObject(obj[key], currentPath);
      violations = violations.concat(keyViolations);
    });
  }

  return violations;
}

/**
 * Clean an object by replacing profane words with censored versions
 * @param {*} obj - The object to clean
 * @returns {*} - The cleaned object
 */
function cleanObject(obj) {
  if (typeof obj === 'string') {
    return filter.clean(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item));
  } else if (obj && typeof obj === 'object') {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      cleaned[key] = cleanObject(obj[key]);
    });
    return cleaned;
  }
  return obj;
}

/**
 * Express middleware for content moderation
 * @param {Object} options - Configuration options
 * @param {boolean} options.strict - If true, reject requests with profanity. If false, clean the content.
 * @param {Array} options.fields - Specific fields to check. If empty, checks all fields.
 * @param {boolean} options.logViolations - Whether to log profanity violations
 */
function contentModerationMiddleware(options = {}) {
  const {
    strict = false,
    fields = [],
    logViolations = true
  } = options;

  return (req, res, next) => {
    // Only process POST, PUT, and PATCH requests
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    // Skip if no body
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    // Determine what to check
    const dataToCheck = fields.length > 0 
      ? Object.fromEntries(
          Object.entries(req.body).filter(([key]) => fields.includes(key))
        )
      : req.body;

    // Check for profanity
    const violations = sanitizeObject(dataToCheck);

    if (violations.length > 0) {
      if (logViolations) {
        console.warn('🚨 Content moderation violation detected:', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          route: req.path,
          method: req.method,
          violations: violations.map(v => ({
            field: v.path,
            violation: v.originalValue
          }))
        });
      }

      if (strict) {
        // Reject the request
        return res.status(400).json({
          error: 'Content contains inappropriate language',
          message: 'Please review your input and use appropriate language',
          fields: violations.map(v => v.path)
        });
      } else {
        // Clean the content and continue
        req.body = cleanObject(req.body);
        
        // Add a flag to indicate content was moderated
        req.contentModerated = true;
        req.moderationViolations = violations;
      }
    }

    next();
  };
}

module.exports = {
  contentModerationMiddleware,
  sanitizeObject,
  cleanObject,
  filter
};