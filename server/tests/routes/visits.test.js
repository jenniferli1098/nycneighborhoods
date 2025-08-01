const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Visit = require('../../models/Visit');
const User = require('../../models/User');
const Neighborhood = require('../../models/Neighborhood');
const District = require('../../models/District');
const Country = require('../../models/Country');
const visitsRouter = require('../../routes/visits');

const app = express();
app.use(express.json());
app.use('/visits', visitsRouter);

describe('Visits Routes', () => {
  let user, token, neighborhood, district, country;

  beforeEach(async () => {
    // Create test user
    user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      googleId: 'test123',
      firstName: 'Test',
      lastName: 'User'
    });

    // Create JWT token for authentication
    token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Create test district
    district = await District.create({
      name: 'Test District',
      map: new mongoose.Types.ObjectId()
    });

    // Create test neighborhood
    neighborhood = await Neighborhood.create({
      name: 'Test Neighborhood',
      district: district._id
    });

    // Create test country
    country = await Country.create({
      name: 'Test Country',
      code: 'TC',
      continent: 'Test Continent'
    });
  });

  describe('GET /visits', () => {
    test('should fetch all visits for authenticated user', async () => {
      // Create test visits
      await Visit.create([
        {
          user: user._id,
          neighborhood: neighborhood._id,
          visitType: 'neighborhood',
          visited: true,
          rating: 8
        },
        {
          user: user._id,
          country: country._id,
          visitType: 'country',
          visited: true,
          rating: 9
        }
      ]);

      const response = await request(app)
        .get('/visits')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('visitType');
      expect(response.body[0]).toHaveProperty('visited');
      expect(response.body[0]).toHaveProperty('rating');
    });

    test('should return empty array when user has no visits', async () => {
      const response = await request(app)
        .get('/visits')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get('/visits')
        .expect(401);
    });

    test('should populate neighborhood and country data', async () => {
      await Visit.create({
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true
      });

      const response = await request(app)
        .get('/visits')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body[0]).toHaveProperty('neighborhood');
      expect(response.body[0].neighborhood).toHaveProperty('name', 'Test Neighborhood');
    });
  });

  describe('GET /visits/type/:type', () => {
    beforeEach(async () => {
      await Visit.create([
        {
          user: user._id,
          neighborhood: neighborhood._id,
          visitType: 'neighborhood',
          visited: true
        },
        {
          user: user._id,
          country: country._id,
          visitType: 'country',
          visited: true
        }
      ]);
    });

    test('should fetch only neighborhood visits', async () => {
      const response = await request(app)
        .get('/visits/type/neighborhood')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].visitType).toBe('neighborhood');
    });

    test('should fetch only country visits', async () => {
      const response = await request(app)
        .get('/visits/type/country')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].visitType).toBe('country');
    });

    test('should return 400 for invalid visit type', async () => {
      await request(app)
        .get('/visits/type/invalid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('POST /visits', () => {
    test('should create a neighborhood visit', async () => {
      const visitData = {
        visitType: 'neighborhood',
        neighborhoodName: 'Test Neighborhood',
        districtName: 'Test District',
        visited: true,
        notes: 'Great place!',
        rating: 8,
        category: 'Good'
      };

      const response = await request(app)
        .post('/visits')
        .set('Authorization', `Bearer ${token}`)
        .send(visitData)
        .expect(201);

      expect(response.body).toHaveProperty('visitType', 'neighborhood');
      expect(response.body).toHaveProperty('visited', true);
      expect(response.body).toHaveProperty('notes', 'Great place!');
      expect(response.body).toHaveProperty('rating', 8);
      expect(response.body).toHaveProperty('category', 'Good');

      // Verify it was saved to database
      const savedVisit = await Visit.findById(response.body._id);
      expect(savedVisit).toBeTruthy();
      expect(savedVisit.user.toString()).toBe(user._id.toString());
    });

    test('should create a country visit', async () => {
      const visitData = {
        visitType: 'country',
        countryName: 'Test Country',
        visited: true,
        notes: 'Amazing country!',
        rating: 9,
        category: 'Good'
      };

      const response = await request(app)
        .post('/visits')
        .set('Authorization', `Bearer ${token}`)
        .send(visitData)
        .expect(201);

      expect(response.body).toHaveProperty('visitType', 'country');
      expect(response.body).toHaveProperty('visited', true);
      expect(response.body).toHaveProperty('notes', 'Amazing country!');
      expect(response.body).toHaveProperty('rating', 9);
    });

    test('should return 400 without visitType', async () => {
      const visitData = {
        neighborhoodName: 'Test Neighborhood',
        visited: true
      };

      const response = await request(app)
        .post('/visits')
        .set('Authorization', `Bearer ${token}`)
        .send(visitData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 with invalid visitType', async () => {
      const visitData = {
        visitType: 'invalid',
        neighborhoodName: 'Test Neighborhood',
        visited: true
      };

      const response = await request(app)
        .post('/visits')
        .set('Authorization', `Bearer ${token}`)
        .send(visitData)
        .expect(400);

      expect(response.body.error).toMatch(/visitType must be either/);
    });

    test('should return 404 when neighborhood not found', async () => {
      const visitData = {
        visitType: 'neighborhood',
        neighborhoodName: 'Nonexistent Neighborhood',
        districtName: 'Test District',
        visited: true
      };

      const response = await request(app)
        .post('/visits')
        .set('Authorization', `Bearer ${token}`)
        .send(visitData)
        .expect(404);

      expect(response.body.error).toMatch(/Neighborhood.*not found/);
    });

    test('should return 404 when district not found', async () => {
      const visitData = {
        visitType: 'neighborhood',
        neighborhoodName: 'Test Neighborhood',
        districtName: 'Nonexistent District',
        visited: true
      };

      const response = await request(app)
        .post('/visits')
        .set('Authorization', `Bearer ${token}`)
        .send(visitData)
        .expect(404);

      expect(response.body.error).toMatch(/District.*not found/);
    });

    test('should return 404 when country not found', async () => {
      const visitData = {
        visitType: 'country',
        countryName: 'Nonexistent Country',
        visited: true
      };

      const response = await request(app)
        .post('/visits')
        .set('Authorization', `Bearer ${token}`)
        .send(visitData)
        .expect(404);

      expect(response.body.error).toMatch(/Country.*not found/);
    });

    test('should update existing visit instead of creating duplicate', async () => {
      // Create initial visit
      const existingVisit = await Visit.create({
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true,
        rating: 5
      });

      const visitData = {
        visitType: 'neighborhood',
        neighborhoodName: 'Test Neighborhood',
        districtName: 'Test District',
        visited: true,
        rating: 8,
        category: 'Good'
      };

      const response = await request(app)
        .post('/visits')
        .set('Authorization', `Bearer ${token}`)
        .send(visitData)
        .expect(200); // Should be 200 for update, not 201 for create

      expect(response.body._id).toBe(existingVisit._id.toString());
      expect(response.body.rating).toBe(8);
      expect(response.body.category).toBe('Good');

      // Verify only one visit exists
      const visitCount = await Visit.countDocuments({ user: user._id });
      expect(visitCount).toBe(1);
    });
  });

  describe('PUT /visits/:id', () => {
    let visit;

    beforeEach(async () => {
      visit = await Visit.create({
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true,
        rating: 5
      });
    });

    test('should update an existing visit', async () => {
      const updateData = {
        rating: 8,
        category: 'Good',
        notes: 'Updated notes'
      };

      const response = await request(app)
        .put(`/visits/${visit._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.rating).toBe(8);
      expect(response.body.category).toBe('Good');
      expect(response.body.notes).toBe('Updated notes');
    });

    test('should return 404 for nonexistent visit', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .put(`/visits/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 8 })
        .expect(404);
    });

    test('should return 404 when trying to update another user\'s visit', async () => {
      // Create another user
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        googleId: 'other123',
        firstName: 'Other',
        lastName: 'User'
      });

      const otherVisit = await Visit.create({
        user: otherUser._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true
      });

      await request(app)
        .put(`/visits/${otherVisit._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 8 })
        .expect(404);
    });
  });

  describe('DELETE /visits/:id', () => {
    let visit;

    beforeEach(async () => {
      visit = await Visit.create({
        user: user._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true
      });
    });

    test('should delete an existing visit', async () => {
      await request(app)
        .delete(`/visits/${visit._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify it was deleted
      const deletedVisit = await Visit.findById(visit._id);
      expect(deletedVisit).toBeNull();
    });

    test('should return 404 for nonexistent visit', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .delete(`/visits/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    test('should return 404 when trying to delete another user\'s visit', async () => {
      // Create another user
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        googleId: 'other123',
        firstName: 'Other',
        lastName: 'User'
      });

      const otherVisit = await Visit.create({
        user: otherUser._id,
        neighborhood: neighborhood._id,
        visitType: 'neighborhood',
        visited: true
      });

      await request(app)
        .delete(`/visits/${otherVisit._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});