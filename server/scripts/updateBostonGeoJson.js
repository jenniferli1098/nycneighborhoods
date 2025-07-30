/**
 * Script to update Boston GeoJSON file to change "name" field to "neighborhood"
 * This standardizes the field name across all map GeoJSON files
 */

const fs = require('fs');
const path = require('path');

const updateBostonGeoJson = () => {
  try {
    console.log('📡 Loading Boston GeoJSON file...');
    
    // Read the existing file
    const filePath = path.join(__dirname, '../data/boston_cambridge_neighborhoods.geojson');
    const geoJsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    console.log(`📝 Found ${geoJsonData.features.length} features to update`);
    
    // Update each feature's properties
    let updatedCount = 0;
    geoJsonData.features.forEach((feature, index) => {
      if (feature.properties && feature.properties.name) {
        // Change "name" to "neighborhood"
        feature.properties.neighborhood = feature.properties.name;
        delete feature.properties.name;
        updatedCount++;
        
        if (index < 5) {
          console.log(`📝 Updated feature ${index + 1}: ${feature.properties.neighborhood} in ${feature.properties.city}`);
        }
      }
    });
    
    console.log(`✅ Updated ${updatedCount} features`);
    
    // Create backup of original file
    const backupPath = filePath + '.backup';
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(filePath, backupPath);
      console.log(`📁 Created backup at: ${backupPath}`);
    }
    
    // Write the updated file
    fs.writeFileSync(filePath, JSON.stringify(geoJsonData, null, 2));
    console.log(`✅ Successfully updated ${filePath}`);
    console.log('📝 Field "name" has been changed to "neighborhood" in all features');
    
    // Validate the changes
    const validationData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const hasNeighborhoodField = validationData.features.some(f => f.properties && f.properties.neighborhood);
    const hasNameField = validationData.features.some(f => f.properties && f.properties.name);
    
    console.log(`🔍 Validation: neighborhood field exists: ${hasNeighborhoodField}`);
    console.log(`🔍 Validation: name field exists: ${hasNameField}`);
    
    if (hasNeighborhoodField && !hasNameField) {
      console.log('🎉 Field update completed successfully!');
    } else {
      console.log('⚠️  Validation failed - please check the file manually');
    }
    
  } catch (error) {
    console.error('❌ Error updating Boston GeoJSON file:', error);
    process.exit(1);
  }
};

// Run the update
updateBostonGeoJson();