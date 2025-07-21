import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type Country } from '../services/countriesApi';

interface WorldMapProps {
  countries: any[]; // GeoJSON features
  visitedCountries: Set<string>; // Set of visited country IDs
  onCountryClick: (country: Country) => void; // Right-click for dialog
  onCountryQuickVisit: (country: Country) => void; // Left-click for quick visit
  availableCountries: Country[]; // Countries from API
}

const WorldMap: React.FC<WorldMapProps> = ({
  countries,
  visitedCountries,
  onCountryClick,
  onCountryQuickVisit,
  availableCountries
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([20, 0], 2);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !countries.length) return;

    // Remove existing GeoJSON layer
    if (geoJsonLayerRef.current) {
      mapInstanceRef.current.removeLayer(geoJsonLayerRef.current);
    }

    // Helper function to match GeoJSON country with API country
    const getApiCountry = (geoFeature: any): Country | null => {
      const geoName = geoFeature.properties?.name;
      const geoCode2 = geoFeature.properties?.['ISO3166-1-Alpha-2'];
      const geoCode3 = geoFeature.properties?.['ISO3166-1-Alpha-3'];

      // Try to match by name first, then by country code
      return availableCountries.find(country => {
        return (
          country.name === geoName ||
          country.code === geoCode2 ||
          country.code === geoCode3 ||
          // Handle common name variations
          (geoName === 'United States of America' && country.name === 'United States') ||
          (geoName === 'United Kingdom' && country.name === 'United Kingdom') ||
          (geoName === 'Russia' && country.name === 'Russia')
        );
      }) || null;
    };

    // Helper function to determine if a country is visited
    const isCountryVisited = (geoFeature: any): boolean => {
      const apiCountry = getApiCountry(geoFeature);
      return apiCountry ? visitedCountries.has(apiCountry._id) : false;
    };

    // Style function for countries
    const style = (feature: any) => {
      const isVisited = isCountryVisited(feature);
      return {
        fillColor: isVisited ? '#4caf50' : '#e0e0e0',
        weight: 1,
        opacity: 1,
        color: '#666',
        fillOpacity: isVisited ? 0.8 : 0.6
      };
    };

    // Event handlers
    const onEachFeature = (feature: any, layer: L.Layer) => {
      const apiCountry = getApiCountry(feature);
      const countryName = feature.properties?.name || 'Unknown Country';
      const isVisited = isCountryVisited(feature);

      // Create tooltip content (appears on hover)
      const tooltipContent = `
        <div style="text-align: center; font-size: 12px;">
          <strong>${countryName}</strong><br/>
          ${apiCountry ? `${apiCountry.continent}<br/>` : ''}
          <span style="color: ${isVisited ? '#4caf50' : '#dc3545'}; font-weight: bold;">
            ${isVisited ? '✓ Visited' : '✗ Not Visited'}
          </span><br/>
          <small style="color: #888;">Left: Quick visit | Right: Details</small>
        </div>
      `;

      // Bind tooltip that appears on hover, positioned above the mouse
      layer.bindTooltip(tooltipContent, {
        permanent: false,
        direction: 'top', // Position above the feature
        offset: [0, -10], // Move 10 pixels up from the default position
        opacity: 0.9,
        className: 'country-tooltip'
      });

      // Add click handlers (mirroring NYC neighborhoods behavior)
      layer.on({
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          if (apiCountry) {
            console.log('🖱️ WorldMap: Left-click (quick visit) for:', apiCountry.name);
            onCountryQuickVisit(apiCountry);
          }
        },
        contextmenu: (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e as any);
          L.DomEvent.preventDefault(e as any);
          if (apiCountry) {
            console.log('🖱️ WorldMap: Right-click (dialog) for:', apiCountry.name);
            onCountryClick(apiCountry);
          }
        },
        mouseover: (e) => {
          const layer = e.target;
          layer.setStyle({
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          });
          layer.bringToFront();
        },
        mouseout: (e) => {
          if (geoJsonLayerRef.current) {
            geoJsonLayerRef.current.resetStyle(e.target);
          }
        }
      });

      // Store reference for quick visit functionality
      if (apiCountry) {
        (layer as any)._countryData = apiCountry;
      }
    };

    // Create GeoJSON layer
    const geoJsonLayer = L.geoJSON(countries, {
      style,
      onEachFeature
    });

    geoJsonLayerRef.current = geoJsonLayer;
    geoJsonLayer.addTo(mapInstanceRef.current);

    // Cleanup
    return () => {
      if (geoJsonLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(geoJsonLayerRef.current);
      }
    };
  }, [countries, visitedCountries, availableCountries, onCountryClick, onCountryQuickVisit]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: '100%', 
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden'
      }} 
    />
  );
};

export default WorldMap;