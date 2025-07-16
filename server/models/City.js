const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    default: 'United States',
    trim: true
  },
  // For cases where a city might be part of a larger metropolitan area
  metropolitanArea: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique city names within a state
citySchema.index({ name: 1, state: 1 }, { unique: true });

// Method to calculate average rating for the city
citySchema.methods.calculateAverageRating = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  const neighborhoods = await Neighborhood.find({ cityId: this._id });
  
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

module.exports = mongoose.model('City', citySchema);