import { useState, useCallback } from 'react';
import { mapsApi, type Map } from '../services/mapsApi';
import { type CachedNeighborhood, type CachedBorough, type CachedCity } from '../services/neighborhoodCache';

export interface MapAreaData {
  map: Map;
  neighborhoods: CachedNeighborhood[];
  categories: (CachedBorough | CachedCity)[];
  isLoaded: boolean;
}

export const useMapData = () => {
  const [mapAreas, setMapAreas] = useState<{ [key: string]: MapAreaData }>({});
  const [loading, setLoading] = useState(false);

  const loadMapNeighborhoods = useCallback(async (map: Map): Promise<CachedNeighborhood[]> => {
    try {
      const neighborhoods = await mapsApi.getMapNeighborhoods(map._id);
      
      return neighborhoods.map(n => ({
        id: n._id,
        name: n.name,
        districtId: n.district,
        boroughId: n.district,
        districtName: n.districtData?.name || 'Unknown',
        cityId: n.district,
        cityName: n.districtData?.name || 'Unknown',
        categoryType: n.districtData?.type || 'district',
        city: n.districtData?.name || 'Unknown'
      }));
    } catch (err) {
      console.error(`❌ Map API failed for ${map.name}:`, err);
      return [];
    }
  }, []);

  const loadMapCategories = useCallback(async (map: Map): Promise<(CachedBorough | CachedCity)[]> => {
    try {
      const districts = await mapsApi.getMapDistricts(map._id);
      return districts.map(d => ({
        id: d._id,
        name: d.name,
        cityId: d._id,
        city: d.name
      } as CachedBorough));
    } catch (err) {
      console.error(`❌ Map categories API failed for ${map.name}:`, err);
      return [];
    }
  }, []);

  const loadAllMapData = useCallback(async () => {
    setLoading(true);
    const areasData: { [key: string]: MapAreaData } = {};
    
    try {
      const maps = await mapsApi.getAllMaps();
      
      for (const map of maps) {
        try {
          const neighborhoods = await loadMapNeighborhoods(map);
          const categories = await loadMapCategories(map);
          
          areasData[map.name] = {
            map,
            neighborhoods,
            categories,
            isLoaded: true
          };
        } catch (error) {
          console.error(`❌ ${map.name} data loading failed:`, error);
          areasData[map.name] = {
            map,
            neighborhoods: [],
            categories: [],
            isLoaded: false
          };
        }
      }
    } catch (error) {
      console.error(`❌ Failed to load maps from API:`, error);
    }
    
    setMapAreas(areasData);
    setLoading(false);
  }, [loadMapCategories, loadMapNeighborhoods]);

  return {
    mapAreas,
    loading,
    loadAllMapData
  };
};