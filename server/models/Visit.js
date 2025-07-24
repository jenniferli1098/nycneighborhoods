const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Either neighborhoodId OR countryId is required, not both
  neighborhoodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Neighborhood'
  },
  countryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country'
  },
  visitType: {
    type: String,
    required: true,
    enum: ['neighborhood', 'country']
  },
  visited: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  visitDate: {
    type: Date
  },
  rating: {
    type: Number,
    min: 0,
    max: 10
  },
  eloRating: {
    type: Number,
    min: 800,
    max: 2200,
    default: null
  },
  ratingType: {
    type: String,
    enum: ['legacy', 'elo'],
    default: 'elo'
  },
  category: {
    type: String,
    enum: ['Bad', 'Mid', 'Good']
  },
}, {
  timestamps: true
});

// Validation to ensure either neighborhoodId or countryId is provided
visitSchema.pre('validate', function() {
  if (this.visitType === 'neighborhood' && !this.neighborhoodId) {
    this.invalidate('neighborhoodId', 'neighborhoodId is required for neighborhood visits');
  }
  if (this.visitType === 'country' && !this.countryId) {
    this.invalidate('countryId', 'countryId is required for country visits');
  }
  if (this.visitType === 'neighborhood' && this.countryId) {
    this.invalidate('countryId', 'countryId should not be provided for neighborhood visits');
  }
  if (this.visitType === 'country' && this.neighborhoodId) {
    this.invalidate('neighborhoodId', 'neighborhoodId should not be provided for country visits');
  }
});

// Single unique index for neighborhood and country visits
visitSchema.index({ userId: 1, neighborhoodId: 1, countryId: 1 }, { unique: true, sparse: true });
visitSchema.index({ neighborhoodId: 1 });
visitSchema.index({ countryId: 1 });
visitSchema.index({ userId: 1 });

// Pre-save middleware to update location's average rating
visitSchema.post('save', async function() {
  if (this.visitType === 'neighborhood' && this.neighborhoodId) {
    const Neighborhood = mongoose.model('Neighborhood');
    const neighborhood = await Neighborhood.findById(this.neighborhoodId);
    if (neighborhood) {
      await neighborhood.calculateAverageRating();
    }
  } else if (this.visitType === 'country' && this.countryId) {
    const Country = mongoose.model('Country');
    const country = await Country.findById(this.countryId);
    if (country) {
      await country.calculateAverageRating();
    }
  }
});

// Pre-remove middleware to update location's average rating
visitSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    if (doc.visitType === 'neighborhood' && doc.neighborhoodId) {
      const Neighborhood = mongoose.model('Neighborhood');
      const neighborhood = await Neighborhood.findById(doc.neighborhoodId);
      if (neighborhood) {
        await neighborhood.calculateAverageRating();
      }
    } else if (doc.visitType === 'country' && doc.countryId) {
      const Country = mongoose.model('Country');
      const country = await Country.findById(doc.countryId);
      if (country) {
        await country.calculateAverageRating();
      }
    }
  }
});

// Method to get full location details
visitSchema.methods.getFullDetails = async function() {
  const User = mongoose.model('User');
  const user = await User.findById(this.userId);
  
  let locationDetails = null;
  
  if (this.visitType === 'neighborhood' && this.neighborhoodId) {
    const Neighborhood = mongoose.model('Neighborhood');
    const Borough = mongoose.model('Borough');
    const City = mongoose.model('City');
    const neighborhood = await Neighborhood.findById(this.neighborhoodId);
    
    let parentLocation = null;
    if (neighborhood) {
      if (neighborhood.categoryType === 'borough' && neighborhood.boroughId) {
        const borough = await Borough.findById(neighborhood.boroughId);
        if (borough) {
          const city = await City.findById(borough.cityId);
          parentLocation = {
            borough: borough.name,
            city: city?.name
          };
        }
      } else if (neighborhood.categoryType === 'city' && neighborhood.cityId) {
        const city = await City.findById(neighborhood.cityId);
        parentLocation = {
          city: city?.name
        };
      }
    }
    
    locationDetails = {
      type: 'neighborhood',
      name: neighborhood?.name,
      categoryType: neighborhood?.categoryType,
      ...parentLocation
    };
  } else if (this.visitType === 'country' && this.countryId) {
    const Country = mongoose.model('Country');
    const country = await Country.findById(this.countryId);
    locationDetails = {
      type: 'country',
      name: country?.name,
      continent: country?.continent,
      code: country?.code
    };
  }
  
  return {
    ...this.toObject(),
    location: locationDetails,
    user: user ? { username: user.username, email: user.email } : null
  };
};

