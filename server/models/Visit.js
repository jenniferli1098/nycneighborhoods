const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  // Either neighborhoodId OR countryId is required, not both
  neighborhoodId: {
    type: String,
    trim: true
  },
  countryId: {
    type: String,
    trim: true
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

// Compound index for unique visits (either neighborhoodId or countryId will be non-null)
visitSchema.index({ userId: 1, neighborhoodId: 1, countryId: 1 }, { unique: true, sparse: true });
visitSchema.index({ neighborhoodId: 1 });
visitSchema.index({ countryId: 1 });
visitSchema.index({ userId: 1 });

// Pre-save middleware to update location's average rating
visitSchema.post('save', async function() {
  if (this.visitType === 'neighborhood' && this.neighborhoodId) {
    const Neighborhood = mongoose.model('Neighborhood');
    const neighborhood = await Neighborhood.findOne({ _id: this.neighborhoodId });
    if (neighborhood) {
      await neighborhood.calculateAverageRating();
    }
  } else if (this.visitType === 'country' && this.countryId) {
    const Country = mongoose.model('Country');
    const country = await Country.findOne({ _id: this.countryId });
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
      const neighborhood = await Neighborhood.findOne({ _id: doc.neighborhoodId });
      if (neighborhood) {
        await neighborhood.calculateAverageRating();
      }
    } else if (doc.visitType === 'country' && doc.countryId) {
      const Country = mongoose.model('Country');
      const country = await Country.findOne({ _id: doc.countryId });
      if (country) {
        await country.calculateAverageRating();
      }
    }
  }
});

// Method to get full location details
visitSchema.methods.getFullDetails = async function() {
  const User = mongoose.model('User');
  const user = await User.findOne({ _id: this.userId });
  
  let locationDetails = null;
  
  if (this.visitType === 'neighborhood' && this.neighborhoodId) {
    const Neighborhood = mongoose.model('Neighborhood');
    const Borough = mongoose.model('Borough');
    const neighborhood = await Neighborhood.findOne({ _id: this.neighborhoodId });
    const borough = neighborhood ? await Borough.findOne({ _id: neighborhood.boroughId }) : null;
    locationDetails = {
      type: 'neighborhood',
      name: neighborhood?.name,
      borough: borough?.name,
      city: neighborhood?.city
    };
  } else if (this.visitType === 'country' && this.countryId) {
    const Country = mongoose.model('Country');
    const country = await Country.findOne({ _id: this.countryId });
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
        const neighborhood = await Neighborhood.findOne({ _id: visit.neighborhoodId });
        if (neighborhood) {
          boroughsVisitedSet.add(neighborhood.boroughId);
        }
      }
    } else if (visit.visitType === 'country') {
      totalCountries++;
      if (visit.visited) {
        totalVisits++;
        const country = await Country.findOne({ _id: visit.countryId });
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
    const neighborhood = await Neighborhood.findOne({ _id: item._id });
    const borough = neighborhood ? await Borough.findOne({ _id: neighborhood.boroughId }) : null;
    
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
    const country = await Country.findOne({ _id: item._id });
    
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