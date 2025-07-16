const mongoose = require('mongoose');

const boroughSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
}, {
  timestamps: true
});

boroughSchema.index({ coordinates: '2dsphere' });
boroughSchema.index({ name: 1, cityId: 1 }, { unique: true });
boroughSchema.index({ cityId: 1 });

// Method to get populated neighborhood details
boroughSchema.methods.getNeighborhoodDetails = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  return await Neighborhood.find({ boroughId: this._id });
};

// Method to get all neighborhoods in this borough
boroughSchema.methods.getNeighborhoods = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  return await Neighborhood.find({ boroughId: this._id });
};

// Method to get borough statistics
boroughSchema.methods.getStats = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  const Visit = mongoose.model('Visit');
  
  const neighborhoods = await Neighborhood.find({ boroughId: this._id });
  const neighborhoodIds = neighborhoods.map(n => n._id);
  
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

// Static method to find boroughs by city ID
boroughSchema.statics.findByCityId = function(cityId) {
  return this.find({ cityId: cityId });
};

// Static method to find borough by name and city ID
boroughSchema.statics.findByNameAndCityId = function(name, cityId) {
  return this.findOne({ name, cityId });
};

// Method to get the associated city
boroughSchema.methods.getCity = async function() {
  const City = mongoose.model('City');
  return await City.findById(this.cityId);
};

module.exports = mongoose.model('Borough', boroughSchema);