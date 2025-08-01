const mongoose = require('mongoose');
const Visit = require('../../models/Visit');
const User = require('../../models/User');
const Neighborhood = require('../../models/Neighborhood');
const Country = require('../../models/Country');

describe('Visit Model', () => {
  let user, neighborhood, country;

  beforeEach(async () => {
    // Create test user
    user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      googleId: 'test123',
      firstName: 'Test',
      lastName: 'User'
    });

    // Create test neighborhood
    neighborhood = await Neighborhood.create({
      name: 'Test Neighborhood',
      district: new mongoose.Types.ObjectId()
    });

    // Create test country
    country = await Country.create({
      name: 'Test Country',
      code: 'TC',
      continent: 'Test Continent'
    });
  });

  describe('Schema Validation', () => {
    test('should create a valid neighborhood visit', async () => {
      const visitData = {
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true,
        notes: 'Great place!',
        rating: 8,
        category: 'Good'
      };

      const visit = await Visit.create(visitData);
      expect(visit.user.toString()).toBe(user._id.toString());
      expect(visit.neighborhood.toString()).toBe(neighborhood._id.toString());
      expect(visit.visitType).toBe('neighborhood');
      expect(visit.visited).toBe(true);
      expect(visit.notes).toBe('Great place!');
      expect(visit.rating).toBe(8);
      expect(visit.category).toBe('Good');
    });

    test('should create a valid country visit', async () => {
      const visitData = {
        user: user._id,
        country: country._id,
        visitType: 'country',
        visited: true,
        notes: 'Amazing country!',
        rating: 9,
        category: 'Good'
      };

      const visit = await Visit.create(visitData);
      expect(visit.user.toString()).toBe(user._id.toString());
      expect(visit.country.toString()).toBe(country._id.toString());
      expect(visit.visitType).toBe('country');
      expect(visit.visited).toBe(true);
      expect(visit.notes).toBe('Amazing country!');
      expect(visit.rating).toBe(9);
      expect(visit.category).toBe('Good');
    });

    test('should require user field', async () => {
      const visitData = {
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true
      };

      await expect(Visit.create(visitData)).rejects.toThrow(/Path `user` is required/);
    });

    test('should require visitType field', async () => {
      const visitData = {
        user: user._id,
        neighborhood: neighborhood._id,
        visited: true
      };

      await expect(Visit.create(visitData)).rejects.toThrow(/Path `visitType` is required/);
    });

    test('should only allow valid visitType values', async () => {
      const visitData = {
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'invalid',
        visited: true
      };

      await expect(Visit.create(visitData)).rejects.toThrow(/`invalid` is not a valid enum value/);
    });

    test('should only allow valid category values', async () => {
      const visitData = {
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true,
        category: 'Invalid'
      };

      await expect(Visit.create(visitData)).rejects.toThrow(/`Invalid` is not a valid enum value/);
    });

    test('should validate rating range', async () => {
      const visitData = {
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true,
        rating: 11 // Invalid: should be 1-10
      };

      await expect(Visit.create(visitData)).rejects.toThrow(/Path `rating` \(11\) is more than maximum allowed value \(10\)/);
    });

    test('should validate rating minimum', async () => {
      const visitData = {
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true,
        rating: -1 // Invalid: should be 0-10
      };

      await expect(Visit.create(visitData)).rejects.toThrow(/Path `rating` \(-1\) is less than minimum allowed value \(0\)/);
    });

    test('should trim notes field', async () => {
      const visitData = {
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true,
        notes: '  Trimmed notes  '
      };

      const visit = await Visit.create(visitData);
      expect(visit.notes).toBe('Trimmed notes');
    });

    test('should set default values', async () => {
      const visitData = {
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood'
      };

      const visit = await Visit.create(visitData);
      expect(visit.visited).toBe(false);
      expect(visit.notes).toBeUndefined();
      expect(visit.rating).toBeUndefined();
      expect(visit.category).toBeUndefined();
    });
  });

  describe('Validation Logic', () => {
    test('should validate that neighborhood visits have valid type match', async () => {
      const visitData = {
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true
      };

      const visit = await Visit.create(visitData);
      expect(visit.visitType).toBe('neighborhood');
      expect(visit.neighborhood).toBeDefined();
      expect(visit.country).toBeUndefined();
    });

    test('should validate that country visits have valid type match', async () => {
      const visitData = {
        user: user._id,
        country: country._id,
        visitType: 'country',
        visited: true
      };

      const visit = await Visit.create(visitData);
      expect(visit.visitType).toBe('country');
      expect(visit.country).toBeDefined();
      expect(visit.neighborhood).toBeUndefined();
    });
  });

  describe('Timestamps', () => {
    test('should have createdAt and updatedAt timestamps', async () => {
      const visitData = {
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true
      };

      const visit = await Visit.create(visitData);
      expect(visit.createdAt).toBeDefined();
      expect(visit.updatedAt).toBeDefined();
      expect(visit.createdAt).toEqual(visit.updatedAt);
    });

    test('should update updatedAt on modification', async () => {
      const visitData = {
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true
      };

      const visit = await Visit.create(visitData);
      const originalUpdatedAt = visit.updatedAt;

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      visit.rating = 5;
      await visit.save();

      expect(visit.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});