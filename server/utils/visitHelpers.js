const Neighborhood = require('../models/Neighborhood');
const District = require('../models/District');
const Country = require('../models/Country');
const Visit = require('../models/Visit');

const logger = {
  info: (message, data = {}) => {
    console.log(`📡 ${message}`, data);
  },
  success: (message, data = {}) => {
    console.log(`✅ ${message}`, data);
  },
  error: (message, data = {}) => {
    console.error(`❌ ${message}`, data);
  },
  debug: (message, data = {}) => {
    console.log(`📋 ${message}`, data);
  }
};

const findLocationData = async (visitType, neighborhoodName, districtName, countryName) => {
  if (visitType === 'neighborhood') {
    const district = await District.findOne({ name: districtName });
    if (!district) {
      throw new Error(`District not found: ${districtName}`);
    }

    const neighborhood = await Neighborhood.findOne({ 
      name: neighborhoodName,
      district: district._id.toString()
    });
    if (!neighborhood) {
      throw new Error(`Neighborhood not found: ${neighborhoodName} in district: ${districtName}`);
    }

    return {
      locationId: neighborhood._id.toString(),
      visitData: {
        neighborhood: neighborhood._id.toString(),
        visitType: 'neighborhood'
      }
    };
  } else if (visitType === 'country') {
    const country = await Country.findOne({ name: countryName });
    if (!country) {
      throw new Error(`Country not found: ${countryName}`);
    }

    return {
      locationId: country._id.toString(),
      visitData: {
        country: country._id.toString(),
        visitType: 'country'
      }
    };
  }

  throw new Error('Invalid visit type');
};

const findExistingVisit = async (userId, visitType, locationId) => {
  const query = { 
    user: userId, 
    visitType: visitType
  };

  if (visitType === 'neighborhood') {
    query.neighborhood = locationId;
  } else if (visitType === 'country') {
    query.country = locationId;
  }

  return await Visit.findOne(query);
};

const updateVisitData = (visit, { visited, notes, visitDate, rating, category }) => {
  // Ensure visitType is set for existing visits (backward compatibility)
  if (!visit.visitType) {
    visit.visitType = visit.neighborhood ? 'neighborhood' : 'country';
  }
  
  visit.visited = visited;
  visit.notes = notes;
  visit.visitDate = visitDate;
  visit.rating = rating;
  visit.category = category;
};

const createVisitData = (userId, locationData, { visited, notes, visitDate, rating, category }) => {
  return {
    user: userId,
    ...locationData.visitData,
    visited,
    notes,
    visitDate,
    rating,
    category
  };
};

module.exports = {
  logger,
  findLocationData,
  findExistingVisit,
  updateVisitData,
  createVisitData
};