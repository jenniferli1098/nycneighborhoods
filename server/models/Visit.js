const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Either neighborhood OR country is required, not both
  neighborhood: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Neighborhood'
  },
  country: {
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
  category: {
    type: String,
    enum: ['Bad', 'Mid', 'Good']
  },
}, {
  timestamps: true
});

// Validation to ensure either neighborhood or country is provided
visitSchema.pre('validate', function() {
  if (this.visitType === 'neighborhood' && !this.neighborhood) {
    this.invalidate('neighborhood', 'neighborhood is required for neighborhood visits');
  }
  if (this.visitType === 'country' && !this.country) {
    this.invalidate('country', 'country is required for country visits');
  }
  if (this.visitType === 'neighborhood' && this.country) {
    this.invalidate('country', 'country should not be provided for neighborhood visits');
  }
  if (this.visitType === 'country' && this.neighborhood) {
    this.invalidate('neighborhood', 'neighborhood should not be provided for country visits');
  }
});

// Single unique index for neighborhood and country visits
visitSchema.index({ user: 1, neighborhood: 1, country: 1 }, { unique: true, sparse: true });
visitSchema.index({ neighborhood: 1 });
visitSchema.index({ country: 1 });
visitSchema.index({ user: 1 });



// Method to get full location details
visitSchema.methods.getFullDetails = async function() {
  const User = mongoose.model('User');
  const user = await User.findById(this.user);
  
  let locationDetails = null;
  
  if (this.visitType === 'neighborhood' && this.neighborhood) {
    const Neighborhood = mongoose.model('Neighborhood');
    const Borough = mongoose.model('Borough');
    const City = mongoose.model('City');
    const neighborhood = await Neighborhood.findById(this.neighborhood);
    
    let parentLocation = null;
    if (neighborhood) {
      if (neighborhood.categoryType === 'borough' && neighborhood.borough) {
        const borough = await Borough.findById(neighborhood.borough);
        if (borough) {
          const city = await City.findById(borough.city);
          parentLocation = {
            borough: borough.name,
            city: city?.name
          };
        }
      } else if (neighborhood.categoryType === 'city' && neighborhood.city) {
        const city = await City.findById(neighborhood.city);
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
  } else if (this.visitType === 'country' && this.country) {
    const Country = mongoose.model('Country');
    const country = await Country.findById(this.country);
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
visitSchema.statics.getUserStats = async function(user) {
  const userVisits = await this.find({ user: user });
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
        const neighborhood = await Neighborhood.findById(visit.neighborhood);
        if (neighborhood) {
          boroughsVisitedSet.add(neighborhood.borough);
        }
      }
    } else if (visit.visitType === 'country') {
      totalCountries++;
      if (visit.visited) {
        totalVisits++;
        const country = await Country.findById(visit.country);
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
        _id: '$neighborhood',
        visitCount: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        uniqueVisitors: { $addToSet: '$user' }
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
    const borough = neighborhood ? await Borough.findById(neighborhood.borough) : null;
    
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
        _id: '$country',
        visitCount: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        uniqueVisitors: { $addToSet: '$user' }
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