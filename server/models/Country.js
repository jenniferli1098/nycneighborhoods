const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    minlength: 2,
    maxlength: 3
  },
  continent: {
    type: String,
    required: true,
    trim: true
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

// Indexes for better query performance
countrySchema.index({ name: 1 }, { unique: true });
countrySchema.index({ code: 1 }, { unique: true });
countrySchema.index({ continent: 1 });

// Method to get visit statistics
countrySchema.methods.getVisitStats = async function() {
  const Visit = mongoose.model('Visit');
  return await Visit.find({ countryId: this._id.toString() });
};

// Method to calculate average rating from visits
countrySchema.methods.calculateAverageRating = async function() {
  const Visit = mongoose.model('Visit');
  const result = await Visit.aggregate([
    { $match: { countryId: this._id.toString(), rating: { $exists: true, $ne: null } } },
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

// Static method to find countries by continent
countrySchema.statics.findByContinent = function(continent) {
  return this.find({ continent: continent });
};

// Static method to find countries by name
countrySchema.statics.findByName = function(name) {
  return this.findOne({ name });
};

// Static method to find countries by code
countrySchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() });
};

module.exports = mongoose.model('Country', countrySchema);