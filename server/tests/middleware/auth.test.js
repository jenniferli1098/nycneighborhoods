const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');
const User = require('../../models/User');

describe('Auth Middleware', () => {
  let req, res, next, user;

  beforeEach(async () => {
    // Create test user
    user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      googleId: 'test123',
      firstName: 'Test',
      lastName: 'User'
    });

    req = {
      header: jest.fn()
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid Authentication', () => {
    test('should authenticate user with valid Bearer token', async () => {
      const token = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      req.header.mockReturnValue(`Bearer ${token}`);

      await auth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
      expect(req.user.username).toBe('testuser');
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Authentication', () => {
    test('should return 401 when no authorization header', async () => {
      req.header.mockReturnValue(undefined);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'No token provided' 
      });
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    test('should return 401 when token is malformed', async () => {
      req.header.mockReturnValue('Bearer invalid-token');

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when token is expired', async () => {
      const expiredToken = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      req.header.mockReturnValue(`Bearer ${expiredToken}`);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when user does not exist', async () => {
      const nonexistentUserId = '507f1f77bcf86cd799439011';
      const token = jwt.sign(
        { id: nonexistentUserId },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      req.header.mockReturnValue(`Bearer ${token}`);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'User not found'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});