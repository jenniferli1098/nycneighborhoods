const mongoose = require('mongoose');

const boroughSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  neighborhoodIds: [{
    type: String,
    required: true,
    trim: true
  }],
}, {
  timestamps: true
});

boroughSchema.index({ coordinates: '2dsphere' });

// Method to get populated neighborhood details
boroughSchema.methods.getNeighborhoodDetails = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  return await Neighborhood.find({ boroughId: this._id.toString() });
};

// Method to get all neighborhoods in this borough
boroughSchema.methods.getNeighborhoods = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  return await Neighborhood.find({ boroughId: this._id.toString() });
};

// Method to get borough statistics
boroughSchema.methods.getStats = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  const Visit = mongoose.model('Visit');
  
  const neighborhoods = await Neighborhood.find({ boroughId: this._id.toString() });
  const neighborhoodIds = neighborhoods.map(n => n._id.toString());
  
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

// Static method to find borough by neighborhood
boroughSchema.statics.findByNeighborhood = async function(neighborhoodName) {
  const Neighborhood = mongoose.model('Neighborhood');
  const neighborhood = await Neighborhood.findOne({ name: neighborhoodName });
  return neighborhood ? await this.findOne({ _id: neighborhood.boroughId }) : null;
};

module.exports = mongoose.model('Borough', boroughSchema);