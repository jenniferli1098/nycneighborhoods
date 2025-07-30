const mongoose = require('mongoose');

const neighborhoodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // For NYC neighborhoods - reference to Borough
  boroughId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borough'
  },
  // For other cities - reference to City  
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  },
  // Category type to determine organization structure
  categoryType: {
    type: String,
    required: true,
    enum: ['borough', 'city'],
    trim: true
  },
}, {
  timestamps: true
});

// Validation to ensure appropriate ID is provided based on categoryType
neighborhoodSchema.pre('validate', function() {
  if (!this.boroughId && !this.cityId) {
    this.invalidate('boroughId', 'Either boroughId or cityId is required');
  }
  if (this.boroughId && this.cityId) {
    this.invalidate('cityId', 'Cannot have both boroughId and cityId');
  }
  
  // Validate categoryType matches the provided ID field
  if (this.categoryType === 'borough' && !this.boroughId) {
    this.invalidate('boroughId', 'boroughId is required when categoryType is "borough"');
  }
  if (this.categoryType === 'city' && !this.cityId) {
    this.invalidate('cityId', 'cityId is required when categoryType is "city"');
  }
  if (this.categoryType === 'borough' && this.cityId) {
    this.invalidate('cityId', 'cityId should not be set when categoryType is "borough"');
  }
  if (this.categoryType === 'city' && this.boroughId) {
    this.invalidate('boroughId', 'boroughId should not be set when categoryType is "city"');
  }
});

// Indexes for better query performance
neighborhoodSchema.index({ name: 1, boroughId: 1 }, { unique: true, sparse: true });
neighborhoodSchema.index({ name: 1, cityId: 1 }, { unique: true, sparse: true });
neighborhoodSchema.index({ boroughId: 1 });
neighborhoodSchema.index({ cityId: 1 });
neighborhoodSchema.index({ categoryType: 1 });

// Method to get visit statistics
neighborhoodSchema.methods.getVisitStats = async function() {
  const Visit = mongoose.model('Visit');
  return await Visit.find({ neighborhoodId: this._id });
};


// Static method to find neighborhoods by borough
neighborhoodSchema.statics.findByBorough = function(boroughId) {
  return this.find({ boroughId: boroughId });
};

// Static method to find neighborhoods by cityId
neighborhoodSchema.statics.findByCityId = function(cityId) {
  return this.find({ cityId: cityId });
};

// Static method to find neighborhoods by name
neighborhoodSchema.statics.findByName = function(name) {
  return this.findOne({ name });
};

// Static method to find neighborhoods by name and cityId
neighborhoodSchema.statics.findByNameAndCityId = function(name, cityId) {
  return this.findOne({ name, cityId });
};

// Static method to find neighborhoods by categoryType
neighborhoodSchema.statics.findByCategoryType = function(categoryType) {
  return this.find({ categoryType });
};

// Static method to find borough-based neighborhoods
neighborhoodSchema.statics.findBoroughBased = function() {
  return this.find({ categoryType: 'borough' });
};

// Static method to find city-based neighborhoods  
neighborhoodSchema.statics.findCityBased = function() {
  return this.find({ categoryType: 'city' });
};

// Method to get the associated borough (for borough-based neighborhoods)
neighborhoodSchema.methods.getBorough = async function() {
  if (this.categoryType !== 'borough' || !this.boroughId) return null;
  const Borough = mongoose.model('Borough');
  return await Borough.findById(this.boroughId);
};

// Method to get the associated city (for city-based neighborhoods)
neighborhoodSchema.methods.getCity = async function() {
  if (this.categoryType !== 'city' || !this.cityId) return null;
  const City = mongoose.model('City');
  return await City.findById(this.cityId);
};

// Method to get the parent location (borough or city)
neighborhoodSchema.methods.getParentLocation = async function() {
  if (this.categoryType === 'borough') {
    return await this.getBorough();
  } else if (this.categoryType === 'city') {
    return await this.getCity();
  }
  return null;
};

module.exports = mongoose.model('Neighborhood', neighborhoodSchema);