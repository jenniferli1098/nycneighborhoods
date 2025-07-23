const mongoose = require('mongoose');

const mapSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  categoryType: {
    type: String,
    required: true,
    enum: ['borough', 'city'],
    trim: true
  },
  cityIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  }],
  boroughIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borough'
  }],
  coordinates: {
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    }
  },
  // Additional map configuration
  zoom: {
    type: Number,
    default: 11,
    min: 1,
    max: 20
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
mapSchema.index({ categoryType: 1 });
mapSchema.index({ isActive: 1 });
mapSchema.index({ 'coordinates.longitude': 1, 'coordinates.latitude': 1 });

// Virtual for getting center coordinates as array (useful for map libraries)
mapSchema.virtual('center').get(function() {
  return [this.coordinates.latitude, this.coordinates.longitude];
});

// Method to get all related cities
mapSchema.methods.getCities = async function() {
  if (this.cityIds.length === 0) return [];
  
  const City = mongoose.model('City');
  return await City.find({ _id: { $in: this.cityIds } });
};

// Method to get all related boroughs
mapSchema.methods.getBoroughs = async function() {
  if (this.boroughIds.length === 0) return [];
  
  const Borough = mongoose.model('Borough');
  return await Borough.find({ _id: { $in: this.boroughIds } });
};

// Method to get all neighborhoods for this map
mapSchema.methods.getNeighborhoods = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  
  if (this.categoryType === 'borough' && this.boroughIds.length > 0) {
    // For borough-based maps, get neighborhoods by borough IDs
    return await Neighborhood.find({ boroughId: { $in: this.boroughIds } });
  } else if (this.categoryType === 'city' && this.cityIds.length > 0) {
    // For city-based maps, get neighborhoods by city IDs
    return await Neighborhood.find({ cityId: { $in: this.cityIds } });
  }
  
  return [];
};

// Method to get map statistics
mapSchema.methods.getMapStats = async function() {
  const neighborhoods = await this.getNeighborhoods();
  const neighborhoodIds = neighborhoods.map(n => n._id);
  
  if (neighborhoodIds.length === 0) {
    return {
      totalNeighborhoods: 0,
      totalVisits: 0,
      uniqueVisitors: 0,
      averageRating: null,
      visitedNeighborhoods: 0,
      visitedPercentage: 0
    };
  }
  
  const Visit = mongoose.model('Visit');
  const visitStats = await Visit.aggregate([
    { $match: { neighborhoodId: { $in: neighborhoodIds } } },
    { 
      $group: {
        _id: null,
        totalVisits: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$userId' },
        avgRating: { $avg: '$rating' },
        visitedNeighborhoods: { $addToSet: '$neighborhoodId' }
      }
    }
  ]);
  
  const stats = visitStats[0] || {};
  return {
    totalNeighborhoods: neighborhoods.length,
    totalVisits: stats.totalVisits || 0,
    uniqueVisitors: stats.uniqueVisitors ? stats.uniqueVisitors.length : 0,
    averageRating: stats.avgRating ? Math.round(stats.avgRating * 10) / 10 : null,
    visitedNeighborhoods: stats.visitedNeighborhoods ? stats.visitedNeighborhoods.length : 0,
    visitedPercentage: neighborhoods.length > 0 ? Math.round((stats.visitedNeighborhoods?.length || 0) / neighborhoods.length * 100) : 0
  };
};

// Static method to find maps by category type
mapSchema.statics.findByCategoryType = function(categoryType) {
  return this.find({ categoryType, isActive: true });
};

// Static method to find active maps
mapSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find maps containing a specific city
mapSchema.statics.findByCity = function(cityId) {
  return this.find({ cityIds: cityId, isActive: true });
};

// Static method to find maps containing a specific borough
mapSchema.statics.findByBorough = function(boroughId) {
  return this.find({ boroughIds: boroughId, isActive: true });
};

// Pre-save validation to ensure appropriate IDs are provided based on category type
mapSchema.pre('save', function(next) {
  if (this.categoryType === 'borough' && this.boroughIds.length === 0) {
    return next(new Error('Borough-based maps must have at least one borough ID'));
  }
  
  if (this.categoryType === 'city' && this.cityIds.length === 0) {
    return next(new Error('City-based maps must have at least one city ID'));
  }
  
  next();
});

module.exports = mongoose.model('Map', mapSchema);