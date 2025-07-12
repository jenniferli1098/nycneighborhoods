const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, '../../public/data/country_names.csv');
const csvData = fs.readFileSync(csvPath, 'utf8');

// Parse CSV data
const lines = csvData.trim().split('\n');
const headers = lines[0].split(',');

console.log('CSV Headers:', headers);
console.log(`Total lines: ${lines.length - 1} (excluding header)`);

// Extract countries from CSV
const countries = [];
const seenCountries = new Set(); // To avoid duplicates

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  // Parse CSV line (handling quoted fields)
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim()); // Add the last field
  
  if (fields.length >= 4) {
    const [continentName, continentCode, countryName, twoLetterCode, threeLetterCode] = fields;
    
    // Skip certain entries
    if (!countryName || !twoLetterCode || twoLetterCode === '' || 
        countryName.includes('Neutral Zone') || 
        countryName.includes('Disputed Territory') ||
        countryName.includes('Antarctica') ||
        countryName.includes('Bouvet Island') ||
        countryName.includes('Heard Island') ||
        countryName.includes('French Southern') ||
        continentName === 'Antarctica' ||
        continentName === 'AN') {
      continue;
    }
    
    // Clean up country name (remove formal titles)
    let cleanName = countryName.replace(/^"|"$/g, ''); // Remove quotes
    cleanName = cleanName.replace(/, [^,]*Republic[^,]*$/i, '');
    cleanName = cleanName.replace(/, [^,]*Kingdom[^,]*$/i, '');
    cleanName = cleanName.replace(/, [^,]*State[^,]*$/i, '');
    cleanName = cleanName.replace(/, [^,]*Principality[^,]*$/i, '');
    cleanName = cleanName.replace(/, [^,]*Federation[^,]*$/i, '');
    cleanName = cleanName.replace(/, [^,]*Commonwealth[^,]*$/i, '');
    cleanName = cleanName.replace(/, [^,]*Union[^,]*$/i, '');
    cleanName = cleanName.replace(/, [^,]*Confederation[^,]*$/i, '');
    cleanName = cleanName.replace(/, [^,]*Territory[^,]*$/i, '');
    cleanName = cleanName.replace(/, Islamic Republic of$/i, '');
    cleanName = cleanName.replace(/, People\'s Democratic Republic of$/i, '');
    cleanName = cleanName.replace(/, Democratic Socialist Republic of$/i, '');
    cleanName = cleanName.replace(/, Federative Republic of$/i, '');
    cleanName = cleanName.replace(/, Co-operative Republic of$/i, '');
    cleanName = cleanName.replace(/, Special Administrative Region.*$/i, '');
    cleanName = cleanName.replace(/^The /i, '');
    
    // Handle specific name mappings
    const nameMap = {
      'United States of America': 'United States',
      'United Kingdom of Great Britain & Northern Ireland': 'United Kingdom',
      'Russian Federation': 'Russia',
      'Korea, Republic of': 'South Korea',
      'Korea, Democratic People\'s Republic of': 'North Korea',
      'Macedonia, The Former Yugoslav Republic of': 'North Macedonia',
      'Cote d\'Ivoire': 'Ivory Coast',
      'Congo, Democratic Republic of the': 'Democratic Republic of the Congo',
      'Congo, Republic of the': 'Republic of the Congo',
      'Tanzania, United Republic of': 'Tanzania',
      'Libyan Arab Jamahiriya': 'Libya',
      'Sao Tome and Principe': 'São Tomé and Príncipe'
    };
    
    if (nameMap[cleanName]) {
      cleanName = nameMap[cleanName];
    }
    
    // Map continent codes to full names
    const continentMap = {
      'AF': 'Africa',
      'AS': 'Asia', 
      'EU': 'Europe',
      'NA': 'North America',
      'SA': 'South America',
      'OC': 'Oceania',
      'AN': 'Antarctica'
    };
    
    const continentFullName = continentMap[continentCode] || continentName;
    
    // Skip if we've already seen this country (handles duplicates)
    const countryKey = `${cleanName}-${twoLetterCode}`;
    if (seenCountries.has(countryKey)) {
      continue;
    }
    seenCountries.add(countryKey);
    
    // Skip small territories and dependencies for main country list
    const skipTerritories = [
      'Guernsey', 'Jersey', 'Isle of Man', 'Faroe Islands', 'Åland Islands',
      'American Samoa', 'Guam', 'Northern Mariana Islands', 'Puerto Rico',
      'United States Virgin Islands', 'British Virgin Islands', 'Cayman Islands',
      'Turks and Caicos Islands', 'Bermuda', 'Anguilla', 'Montserrat',
      'Saint Pierre and Miquelon', 'Saint Barthelemy', 'Saint Martin',
      'Martinique', 'Guadeloupe', 'French Guiana', 'French Polynesia',
      'New Caledonia', 'Wallis and Futuna', 'Mayotte', 'Reunion',
      'Christmas Island', 'Cocos (Keeling) Islands', 'Norfolk Island',
      'Cook Islands', 'Niue', 'Tokelau', 'Pitcairn Islands',
      'Falkland Islands (Malvinas)', 'South Georgia and the South Sandwich Islands',
      'Svalbard & Jan Mayen Islands'
    ];
    
    if (skipTerritories.includes(cleanName)) {
      continue;
    }
    
    countries.push({
      name: cleanName,
      code: twoLetterCode,
      continent: continentFullName,
      description: `A country in ${continentFullName}.`
    });
  }
}

// Sort by continent then by name
countries.sort((a, b) => {
  if (a.continent !== b.continent) {
    return a.continent.localeCompare(b.continent);
  }
  return a.name.localeCompare(b.name);
});

console.log(`\nExtracted ${countries.length} countries:`);

// Generate JavaScript array for the population script
console.log('\n// Generated country data from CSV');
console.log('const countriesData = [');

countries.forEach(country => {
  console.log(`  { name: '${country.name}', code: '${country.code}', continent: '${country.continent}', description: '${country.description}' },`);
});

console.log('];');

// Summary by continent
const continentCounts = {};
countries.forEach(country => {
  continentCounts[country.continent] = (continentCounts[country.continent] || 0) + 1;
});

console.log(`\n// Summary: ${countries.length} countries total`);
console.log('\n// Countries by continent:');
Object.entries(continentCounts).sort().forEach(([continent, count]) => {
  console.log(`// ${continent}: ${count} countries`);
});

// Export for use in other scripts
module.exports = { countries, continentCounts };