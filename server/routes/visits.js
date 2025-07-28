const express = require('express');
const mongoose = require('mongoose');
const Visit = require('../models/Visit');
const Neighborhood = require('../models/Neighborhood');
const Country = require('../models/Country');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    console.log('📡 GET /visits: Fetching visits for user:', req.user._id.toString());
    const visits = await Visit.find({ userId: req.user._id.toString() })
      .sort({ updatedAt: -1 });
    console.log('📝 GET /visits: Found', visits.length, 'visits');
    console.log('📊 GET /visits: Visit details:', visits.map(v => ({ id: v._id, neighborhoodId: v.neighborhoodId, visited: v.visited })));
    res.json(visits);
  } catch (error) {
    console.error('❌ GET /visits: Error fetching visits:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { visitType, neighborhoodName, boroughName, countryName, visited, notes, visitDate, rating, category } = req.body;

    console.log('🆕 POST /visits: Creating visit for user:', req.user._id.toString());
    console.log('📍 POST /visits: Request data:', { visitType, neighborhoodName, boroughName, countryName, visited, notes, visitDate, rating, category });

    if (!visitType || !['neighborhood', 'country'].includes(visitType)) {
      return res.status(400).json({ error: 'visitType must be either "neighborhood" or "country"' });
    }

    let locationId, existingVisit, visitData;

    if (visitType === 'neighborhood') {
      // Try to find the category (borough/city) first, then the neighborhood
      console.log('🔍 POST /visits: Looking up category (borough/city):', boroughName);
      
      // First try to find as a borough
      const borough = await mongoose.model('Borough').findOne({ name: boroughName });
      
      if (borough) {
        // Found a borough - use borough-based logic
        console.log('✅ POST /visits: Found borough:', { id: borough._id, name: borough.name });

        console.log('🔍 POST /visits: Looking up neighborhood:', neighborhoodName, 'in borough:', borough._id);
        const neighborhood = await Neighborhood.findOne({ 
          name: neighborhoodName,
          boroughId: borough._id.toString()
        });

        if (!neighborhood) {
          console.error('❌ POST /visits: Neighborhood not found:', neighborhoodName, 'in borough:', boroughName);
          return res.status(404).json({ error: 'Neighborhood not found' });
        }
        console.log('✅ POST /visits: Found neighborhood:', { id: neighborhood._id, name: neighborhood.name, boroughId: neighborhood.boroughId });
        
        locationId = neighborhood._id.toString();
        existingVisit = await Visit.findOne({ 
          userId: req.user._id.toString(), 
          neighborhoodId: locationId,
          visitType: 'neighborhood'
        });
        
        visitData = {
          userId: req.user._id.toString(),
          neighborhoodId: locationId,
          visitType: 'neighborhood',
          visited,
          notes,
          visitDate,
          rating,
          category
        };
      } else {
        // No borough found - try to find as a city
        console.log('🔍 POST /visits: No borough found, looking up city:', boroughName);
        const city = await mongoose.model('City').findOne({ name: boroughName });
        
        if (city) {
          // Found a city - use city-based logic
          console.log('✅ POST /visits: Found city:', { id: city._id, name: city.name });

          console.log('🔍 POST /visits: Looking up neighborhood:', neighborhoodName, 'in city:', city._id);
          const neighborhood = await Neighborhood.findOne({ 
            name: neighborhoodName,
            cityId: city._id.toString()
          });

          if (!neighborhood) {
            console.error('❌ POST /visits: Neighborhood not found:', neighborhoodName, 'in city:', boroughName);
            return res.status(404).json({ error: 'Neighborhood not found' });
          }
          console.log('✅ POST /visits: Found neighborhood:', { id: neighborhood._id, name: neighborhood.name, cityId: neighborhood.cityId });
          
          locationId = neighborhood._id.toString();
          existingVisit = await Visit.findOne({ 
            userId: req.user._id.toString(), 
            neighborhoodId: locationId,
            visitType: 'neighborhood'
          });
          
          visitData = {
            userId: req.user._id.toString(),
            neighborhoodId: locationId,
            visitType: 'neighborhood',
            visited,
            notes,
            visitDate,
            rating,
            category
          };
        } else {
          console.error('❌ POST /visits: Neither borough nor city found:', boroughName);
          return res.status(404).json({ error: 'Borough or city not found' });
        }
      }
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
        userId: req.user._id.toString(), 
        countryId: locationId,
        visitType: 'country'
      });
      
      visitData = {
        userId: req.user._id.toString(),
        countryId: locationId,
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
      userId: req.user._id.toString() 
    });

    if (!visit) {
      console.error('❌ PUT /visits: Visit not found for ID:', req.params.id, 'user:', req.user._id.toString());
      return res.status(404).json({ error: 'Visit not found' });
    }

    console.log('✅ PUT /visits: Found visit to update:', { id: visit._id, neighborhoodId: visit.neighborhoodId, currentVisited: visit.visited });

    console.log('📋 PUT /visits: Current visit data:', JSON.stringify(visit.toObject(), null, 2));
    
    // Ensure visitType is set for existing visits (in case of old data)
    if (!visit.visitType) {
      console.log('⚠️ PUT /visits: Setting missing visitType for existing visit');
      visit.visitType = visit.neighborhoodId ? 'neighborhood' : 'country';
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
      userId: req.user._id.toString() 
    });

    if (!visit) {
      console.error('❌ DELETE /visits: Visit not found for ID:', req.params.id, 'user:', req.user._id.toString());
      return res.status(404).json({ error: 'Visit not found' });
    }

    console.log('✅ DELETE /visits: Deleted visit successfully:', { id: visit._id, neighborhoodId: visit.neighborhoodId });
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
      userId: req.user._id.toString(),
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

module.exports = router;