const mongoose = require('mongoose');

const mapSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
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
    },
  },
  // Additional map configuration
  zoom: {
    type: Number,
    default: 11,
    min: 1,
    max: 20
  },
  // Type of districts in this map - distinguishes between borough-like and city-like maps
  type: {
    type: String,
    required: true,
    enum: ['borough', 'city'],
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for performance
mapSchema.index({ 'coordinates.longitude': 1, 'coordinates.latitude': 1 });

// Virtual for getting center coordinates as array (useful for map libraries)
mapSchema.virtual('center').get(function() {
  return [this.coordinates.latitude, this.coordinates.longitude];
});

// Method to get all related districts
mapSchema.methods.getDistricts = async function() {
  const District = mongoose.model('District');
  return await District.find({ map: this._id }).sort({ name: 1 });
};

// Method to get all neighborhoods for this map
mapSchema.methods.getNeighborhoods = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  const District = mongoose.model('District');
  
  // Get districts for this map
  const districts = await District.find({ map: this._id });
  const districtIds = districts.map(d => d._id);
  
  if (districtIds.length > 0) {
    // Get neighborhoods by district IDs
    return await Neighborhood.find({ district: { $in: districtIds } });
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
    { $match: { neighborhood: { $in: neighborhoodIds } } },
    { 
      $group: {
        _id: null,
        totalVisits: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$user' },
        avgRating: { $avg: '$rating' },
        visitedNeighborhoods: { $addToSet: '$neighborhood' }
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

// Static method to find maps of a specific type
mapSchema.statics.findByType = function(mapType) {
  return this.find({ type: mapType });
};

// Static method to find map by slug
mapSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug.toLowerCase() });
};

// Static method to find all active maps (all maps are active by default)
mapSchema.statics.findActive = function() {
  return this.find({});
};

// Static method to find maps containing a specific district
mapSchema.statics.findByDistrict = function(districtId) {
  const District = mongoose.model('District');
  return District.findById(districtId).then(district => {
    return district ? this.findById(district.map) : null;
  });
};

// Pre-save validation
mapSchema.pre('save', function(next) {
  next();
});

module.exports = mongoose.model('Map', mapSchema);