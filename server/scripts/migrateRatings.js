const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Visit = require('../models/Visit');
const Neighborhood = require('../models/Neighborhood');
const Borough = require('../models/Borough');
const City = require('../models/City');
const Country = require('../models/Country');

// Elo utility functions (copied from client-side utils)
const ELO_CONFIG = {
  CATEGORY_RANGES: {
    Bad: { min: 800, max: 1200, display: '0.0 - 2.5' },
    Mid: { min: 1201, max: 1800, display: '2.6 - 6.0' },
    Good: { min: 1801, max: 2200, display: '6.1 - 10.0' }
  }
};

function convertLegacyRatingToElo(legacyRating, category) {
  const range = ELO_CONFIG.CATEGORY_RANGES[category];
  const categorySpan = range.max - range.min;
  
  let normalizedPosition;
  switch (category) {
    case 'Bad':
      normalizedPosition = legacyRating / 2.5; // 0-2.5 -> 0-1
      break;
    case 'Mid':
      normalizedPosition = (legacyRating - 2.6) / (6.0 - 2.6); // 2.6-6.0 -> 0-1
      break;
    case 'Good':
      normalizedPosition = (legacyRating - 6.1) / (10.0 - 6.1); // 6.1-10.0 -> 0-1
      break;
  }
  
  normalizedPosition = Math.max(0, Math.min(1, normalizedPosition));
  return Math.round(range.min + (normalizedPosition * categorySpan));
}

function convertEloToDisplayRating(eloRating, category) {
  const range = ELO_CONFIG.CATEGORY_RANGES[category];
  const normalizedPosition = (eloRating - range.min) / (range.max - range.min);
  
  switch (category) {
    case 'Bad':
      return normalizedPosition * 2.5;
    case 'Mid':
      return 2.6 + (normalizedPosition * (6.0 - 2.6));
    case 'Good':
      return 6.1 + (normalizedPosition * (10.0 - 6.1));
  }
}

async function migrateRatings() {
  try {
    console.log('🔄 Starting rating migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nycneighborhoods');
    console.log('📱 Connected to MongoDB');
    
    // Find all visits with ratings
    const visits = await Visit.find({ 
      rating: { $exists: true, $ne: null },
      category: { $exists: true, $ne: null }
    });
    
    console.log(`📊 Found ${visits.length} visits with ratings to migrate`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const visit of visits) {
      try {
        // Determine if this is already an Elo rating or legacy rating
        if (visit.rating > 100) {
          // Already Elo rating - convert to proper display rating
          const displayRating = convertEloToDisplayRating(visit.rating, visit.category);
          
          visit.eloRating = visit.rating;
          visit.rating = Math.round(displayRating * 10) / 10; // Round to 1 decimal
          visit.ratingType = 'elo';
          
          console.log(`✅ Converted Elo: Visit ${visit._id} - Elo: ${visit.eloRating} → Display: ${visit.rating}`);
        } else {
          // Legacy rating - convert to Elo and keep original as display
          const eloRating = convertLegacyRatingToElo(visit.rating, visit.category);
          
          visit.eloRating = eloRating;
          // Keep original rating as display rating
          visit.ratingType = 'elo'; // All new ratings will be Elo-based
          
          console.log(`🔄 Converted Legacy: Visit ${visit._id} - Display: ${visit.rating} → Elo: ${visit.eloRating}`);
        }
        
        // Use updateOne to bypass middleware during migration
        await Visit.updateOne(
          { _id: visit._id },
          { 
            eloRating: visit.eloRating, 
            rating: visit.rating, 
            ratingType: visit.ratingType 
          }
        );
        migrated++;
        
      } catch (error) {
        console.error(`❌ Error migrating visit ${visit._id}:`, error);
        errors++;
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migrated} visits`);
    console.log(`⏭️  Skipped: ${skipped} visits`);
    console.log(`❌ Errors: ${errors} visits`);
    
    // Verify migration
    const eloVisits = await Visit.countDocuments({ eloRating: { $exists: true, $ne: null } });
    const totalRatedVisits = await Visit.countDocuments({ rating: { $exists: true, $ne: null } });
    
    console.log(`\n🔍 Verification:`);
    console.log(`📊 Total visits with ratings: ${totalRatedVisits}`);
    console.log(`🎯 Visits with Elo ratings: ${eloVisits}`);
    console.log(`🎯 Coverage: ${((eloVisits / totalRatedVisits) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Check for dry run mode
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🏃‍♂️ DRY RUN MODE - No changes will be saved');
  // TODO: Implement dry run logic if needed
} else {
  console.log('🚀 LIVE MODE - Changes will be saved to database');
  migrateRatings();
}