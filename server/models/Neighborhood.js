const mongoose = require('mongoose');

const neighborhoodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // For NYC neighborhoods - reference to Borough
  boroughId: {
    type: String,
    trim: true
  },
  // For other cities - reference to City  
  cityId: {
    type: String,
    trim: true
  },
  // Legacy field - keeping for backward compatibility
  city: {
    type: String,
    trim: true,
    enum: ['NYC', 'Boston', 'Cambridge', 'Somerville'],
    default: 'NYC'
  },
  description: {
    type: String,
    trim: true
  },
  averageVisitRating: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  totalVisits: {
    type: Number,
    default: 0
  },
}, {
  timestamps: true
});

// Validation to ensure either boroughId or cityId is provided
neighborhoodSchema.pre('validate', function() {
  if (!this.boroughId && !this.cityId) {
    this.invalidate('boroughId', 'Either boroughId or cityId is required');
  }
  if (this.boroughId && this.cityId) {
    this.invalidate('cityId', 'Cannot have both boroughId and cityId');
  }
});

// Indexes for better query performance
neighborhoodSchema.index({ name: 1, boroughId: 1 }, { unique: true, sparse: true });
neighborhoodSchema.index({ name: 1, cityId: 1 }, { unique: true, sparse: true });
neighborhoodSchema.index({ boroughId: 1 });
neighborhoodSchema.index({ cityId: 1 });
neighborhoodSchema.index({ city: 1 }); // Legacy field

// Method to get visit statistics
neighborhoodSchema.methods.getVisitStats = async function() {
  const Visit = mongoose.model('Visit');
  return await Visit.find({ neighborhoodId: this._id.toString() });
};

// Method to calculate average rating from visits
neighborhoodSchema.methods.calculateAverageRating = async function() {
  const Visit = mongoose.model('Visit');
  const result = await Visit.aggregate([
    { $match: { neighborhoodId: this._id.toString(), rating: { $exists: true, $ne: null } } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  
  if (result.length > 0) {
    this.averageVisitRating = Math.round(result[0].avgRating * 10) / 10;
    this.totalVisits = result[0].count;
  } else {
    this.averageVisitRating = null;
    this.totalVisits = 0;
  }
  
  return this.save();
};

// Static method to find neighborhoods by borough
neighborhoodSchema.statics.findByBorough = function(boroughId) {
  return this.find({ boroughId: boroughId });
};

// Static method to find neighborhoods by cityId
neighborhoodSchema.statics.findByCityId = function(cityId) {
  return this.find({ cityId: cityId });
};

// Static method to find neighborhoods by city (legacy)
neighborhoodSchema.statics.findByCity = function(city) {
  return this.find({ city: city });
};

// Static method to find neighborhoods by name
neighborhoodSchema.statics.findByName = function(name) {
  return this.findOne({ name });
};

// Static method to find neighborhoods by name and city
neighborhoodSchema.statics.findByNameAndCity = function(name, city) {
  return this.findOne({ name, city });
};

// Static method to find neighborhoods by name and cityId
neighborhoodSchema.statics.findByNameAndCityId = function(name, cityId) {
  return this.findOne({ name, cityId });
};

module.exports = mongoose.model('Neighborhood', neighborhoodSchema);