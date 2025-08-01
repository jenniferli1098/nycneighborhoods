const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  map: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Map',
    index: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound indexes
districtSchema.index({ name: 1, map: 1 }, { unique: true, sparse: true });

// Method to get populated neighborhood details
districtSchema.methods.getNeighborhoodDetails = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  return await Neighborhood.find({ district: this._id });
};

// Method to get all neighborhoods in this district
districtSchema.methods.getNeighborhoods = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  return await Neighborhood.find({ district: this._id });
};

// Method to get district statistics
districtSchema.methods.getStats = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  const Visit = mongoose.model('Visit');
  
  const neighborhoods = await Neighborhood.find({ district: this._id });
  const neighborhoodIds = neighborhoods.map(n => n._id);
  
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

// Method to calculate average rating (for city-type districts)
districtSchema.methods.calculateAverageRating = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  const neighborhoods = await Neighborhood.find({ district: this._id });
  
  if (neighborhoods.length === 0) {
    this.averageVisitRating = null;
    this.totalVisits = 0;
    await this.save();
    return;
  }

  const ratings = neighborhoods
    .filter(n => n.averageVisitRating !== null && n.averageVisitRating !== undefined)
    .map(n => n.averageVisitRating);

  if (ratings.length === 0) {
    this.averageVisitRating = null;
  } else {
    this.averageVisitRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }
  
  this.totalVisits = neighborhoods.reduce((sum, n) => sum + (n.totalVisits || 0), 0);
  await this.save();
};

// Static method to find district by neighborhood
districtSchema.statics.findByNeighborhood = async function(neighborhoodName) {
  const Neighborhood = mongoose.model('Neighborhood');
  const neighborhood = await Neighborhood.findOne({ name: neighborhoodName });
  return neighborhood ? await this.findOne({ _id: neighborhood.district }) : null;
};

// Static method to find districts by map 
districtSchema.statics.findByMap = function(map) {
  return this.find({ map: map });
};

// Static method to find district by name and map
districtSchema.statics.findByNameAndMap = function(name, map) {
  return this.findOne({ name, map});
};


module.exports = mongoose.model('District', districtSchema);