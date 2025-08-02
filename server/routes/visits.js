const express = require('express');
const mongoose = require('mongoose');
const Visit = require('../models/Visit');
const Neighborhood = require('../models/Neighborhood');
const District = require('../models/District');
const Country = require('../models/Country');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    console.log('📡 GET /visits: Fetching visits for user:', req.user._id.toString());
    const visits = await Visit.find({ user: req.user._id.toString() })
      .populate({
        path: 'neighborhood',
        populate: {
          path: 'district',
          select: 'name type'
        }
      })
      .populate('country', 'name continent')
      .sort({ updatedAt: -1 });
    console.log('📝 GET /visits: Found', visits.length, 'visits');
    console.log('📊 GET /visits: Visit details:', visits.map(v => ({ id: v._id, neighborhood: v.neighborhood, visited: v.visited })));
    res.json(visits);
  } catch (error) {
    console.error('❌ GET /visits: Error fetching visits:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { visitType, neighborhoodName, districtName, countryName, visited, notes, visitDate, rating, category } = req.body;

    console.log('🆕 POST /visits: Creating visit for user:', req.user._id.toString());
    console.log('📍 POST /visits: Request data:', { visitType, neighborhoodName, districtName, countryName, visited, notes, visitDate, rating, category });

    if (!visitType || !['neighborhood', 'country'].includes(visitType)) {
      return res.status(400).json({ error: 'visitType must be either "neighborhood" or "country"' });
    }

    let locationId, existingVisit, visitData;

    if (visitType === 'neighborhood') {
      // Find the district first, then the neighborhood
      console.log('🔍 POST /visits: Looking up district:', districtName);
      
      const district = await District.findOne({ name: districtName });
      
      if (!district) {
        console.error('❌ POST /visits: District not found:', districtName);
        return res.status(404).json({ error: 'District not found' });
      }
      
      console.log('✅ POST /visits: Found district:', { id: district._id, name: district.name, type: district.type });

      console.log('🔍 POST /visits: Looking up neighborhood:', neighborhoodName, 'in district:', district._id);
      const neighborhood = await Neighborhood.findOne({ 
        name: neighborhoodName,
        district: district._id.toString()
      });

      if (!neighborhood) {
        console.error('❌ POST /visits: Neighborhood not found:', neighborhoodName, 'in district:', districtName);
        return res.status(404).json({ error: 'Neighborhood not found' });
      }
      console.log('✅ POST /visits: Found neighborhood:', { id: neighborhood._id, name: neighborhood.name, district: neighborhood.district });
      
      locationId = neighborhood._id.toString();
      existingVisit = await Visit.findOne({ 
        user: req.user._id.toString(), 
        neighborhood: locationId,
        visitType: 'neighborhood'
      });
      
      visitData = {
        user: req.user._id.toString(),
        neighborhood: locationId,
        visitType: 'neighborhood',
        visited,
        notes,
        visitDate,
        rating,
        category
      };
    } else if (visitType === 'country') {
      // Find the country
      console.log('🔍 POST /visits: Looking up country:', countryName);
      const country = await Country.findOne({ name: countryName });
      if (!country) {
        console.error('❌ POST /visits: Country not found:', countryName);
        return res.status(404).json({ error: 'Country not found' });
      }
      console.log('✅ POST /visits: Found country:', { id: country._id, name: country.name, continent: country.continent });
      
      locationId = country._id.toString();
      existingVisit = await Visit.findOne({ 
        user: req.user._id.toString(), 
        country: locationId,
        visitType: 'country'
      });
      
      visitData = {
        user: req.user._id.toString(),
        country: locationId,
        visitType: 'country',
        visited,
        notes,
        visitDate,
        rating,
        category
      };
    }

    console.log('🔍 POST /visits: Checking for existing visit for user:', req.user._id.toString(), 'location:', locationId);

    if (existingVisit) {
      console.log('🔄 POST /visits: Updating existing visit:', existingVisit._id);
      console.log('📋 POST /visits: Existing visit data:', JSON.stringify(existingVisit.toObject(), null, 2));
      
      // Ensure visitType is set for existing visits (in case of old data)
      if (!existingVisit.visitType) {
        console.log('⚠️ POST /visits: Setting missing visitType for existing visit');
        existingVisit.visitType = visitType;
      }
      
      existingVisit.visited = visited;
      existingVisit.notes = notes;
      existingVisit.visitDate = visitDate;
      existingVisit.rating = rating;
      existingVisit.category = category;
      await existingVisit.save();
      console.log('✅ POST /visits: Updated existing visit successfully');
      
      return res.json(existingVisit);
    }

    console.log('🆕 POST /visits: Creating new visit');
    
    if (!visitData) {
      console.error('❌ POST /visits: visitData is undefined!');
      console.error('❌ POST /visits: Debug info - visitType:', visitType, 'neighborhoodName:', neighborhoodName, 'boroughName:', boroughName);
      return res.status(500).json({ error: 'Internal error: visitData not set' });
    }
    
    if (!visitData.visitType) {
      console.error('❌ POST /visits: visitData.visitType is missing!');
      console.error('❌ POST /visits: visitData object:', JSON.stringify(visitData, null, 2));
      return res.status(500).json({ error: 'Internal error: visitType missing from visitData' });
    }
    
    console.log('📋 POST /visits: visitData object:', JSON.stringify(visitData, null, 2));
    const visit = new Visit(visitData);

    console.log('💾 POST /visits: Saving new visit:', { userId: visit.userId, visitType: visit.visitType, visited: visit.visited });
    console.log('📋 POST /visits: Full visit object before save:', JSON.stringify(visit.toObject(), null, 2));

    await visit.save();
    console.log('✅ POST /visits: Created new visit successfully:', visit._id);
    
    res.status(201).json(visit);
  } catch (error) {
    console.error('❌ POST /visits: Visit creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { visited, notes, visitDate, rating, category } = req.body;
    
    console.log('🔄 PUT /visits: Updating visit ID:', req.params.id, 'for user:', req.user._id.toString());
    console.log('📝 PUT /visits: Update data:', { visited, notes, visitDate, rating, category });
    
    const visit = await Visit.findOne({ 
      _id: req.params.id, 
      user: req.user._id.toString() 
    });

    if (!visit) {
      console.error('❌ PUT /visits: Visit not found for ID:', req.params.id, 'user:', req.user._id.toString());
      return res.status(404).json({ error: 'Visit not found' });
    }

    console.log('✅ PUT /visits: Found visit to update:', { id: visit._id, neighborhood: visit.neighborhood, currentVisited: visit.visited });

    console.log('📋 PUT /visits: Current visit data:', JSON.stringify(visit.toObject(), null, 2));
    
    // Ensure visitType is set for existing visits (in case of old data)
    if (!visit.visitType) {
      console.log('⚠️ PUT /visits: Setting missing visitType for existing visit');
      visit.visitType = visit.neighborhood ? 'neighborhood' : 'country';
    }
    
    visit.visited = visited;
    visit.notes = notes;
    visit.visitDate = visitDate;
    visit.rating = rating;
    visit.category = category;
    
    console.log('💾 PUT /visits: Saving updated visit');
    await visit.save();
    console.log('✅ PUT /visits: Updated visit successfully');
    
    res.json(visit);
  } catch (error) {
    console.error('❌ PUT /visits: Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('🗑️ DELETE /visits: Deleting visit ID:', req.params.id, 'for user:', req.user._id.toString());
    
    const visit = await Visit.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user._id.toString() 
    });

    if (!visit) {
      console.error('❌ DELETE /visits: Visit not found for ID:', req.params.id, 'user:', req.user._id.toString());
      return res.status(404).json({ error: 'Visit not found' });
    }

    console.log('✅ DELETE /visits: Deleted visit successfully:', { id: visit._id, neighborhood: visit.neighborhood });
    res.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('❌ DELETE /visits: Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get visits by type
router.get('/type/:visitType', auth, async (req, res) => {
  try {
    const { visitType } = req.params;
    
    if (!['neighborhood', 'country'].includes(visitType)) {
      return res.status(400).json({ error: 'visitType must be either "neighborhood" or "country"' });
    }
    
    console.log(`📡 GET /visits/type/${visitType}: Fetching ${visitType} visits for user:`, req.user._id.toString());
    const visits = await Visit.find({ 
      user: req.user._id.toString(),
      visitType: visitType
    }).sort({ updatedAt: -1 });
    
    console.log(`📝 GET /visits/type/${visitType}: Found`, visits.length, 'visits');
    res.json(visits);
  } catch (error) {
    console.error(`❌ GET /visits/type: Error fetching ${req.params.visitType} visits:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's visit statistics
router.get('/stats', auth, async (req, res) => {
  try {
    console.log('📊 GET /visits/stats: Fetching stats for user:', req.user._id.toString());
    const stats = await Visit.getUserStats(req.user._id.toString());
    console.log('📈 GET /visits/stats: Generated stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ GET /visits/stats: Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get neighborhood popularity
router.get('/popularity/neighborhoods', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log('📊 GET /visits/popularity/neighborhoods: Fetching top', limit, 'neighborhoods');
    const popularity = await Visit.getNeighborhoodPopularity(limit);
    console.log('📈 GET /visits/popularity/neighborhoods: Generated popularity:', popularity);
    res.json(popularity);
  } catch (error) {
    console.error('❌ GET /visits/popularity/neighborhoods: Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get country popularity
router.get('/popularity/countries', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log('📊 GET /visits/popularity/countries: Fetching top', limit, 'countries');
    const popularity = await Visit.getCountryPopularity(limit);
    console.log('📈 GET /visits/popularity/countries: Generated popularity:', popularity);
    res.json(popularity);
  } catch (error) {
    console.error('❌ GET /visits/popularity/countries: Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all visits for a given map
router.get('/map/:mapId', auth, async (req, res) => {
  try {
    const { mapId } = req.params;
    
    console.log('📡 GET /visits/map: Fetching visits for map:', mapId, 'user:', req.user._id.toString());
    
    if (!mongoose.Types.ObjectId.isValid(mapId)) {
      return res.status(400).json({ error: 'Invalid map ID' });
    }
    
    const Map = require('../models/Map');
    const map = await Map.findById(mapId);
    if (!map) {
      return res.status(404).json({ error: 'Map not found' });
    }
    
    const districts = await District.find({ map: mapId });
    const districtIds = districts.map(d => d._id);
    
    if (districtIds.length === 0) {
      console.log('📝 GET /visits/map: No districts found for map:', mapId);
      return res.json([]);
    }
    
    const neighborhoods = await Neighborhood.find({ district: { $in: districtIds } });
    const neighborhoodIds = neighborhoods.map(n => n._id);
    
    if (neighborhoodIds.length === 0) {
      console.log('📝 GET /visits/map: No neighborhoods found for map:', mapId);
      return res.json([]);
    }
    
    const visits = await Visit.find({ 
      user: req.user._id.toString(),
      neighborhood: { $in: neighborhoodIds },
      visitType: 'neighborhood'
    })
      .populate({
        path: 'neighborhood',
        populate: {
          path: 'district',
          select: 'name type'
        }
      })
      .sort({ updatedAt: -1 });
    
    console.log('📝 GET /visits/map: Found', visits.length, 'visits for map:', mapId);
    res.json(visits);
  } catch (error) {
    console.error('❌ GET /visits/map: Error fetching visits for map:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;