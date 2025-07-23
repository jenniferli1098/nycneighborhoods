const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Country = require('../models/Country');

// Country data extracted from country_names.csv - comprehensive list of 212 countries
const countriesData = [
  { name: 'Algeria', code: 'DZ', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Angola', code: 'AO', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Benin', code: 'BJ', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Botswana', code: 'BW', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Burkina Faso', code: 'BF', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Burundi', code: 'BI', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Cameroon', code: 'CM', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Cape Verde', code: 'CV', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Central African Republic', code: 'CF', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Chad', code: 'TD', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Comoros', code: 'KM', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Democratic Republic of the Congo', code: 'CD', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Republic of the Congo', code: 'CG', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Djibouti', code: 'DJ', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Egypt', code: 'EG', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Equatorial Guinea', code: 'GQ', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Eritrea', code: 'ER', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Ethiopia', code: 'ET', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Gabon', code: 'GA', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Gambia', code: 'GM', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Ghana', code: 'GH', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Guinea', code: 'GN', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Guinea-Bissau', code: 'GW', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Ivory Coast', code: 'CI', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Kenya', code: 'KE', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Lesotho', code: 'LS', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Liberia', code: 'LR', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Libya', code: 'LY', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Madagascar', code: 'MG', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Malawi', code: 'MW', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Mali', code: 'ML', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Mauritania', code: 'MR', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Mauritius', code: 'MU', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Morocco', code: 'MA', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Mozambique', code: 'MZ', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Namibia', code: 'NA', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Niger', code: 'NE', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Nigeria', code: 'NG', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Rwanda', code: 'RW', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'São Tomé and Príncipe', code: 'ST', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Senegal', code: 'SN', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Seychelles', code: 'SC', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Sierra Leone', code: 'SL', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Somalia', code: 'SO', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'South Africa', code: 'ZA', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'South Sudan', code: 'SS', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Sudan', code: 'SD', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Swaziland', code: 'SZ', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Tanzania', code: 'TZ', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Togo', code: 'TG', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Tunisia', code: 'TN', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Uganda', code: 'UG', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Zambia', code: 'ZM', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Zimbabwe', code: 'ZW', continent: 'Africa', description: 'A country in Africa.' },
  { name: 'Afghanistan', code: 'AF', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Bahrain', code: 'BH', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Bangladesh', code: 'BD', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Bhutan', code: 'BT', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Brunei', code: 'BN', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Cambodia', code: 'KH', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'China', code: 'CN', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Hong Kong', code: 'HK', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'India', code: 'IN', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Indonesia', code: 'ID', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Iran', code: 'IR', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Iraq', code: 'IQ', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Israel', code: 'IL', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Japan', code: 'JP', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Jordan', code: 'JO', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'North Korea', code: 'KP', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'South Korea', code: 'KR', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Kuwait', code: 'KW', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Kyrgyzstan', code: 'KG', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Laos', code: 'LA', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Lebanon', code: 'LB', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Macao', code: 'MO', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Malaysia', code: 'MY', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Maldives', code: 'MV', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Mongolia', code: 'MN', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Myanmar', code: 'MM', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Nepal', code: 'NP', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Oman', code: 'OM', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Pakistan', code: 'PK', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Palestine', code: 'PS', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Philippines', code: 'PH', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Qatar', code: 'QA', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Saudi Arabia', code: 'SA', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Singapore', code: 'SG', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Sri Lanka', code: 'LK', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Syria', code: 'SY', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Taiwan', code: 'TW', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Tajikistan', code: 'TJ', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Thailand', code: 'TH', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Timor-Leste', code: 'TL', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Turkmenistan', code: 'TM', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'United Arab Emirates', code: 'AE', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Uzbekistan', code: 'UZ', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Vietnam', code: 'VN', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Yemen', code: 'YE', continent: 'Asia', description: 'A country in Asia.' },
  { name: 'Albania', code: 'AL', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Andorra', code: 'AD', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Armenia', code: 'AM', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Austria', code: 'AT', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Azerbaijan', code: 'AZ', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Belarus', code: 'BY', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Belgium', code: 'BE', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Bosnia and Herzegovina', code: 'BA', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Bulgaria', code: 'BG', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Croatia', code: 'HR', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Cyprus', code: 'CY', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Czech Republic', code: 'CZ', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Denmark', code: 'DK', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Estonia', code: 'EE', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Finland', code: 'FI', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'France', code: 'FR', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Georgia', code: 'GE', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Germany', code: 'DE', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Greece', code: 'GR', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Hungary', code: 'HU', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Iceland', code: 'IS', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Ireland', code: 'IE', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Italy', code: 'IT', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Kazakhstan', code: 'KZ', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Latvia', code: 'LV', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Liechtenstein', code: 'LI', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Lithuania', code: 'LT', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Luxembourg', code: 'LU', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'North Macedonia', code: 'MK', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Malta', code: 'MT', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Moldova', code: 'MD', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Monaco', code: 'MC', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Montenegro', code: 'ME', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Netherlands', code: 'NL', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Norway', code: 'NO', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Poland', code: 'PL', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Portugal', code: 'PT', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Romania', code: 'RO', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Russia', code: 'RU', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'San Marino', code: 'SM', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Serbia', code: 'RS', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Slovakia', code: 'SK', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Slovenia', code: 'SI', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Spain', code: 'ES', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Sweden', code: 'SE', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Switzerland', code: 'CH', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Turkey', code: 'TR', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Ukraine', code: 'UA', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'United Kingdom', code: 'GB', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Vatican City', code: 'VA', continent: 'Europe', description: 'A country in Europe.' },
  { name: 'Antigua and Barbuda', code: 'AG', continent: 'North America', description: 'A country in North America.' },
  { name: 'Bahamas', code: 'BS', continent: 'North America', description: 'A country in North America.' },
  { name: 'Barbados', code: 'BB', continent: 'North America', description: 'A country in North America.' },
  { name: 'Belize', code: 'BZ', continent: 'North America', description: 'A country in North America.' },
  { name: 'Canada', code: 'CA', continent: 'North America', description: 'A country in North America.' },
  { name: 'Costa Rica', code: 'CR', continent: 'North America', description: 'A country in North America.' },
  { name: 'Cuba', code: 'CU', continent: 'North America', description: 'A country in North America.' },
  { name: 'Dominica', code: 'DM', continent: 'North America', description: 'A country in North America.' },
  { name: 'Dominican Republic', code: 'DO', continent: 'North America', description: 'A country in North America.' },
  { name: 'El Salvador', code: 'SV', continent: 'North America', description: 'A country in North America.' },
  { name: 'Grenada', code: 'GD', continent: 'North America', description: 'A country in North America.' },
  { name: 'Guatemala', code: 'GT', continent: 'North America', description: 'A country in North America.' },
  { name: 'Haiti', code: 'HT', continent: 'North America', description: 'A country in North America.' },
  { name: 'Honduras', code: 'HN', continent: 'North America', description: 'A country in North America.' },
  { name: 'Jamaica', code: 'JM', continent: 'North America', description: 'A country in North America.' },
  { name: 'Mexico', code: 'MX', continent: 'North America', description: 'A country in North America.' },
  { name: 'Nicaragua', code: 'NI', continent: 'North America', description: 'A country in North America.' },
  { name: 'Panama', code: 'PA', continent: 'North America', description: 'A country in North America.' },
  { name: 'Saint Kitts and Nevis', code: 'KN', continent: 'North America', description: 'A country in North America.' },
  { name: 'Saint Lucia', code: 'LC', continent: 'North America', description: 'A country in North America.' },
  { name: 'Saint Vincent and the Grenadines', code: 'VC', continent: 'North America', description: 'A country in North America.' },
  { name: 'Trinidad and Tobago', code: 'TT', continent: 'North America', description: 'A country in North America.' },
  { name: 'United States', code: 'US', continent: 'North America', description: 'A country in North America.' },
  { name: 'Australia', code: 'AU', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'Fiji', code: 'FJ', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'Kiribati', code: 'KI', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'Marshall Islands', code: 'MH', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'Micronesia', code: 'FM', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'Nauru', code: 'NR', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'New Zealand', code: 'NZ', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'Palau', code: 'PW', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'Papua New Guinea', code: 'PG', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'Samoa', code: 'WS', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'Solomon Islands', code: 'SB', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'Tonga', code: 'TO', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'Tuvalu', code: 'TV', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'Vanuatu', code: 'VU', continent: 'Oceania', description: 'A country in Oceania.' },
  { name: 'Argentina', code: 'AR', continent: 'South America', description: 'A country in South America.' },
  { name: 'Bolivia', code: 'BO', continent: 'South America', description: 'A country in South America.' },
  { name: 'Brazil', code: 'BR', continent: 'South America', description: 'A country in South America.' },
  { name: 'Chile', code: 'CL', continent: 'South America', description: 'A country in South America.' },
  { name: 'Colombia', code: 'CO', continent: 'South America', description: 'A country in South America.' },
  { name: 'Ecuador', code: 'EC', continent: 'South America', description: 'A country in South America.' },
  { name: 'Guyana', code: 'GY', continent: 'South America', description: 'A country in South America.' },
  { name: 'Paraguay', code: 'PY', continent: 'South America', description: 'A country in South America.' },
  { name: 'Peru', code: 'PE', continent: 'South America', description: 'A country in South America.' },
  { name: 'Suriname', code: 'SR', continent: 'South America', description: 'A country in South America.' },
  { name: 'Uruguay', code: 'UY', continent: 'South America', description: 'A country in South America.' },
  { name: 'Venezuela', code: 'VE', continent: 'South America', description: 'A country in South America.' }
];

async function populateCountries() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nycneighborhoods');
    console.log('Connected to MongoDB');

    // Clear existing countries
    console.log('Clearing existing countries...');
    await Country.deleteMany({});

    console.log(`Starting to populate ${countriesData.length} countries...`);

    // Create countries
    let created = 0;
    for (const countryData of countriesData) {
      try {
        const country = new Country({
          name: countryData.name,
          code: countryData.code,
          continent: countryData.continent,
          description: countryData.description,
          averageVisitRating: null,
          totalVisits: 0
        });
        
        await country.save();
        created++;
        console.log(`Created country: ${countryData.name} (${countryData.code}) - ${countryData.continent}`);
      } catch (error) {
        console.error(`Error creating country ${countryData.name}:`, error.message);
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Countries created: ${created}`);

    // Get continent summary
    const continentCounts = await Country.aggregate([
      { $group: { _id: '$continent', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\nCountries by continent:');
    continentCounts.forEach(continent => {
      console.log(`  ${continent._id}: ${continent.count} countries`);
    });

    // Verify the data
    const totalCountries = await Country.countDocuments();
    console.log(`\nVerification: ${totalCountries} countries in database`);

  } catch (error) {
    console.error('Error populating countries:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populateCountries();