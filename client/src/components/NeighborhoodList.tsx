import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, Search } from '@mui/icons-material';

interface Neighborhood {
  _id: string;
  name: string;
  boroughId: string;
  description?: string;
  walkabilityScore?: number;
  averageVisitRating?: number;
  totalVisits?: number;
}

interface Visit {
  _id: string;
  userId: string;
  neighborhoodId: string;
  visited: boolean;
  notes: string;
  visitDate: string;
  rating: number;
  walkabilityScore: number;
}

interface Borough {
  _id: string;
  name: string;
  description?: string;
}

interface NeighborhoodListProps {
  neighborhoods: Neighborhood[];
  boroughs: Borough[];
  visits: Visit[];
  onNeighborhoodClick: (neighborhood: string, borough: string) => void;
}

const NeighborhoodList: React.FC<NeighborhoodListProps> = ({ neighborhoods, boroughs, visits, onNeighborhoodClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBorough, setSelectedBorough] = useState('');
  const [filterVisited, setFilterVisited] = useState('all');

  const visitedSet = new Set(visits.filter(v => v.visited).map(v => v.neighborhoodId));
  
  // Create a mapping from borough ID to borough name
  const boroughIdToName = new Map(boroughs.map(b => [b._id, b.name]));

  const filteredNeighborhoods = neighborhoods.filter(neighborhood => {
    const name = neighborhood.name;
    const boroughName = boroughIdToName.get(neighborhood.boroughId) || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBorough = selectedBorough === '' || boroughName === selectedBorough;
    
    let matchesVisited = true;
    if (filterVisited === 'visited') {
      matchesVisited = visitedSet.has(neighborhood._id);
    } else if (filterVisited === 'not-visited') {
      matchesVisited = !visitedSet.has(neighborhood._id);
    }
    
    return matchesSearch && matchesBorough && matchesVisited;
  });

  console.log('🏘️ NeighborhoodList: Total neighborhoods:', neighborhoods.length);
  console.log('🔍 NeighborhoodList: Filtered neighborhoods:', filteredNeighborhoods.length);

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      maxHeight: '100%'
    }}>
      <Box sx={{ 
        padding: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        flexShrink: 0,
        backgroundColor: 'white'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search neighborhoods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Borough</InputLabel>
              <Select
                value={selectedBorough}
                onChange={(e) => setSelectedBorough(e.target.value)}
                label="Borough"
              >
                <MenuItem value="">All</MenuItem>
                {boroughs.map(borough => (
                  <MenuItem key={borough._id} value={borough.name}>
                    {borough.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterVisited}
                onChange={(e) => setFilterVisited(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="visited">Visited</MenuItem>
                <MenuItem value="not-visited">Not Visited</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        minHeight: 0,
        maxHeight: 'calc(100vh - 300px)', // Reserve space for AppBar and StatsCard
        backgroundColor: 'white',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#c1c1c1',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#a8a8a8',
        },
      }}>
        <List dense>
          {filteredNeighborhoods.map((neighborhood) => {
            const name = neighborhood.name;
            const boroughName = boroughIdToName.get(neighborhood.boroughId) || '';
            const isVisited = visitedSet.has(neighborhood._id);
            
            return (
              <ListItem
                key={neighborhood._id}
                onClick={() => onNeighborhoodClick(name, boroughName)}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer py-2"
              >
                <ListItemIcon className="min-w-0 mr-2">
                  {isVisited ? (
                    <CheckCircle className="text-green-500 text-lg" />
                  ) : (
                    <RadioButtonUnchecked className="text-gray-400 text-lg" />
                  )}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Typography variant="body2" className="font-medium">
                      {name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {boroughName}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

export default NeighborhoodList;