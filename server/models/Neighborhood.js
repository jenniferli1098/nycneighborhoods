const mongoose = require('mongoose');

const neighborhoodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Reference to District (replaces borough and city)
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: true
  },
}, {
  timestamps: true
});

// No validation needed - district is always required

// Indexes for better query performance
neighborhoodSchema.index({ name: 1, district: 1 }, { unique: true });
neighborhoodSchema.index({ district: 1 });

// Method to get visit statistics
neighborhoodSchema.methods.getVisitStats = async function() {
  const Visit = mongoose.model('Visit');
  return await Visit.find({ neighborhood: this._id });
};


// Static method to find neighborhoods by district
neighborhoodSchema.statics.findByDistrict = function(district) {
  return this.find({ district: district });
};

// Static method to find neighborhoods by name
neighborhoodSchema.statics.findByName = function(name) {
  return this.findOne({ name });
};

// Static method to find neighborhoods by name and district
neighborhoodSchema.statics.findByNameAndDistrict = function(name, district) {
  return this.findOne({ name, district });
};

// Method to get the associated district
neighborhoodSchema.methods.getDistrict = async function() {
  if (!this.district) return null;
  const District = mongoose.model('District');
  return await District.findById(this.district);
};

module.exports = mongoose.model('Neighborhood', neighborhoodSchema);