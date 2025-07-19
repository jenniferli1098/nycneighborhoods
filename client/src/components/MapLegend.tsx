import React from 'react';
import { Box } from '@mui/material';

interface LegendItem {
  label: string;
  color: string;
}

interface MapLegendProps {
  legendItems: LegendItem[];
  unvisitedColor?: string;
  unvisitedLabel?: string;
  showInstructions?: boolean;
  isAuthenticated?: boolean;
}

const MapLegend: React.FC<MapLegendProps> = ({
  legendItems,
  unvisitedColor = '#E8E8E8',
  unvisitedLabel = 'Unvisited',
  showInstructions = true,
  isAuthenticated = false
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
    >
      {/* Legend */}
      <Box
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 2,
          p: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          minWidth: 160
        }}
      >
        <Box sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1, color: '#374151' }}>
          Legend
        </Box>
        
        {/* Dynamic legend items */}
        {legendItems.map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: item.color,
                borderRadius: 1,
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.label}</span>
          </Box>
        ))}
        
        {/* Unvisited item */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, pt: 1, borderTop: '1px solid #e5e7eb' }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              backgroundColor: unvisitedColor,
              borderRadius: 1,
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}
          />
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{unvisitedLabel}</span>
        </Box>
      </Box>

      {/* Instructions */}
      {showInstructions && isAuthenticated && (
        <Box
          sx={{
            backgroundColor: 'rgba(59, 130, 246, 0.95)',
            color: 'white',
            borderRadius: 2,
            p: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            fontSize: '0.75rem',
            maxWidth: 200
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>How to Use:</div>
          <div>• Left click: Quick visit</div>
          <div>• Right click: Detailed form</div>
        </Box>
      )}
    </Box>
  );
};

export default MapLegend;