// Static method to get user's visit statistics
visitSchema.statics.getUserStats = async function(userId) {
  const userVisits = await this.find({ userId: userId });
  const Neighborhood = mongoose.model('Neighborhood');
  const Borough = mongoose.model('Borough');
  const Country = mongoose.model('Country');
  
  let totalVisits = 0;
  let totalNeighborhoods = 0;
  let totalCountries = 0;
  let ratings = [];
  let boroughsVisitedSet = new Set();
  let continentsVisitedSet = new Set();
  
  for (const visit of userVisits) {
    if (visit.visitType === 'neighborhood') {
      totalNeighborhoods++;
      if (visit.visited) {
        totalVisits++;
        const neighborhood = await Neighborhood.findById(visit.neighborhoodId);
        if (neighborhood) {
          boroughsVisitedSet.add(neighborhood.boroughId);
        }
      }
    } else if (visit.visitType === 'country') {
      totalCountries++;
      if (visit.visited) {
        totalVisits++;
        const country = await Country.findById(visit.countryId);
        if (country) {
          continentsVisitedSet.add(country.continent);
        }
      }
    }
    
    if (visit.rating) {
      ratings.push(visit.rating);
    }
  }
  
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  
  return {
    totalVisits,
    totalNeighborhoods,
    totalCountries,
    averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    boroughsVisited: boroughsVisitedSet.size,
    continentsVisited: continentsVisitedSet.size
  };
};

// Static method to get neighborhood popularity
visitSchema.statics.getNeighborhoodPopularity = async function(limit = 10) {
  const visitedNeighborhoods = await this.aggregate([
    { $match: { visited: true } },
    {
      $group: {
        _id: '$neighborhoodId',
        visitCount: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        uniqueVisitors: { $addToSet: '$userId' }
      }
    },
    { $sort: { visitCount: -1, avgRating: -1 } },
    { $limit: limit }
  ]);
  
  const Neighborhood = mongoose.model('Neighborhood');
  const Borough = mongoose.model('Borough');
  
  const result = [];
  for (const item of visitedNeighborhoods) {
    const neighborhood = await Neighborhood.findById(item._id);
    const borough = neighborhood ? await Borough.findById(neighborhood.boroughId) : null;
    
    result.push({
      neighborhood: item._id,
      neighborhoodName: neighborhood?.name || 'Unknown',
      boroughName: borough?.name || 'Unknown',
      visitCount: item.visitCount,
      avgRating: item.avgRating ? Math.round(item.avgRating * 10) / 10 : null,
      uniqueVisitors: item.uniqueVisitors.length
    });
  }
  
  return result;
};

// Static method to get country popularity
visitSchema.statics.getCountryPopularity = async function(limit = 10) {
  const visitedCountries = await this.aggregate([
    { $match: { visited: true, visitType: 'country' } },
    {
      $group: {
        _id: '$countryId',
        visitCount: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        uniqueVisitors: { $addToSet: '$userId' }
      }
    },
    { $sort: { visitCount: -1, avgRating: -1 } },
    { $limit: limit }
  ]);
  
  const Country = mongoose.model('Country');
  
  const result = [];
  for (const item of visitedCountries) {
    const country = await Country.findById(item._id);
    
    result.push({
      country: item._id,
      countryName: country?.name || 'Unknown',
      continent: country?.continent || 'Unknown',
      code: country?.code || 'Unknown',
      visitCount: item.visitCount,
      avgRating: item.avgRating ? Math.round(item.avgRating * 10) / 10 : null,
      uniqueVisitors: item.uniqueVisitors.length
    });
  }
  
  return result;
};

module.exports = mongoose.model('Visit', visitSchema);