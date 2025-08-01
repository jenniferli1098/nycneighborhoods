const mongoose = require('mongoose');
const District = require('../../models/District');
const Map = require('../../models/Map');

describe('District Model', () => {
  let map;

  beforeEach(async () => {
    // Create test map
    map = await Map.create({
      name: 'Test Map',
      slug: 'test-map',
      type: 'borough',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      zoom: 11
    });
  });

  describe('Schema Validation', () => {
    test('should create a valid district', async () => {
      const districtData = {
        name: 'Test District',
        map: map._id,
        description: 'A test district'
      };

      const district = await District.create(districtData);
      expect(district.name).toBe('Test District');
      expect(district.map.toString()).toBe(map._id.toString());
      expect(district.description).toBe('A test district');
    });

    test('should require name field', async () => {
      const districtData = {
        map: map._id
      };

      await expect(District.create(districtData)).rejects.toThrow(/Path `name` is required/);
    });

    test('should trim name field', async () => {
      const districtData = {
        name: '  Trimmed District  ',
        map: map._id
      };

      const district = await District.create(districtData);
      expect(district.name).toBe('Trimmed District');
    });

    test('should enforce name uniqueness within same map', async () => {
      const districtData = {
        name: 'Duplicate District',
        map: map._id
      };

      await District.create(districtData);
      
      // Try to create another district with same name in same map
      await expect(District.create(districtData)).rejects.toThrow(/duplicate key error/);
    });

    test('should allow same name in different maps', async () => {
      const anotherMap = await Map.create({
        name: 'Another Map',
        slug: 'another-map',
        type: 'city',
        coordinates: {
          latitude: 42.3601,
          longitude: -71.0589
        },
        zoom: 12
      });

      const district1 = await District.create({
        name: 'Same Name District',
        map: map._id
      });

      const district2 = await District.create({
        name: 'Same Name District',
        map: anotherMap._id
      });

      expect(district1.name).toBe(district2.name);
      expect(district1.map.toString()).not.toBe(district2.map.toString());
    });

    test('should trim description field', async () => {
      const districtData = {
        name: 'Test District',
        map: map._id,
        description: '  Trimmed description  '
      };

      const district = await District.create(districtData);
      expect(district.description).toBe('Trimmed description');
    });
  });

  describe('Timestamps', () => {
    test('should have createdAt and updatedAt timestamps', async () => {
      const districtData = {
        name: 'Test District',
        map: map._id
      };

      const district = await District.create(districtData);
      expect(district.createdAt).toBeDefined();
      expect(district.updatedAt).toBeDefined();
      expect(district.createdAt).toEqual(district.updatedAt);
    });

    test('should update updatedAt on modification', async () => {
      const district = await District.create({
        name: 'Test District',
        map: map._id
      });
      
      const originalUpdatedAt = district.updatedAt;

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      district.description = 'Updated description';
      await district.save();

      expect(district.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Population', () => {
    test('should populate map data', async () => {
      const district = await District.create({
        name: 'Test District',
        map: map._id
      });

      const populatedDistrict = await District.findById(district._id).populate('map');
      
      expect(populatedDistrict.map).toBeDefined();
      expect(populatedDistrict.map.name).toBe('Test Map');
      expect(populatedDistrict.map.type).toBe('borough');
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test districts
      await District.create([
        { name: 'District A', map: map._id },
        { name: 'District B', map: map._id },
        { name: 'District C', map: map._id }
      ]);
    });

    test('should find districts by map', async () => {
      const districts = await District.find({ map: map._id });
      expect(districts).toHaveLength(3);
      expect(districts.map(d => d.name)).toContain('District A');
      expect(districts.map(d => d.name)).toContain('District B');
      expect(districts.map(d => d.name)).toContain('District C');
    });

    test('should sort districts alphabetically by default', async () => {
      const districts = await District.find({ map: map._id }).sort({ name: 1 });
      expect(districts[0].name).toBe('District A');
      expect(districts[1].name).toBe('District B');
      expect(districts[2].name).toBe('District C');
    });
  });

  describe('Validation Edge Cases', () => {
    test('should handle empty string name', async () => {
      const districtData = {
        name: '',
        map: map._id
      };

      await expect(District.create(districtData)).rejects.toThrow(/Path `name` is required/);
    });

    test('should handle very long description', async () => {
      const longDescription = 'A'.repeat(1000);
      const districtData = {
        name: 'Test District',
        map: map._id,
        description: longDescription
      };

      const district = await District.create(districtData);
      expect(district.description).toBe(longDescription);
    });

    test('should handle special characters in name', async () => {
      const districtData = {
        name: 'District-Name_With/Special#Characters',
        map: map._id
      };

      const district = await District.create(districtData);
      expect(district.name).toBe('District-Name_With/Special#Characters');
    });
  });
});