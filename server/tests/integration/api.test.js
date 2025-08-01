const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Import models
const User = require('../../models/User');
const Visit = require('../../models/Visit');
const Neighborhood = require('../../models/Neighborhood');
const District = require('../../models/District');
const Map = require('../../models/Map');
const Country = require('../../models/Country');

// Import routes
const visitsRouter = require('../../routes/visits');
const districtsRouter = require('../../routes/districts');
const mapsRouter = require('../../routes/maps');
const countriesRouter = require('../../routes/countries');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/visits', visitsRouter);
app.use('/api/districts', districtsRouter);
app.use('/api/maps', mapsRouter);
app.use('/api/countries', countriesRouter);

describe('API Integration Tests', () => {
  let user, token, map, district, neighborhood, country;

  beforeEach(async () => {
    // Create test user
    user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      googleId: 'test123',
      firstName: 'Test',
      lastName: 'User'
    });

    // Create JWT token
    token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Create test map
    map = await Map.create({
      name: 'Test City',
      slug: 'test-city',
      type: 'borough',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      zoom: 11
    });

    // Create test district
    district = await District.create({
      name: 'Test District',
      map: map._id
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

  describe('Complete Visit Workflow', () => {
    test('should create, read, update, and delete a neighborhood visit', async () => {
      // 1. CREATE - Create a new visit
      const createResponse = await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          visitType: 'neighborhood',
          neighborhoodName: 'Test Neighborhood',
          districtName: 'Test District',
          visited: true,
          notes: 'Great place!',
          rating: 8,
          category: 'Good'
        })
        .expect(201);

      const visitId = createResponse.body._id;
      expect(createResponse.body.visitType).toBe('neighborhood');
      expect(createResponse.body.rating).toBe(8);

      // 2. READ - Fetch the visit
      const readResponse = await request(app)
        .get('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(readResponse.body).toHaveLength(1);
      expect(readResponse.body[0]._id).toBe(visitId);
      expect(readResponse.body[0].rating).toBe(8);

      // 3. UPDATE - Update the visit
      const updateResponse = await request(app)
        .put(`/api/visits/${visitId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 9,
          notes: 'Even better than I thought!',
          category: 'Good'
        })
        .expect(200);

      expect(updateResponse.body.rating).toBe(9);
      expect(updateResponse.body.notes).toBe('Even better than I thought!');

      // 4. DELETE - Delete the visit
      await request(app)
        .delete(`/api/visits/${visitId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify deletion
      const finalReadResponse = await request(app)
        .get('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(finalReadResponse.body).toHaveLength(0);
    });

    test('should handle duplicate visit creation by updating existing', async () => {
      // Create first visit
      const firstResponse = await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          visitType: 'neighborhood',
          neighborhoodName: 'Test Neighborhood',
          districtName: 'Test District',
          visited: true,
          rating: 5
        })
        .expect(201);

      const firstVisitId = firstResponse.body._id;

      // Try to create same visit again
      const secondResponse = await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          visitType: 'neighborhood',
          neighborhoodName: 'Test Neighborhood',
          districtName: 'Test District',
          visited: true,
          rating: 8,
          category: 'Good'
        })
        .expect(200); // Should update, not create

      expect(secondResponse.body._id).toBe(firstVisitId);
      expect(secondResponse.body.rating).toBe(8);
      expect(secondResponse.body.category).toBe('Good');

      // Verify only one visit exists
      const allVisits = await request(app)
        .get('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(allVisits.body).toHaveLength(1);
    });
  });

  describe('Data Relationships', () => {
    test('should properly populate neighborhood with district data', async () => {
      // Create visit
      await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          visitType: 'neighborhood',
          neighborhoodName: 'Test Neighborhood',
          districtName: 'Test District',
          visited: true
        })
        .expect(201);

      // Fetch with population
      const response = await request(app)
        .get('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body[0].neighborhood).toBeDefined();
      expect(response.body[0].neighborhood.name).toBe('Test Neighborhood');
      expect(response.body[0].neighborhood.district).toBeDefined();
    });

    test('should handle visits across different visit types', async () => {
      // Create neighborhood visit
      await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          visitType: 'neighborhood',
          neighborhoodName: 'Test Neighborhood',
          districtName: 'Test District',
          visited: true,
          rating: 7
        })
        .expect(201);

      // Create country visit
      await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          visitType: 'country',
          countryName: 'Test Country',
          visited: true,
          rating: 9
        })
        .expect(201);

      // Fetch all visits
      const allVisitsResponse = await request(app)
        .get('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(allVisitsResponse.body).toHaveLength(2);

      // Fetch by type
      const neighborhoodVisitsResponse = await request(app)
        .get('/api/visits/type/neighborhood')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(neighborhoodVisitsResponse.body).toHaveLength(1);
      expect(neighborhoodVisitsResponse.body[0].visitType).toBe('neighborhood');

      const countryVisitsResponse = await request(app)
        .get('/api/visits/type/country')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(countryVisitsResponse.body).toHaveLength(1);
      expect(countryVisitsResponse.body[0].visitType).toBe('country');
    });
  });

  describe('Error Handling', () => {
    test('should handle cascading failures gracefully', async () => {
      // Try to create visit with nonexistent district
      const response = await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          visitType: 'neighborhood',
          neighborhoodName: 'Test Neighborhood',
          districtName: 'Nonexistent District',
          visited: true
        })
        .expect(404);

      expect(response.body.error).toMatch(/District.*not found/);

      // Verify no visit was created
      const visitsResponse = await request(app)
        .get('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(visitsResponse.body).toHaveLength(0);
    });

    test('should handle malformed data', async () => {
      // Invalid rating
      const response1 = await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          visitType: 'neighborhood',
          neighborhoodName: 'Test Neighborhood',
          districtName: 'Test District',
          visited: true,
          rating: 15 // Invalid: > 10
        });
      
      expect([400, 500]).toContain(response1.status); // Accept either validation error
      
      // Invalid category
      const response2 = await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          visitType: 'neighborhood',
          neighborhoodName: 'Test Neighborhood',
          districtName: 'Test District',
          visited: true,
          category: 'Invalid'
        });
        
      expect([400, 500]).toContain(response2.status); // Accept either validation error
    });
  });

  describe('User Isolation', () => {
    test('should isolate data between different users', async () => {
      // Create another user
      const user2 = await User.create({
        username: 'testuser2',
        email: 'test2@example.com',
        googleId: 'test456',
        firstName: 'Test2',
        lastName: 'User2'
      });

      const token2 = jwt.sign(
        { id: user2._id.toString() },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      // User 1 creates a visit
      await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          visitType: 'neighborhood',
          neighborhoodName: 'Test Neighborhood',
          districtName: 'Test District',
          visited: true,
          rating: 8
        })
        .expect(201);

      // User 2 creates a visit
      await request(app)
        .post('/api/visits')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          visitType: 'neighborhood',
          neighborhoodName: 'Test Neighborhood',
          districtName: 'Test District',
          visited: true,
          rating: 6
        })
        .expect(201);

      // User 1 should only see their visit
      const user1Visits = await request(app)
        .get('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(user1Visits.body).toHaveLength(1);
      expect(user1Visits.body[0].rating).toBe(8);

      // User 2 should only see their visit
      const user2Visits = await request(app)
        .get('/api/visits')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(user2Visits.body).toHaveLength(1);
      expect(user2Visits.body[0].rating).toBe(6);
    });
  });
});