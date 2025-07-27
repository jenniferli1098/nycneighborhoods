// Initialize the profanity filter using dynamic import
let filter;
let filterPromise;

// Async function to initialize the filter
const initializeFilter = async () => {
  if (!filterPromise) {
    filterPromise = (async () => {
      try {
        const { Filter } = await import('bad-words');
        filter = new Filter();
        console.log('✅ Content moderation filter initialized');
        return filter;
      } catch (error) {
        console.error('❌ Failed to initialize content moderation filter:', error);
        throw error;
      }
    })();
  }
  return filterPromise;
};

// Add any custom words to the filter if needed
// filter.addWords('customword1', 'customword2');

// Remove false positives if needed
// filter.removeWords('word1', 'word2');

/**
 * Recursively sanitize an object by checking all string values for profanity
 * @param {*} obj - The object to sanitize
 * @param {string} path - Current path in the object (for error reporting)
 * @param {Object} filterInstance - The initialized filter instance
 * @returns {Array} - Array of paths that contained profanity
 */
async function sanitizeObject(obj, path = '', filterInstance = null) {
  if (!filterInstance) {
    filterInstance = await initializeFilter();
  }
  
  let violations = [];

  if (typeof obj === 'string') {
    if (filterInstance.isProfane(obj)) {
      violations.push({
        path: path || 'root',
        originalValue: obj,
        cleanedValue: filterInstance.clean(obj)
      });
    }
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const currentPath = path ? `${path}[${i}]` : `[${i}]`;
      const itemViolations = await sanitizeObject(obj[i], currentPath, filterInstance);
      violations = violations.concat(itemViolations);
    }
  } else if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      const keyViolations = await sanitizeObject(obj[key], currentPath, filterInstance);
      violations = violations.concat(keyViolations);
    }
  }

  return violations;
}

/**
 * Clean an object by replacing profane words with censored versions
 * @param {*} obj - The object to clean
 * @param {Object} filterInstance - The initialized filter instance
 * @returns {*} - The cleaned object
 */
async function cleanObject(obj, filterInstance = null) {
  if (!filterInstance) {
    filterInstance = await initializeFilter();
  }
  
  if (typeof obj === 'string') {
    return filterInstance.clean(obj);
  } else if (Array.isArray(obj)) {
    const cleanedArray = [];
    for (const item of obj) {
      cleanedArray.push(await cleanObject(item, filterInstance));
    }
    return cleanedArray;
  } else if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = await cleanObject(obj[key], filterInstance);
    }
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

  return async (req, res, next) => {
    try {
      // Only process POST, PUT, and PATCH requests
      if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
        return next();
      }

      // Skip if no body
      if (!req.body || typeof req.body !== 'object') {
        return next();
      }

      // Initialize the filter
      const filterInstance = await initializeFilter();

      // Determine what to check
      const dataToCheck = fields.length > 0 
        ? Object.fromEntries(
            Object.entries(req.body).filter(([key]) => fields.includes(key))
          )
        : req.body;

      // Check for profanity
      const violations = await sanitizeObject(dataToCheck, '', filterInstance);

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
          req.body = await cleanObject(req.body, filterInstance);
          
          // Add a flag to indicate content was moderated
          req.contentModerated = true;
          req.moderationViolations = violations;
        }
      }

      next();
    } catch (error) {
      console.error('Content moderation middleware error:', error);
      // Continue without moderation if there's an error
      next();
    }
  };
}

// Pre-initialize the filter for better performance
const preInitializeFilter = async () => {
  try {
    await initializeFilter();
  } catch (error) {
    console.warn('⚠️ Content moderation pre-initialization failed, will retry on first use');
  }
};

module.exports = {
  contentModerationMiddleware,
  sanitizeObject,
  cleanObject,
  initializeFilter,
  preInitializeFilter
};