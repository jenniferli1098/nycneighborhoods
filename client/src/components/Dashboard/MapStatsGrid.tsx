import React from 'react';
import { Box } from '@mui/material';
import StatsCard from '../StatsCard';
import CountriesStatsCard from './CountriesStatsCard';
import type { UserStats } from '../../hooks/useUserStats';
import type { MapAreaData } from '../../hooks/useMapData';
import type { Visit } from '../../services/visitsApi';
import type { Country } from '../../services/countriesApi';

interface MapStatsGridProps {
  stats: UserStats;
  allVisits: Visit[];
  countries: Country[];
  mapAreas: { [key: string]: MapAreaData };
  formatVisitName: (visit: Visit, countries: Country[]) => string;
}

const MapStatsGrid: React.FC<MapStatsGridProps> = ({ 
  stats, 
  allVisits, 
  countries, 
  mapAreas, 
  formatVisitName 
}) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, width: '100%', justifyContent: 'center' }}>
      {/* Countries StatsCard */}
      <Box sx={{ flex: '1 1 300px', maxWidth: Object.keys(mapAreas).length > 0 ? '400px' : '600px' }}>
        <CountriesStatsCard 
          stats={stats}
          countries={countries}
          formatVisitName={formatVisitName}
        />
      </Box>

      {/* Dynamic Neighborhood StatsCards for all configured maps */}
      {Object.entries(mapAreas)
        .filter(([, areaData]) => {
          return areaData.isLoaded && areaData.neighborhoods.length > 0 && areaData.categories.length > 0;
        })
        .map(([mapName, areaData]) => {
          return (
            <Box key={mapName} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
              <StatsCard
                visits={allVisits}
                neighborhoods={areaData.neighborhoods}
                districts={areaData.categories.map(cat => ({ _id: cat.id, name: cat.name, createdAt: '', updatedAt: '' }))}
                categoryType={areaData.map.type}
                areaName={areaData.map.name}
              />
            </Box>
          );
        })
      }
    </Box>
  );
};

export default MapStatsGrid;