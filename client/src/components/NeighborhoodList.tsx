import React, { useState } from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
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
  const boroughNameToId = new Map(boroughs.map(b => [b.name, b._id]));

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

  const visitedCount = visitedSet.size;
  const totalCount = neighborhoods.length;

  return (
    <Paper elevation={3} className="sticky top-4 h-[calc(100vh-120px)] flex flex-col">
      <Box className="p-4 border-b sticky top-0 bg-white z-10">
        <Typography variant="h6" className="mb-2">
          NYC Neighborhoods
        </Typography>
        <Typography variant="body2" color="text.secondary" className="mb-4">
          {visitedCount} of {totalCount} neighborhoods visited
        </Typography>
        
        <Box className="space-y-3">
          <TextField
            fullWidth
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
          
          <Box className="flex gap-2">
            <FormControl size="small" className="min-w-48">
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
            
            <FormControl size="small" className="min-w-32">
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
      
      <Box className="flex-1 overflow-auto">
        <List>
          {filteredNeighborhoods.map((neighborhood) => {
            const name = neighborhood.name;
            const boroughName = boroughIdToName.get(neighborhood.boroughId) || '';
            const isVisited = visitedSet.has(neighborhood._id);
            const visit = visits.find(v => v.neighborhoodId === neighborhood._id);
            
            return (
              <ListItem
                key={neighborhood._id}
                onClick={() => onNeighborhoodClick(name, boroughName)}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <ListItemIcon>
                  {isVisited ? (
                    <CheckCircle className="text-green-500" />
                  ) : (
                    <RadioButtonUnchecked className="text-gray-400" />
                  )}
                </ListItemIcon>
                
                <ListItemText
                  primary={name}
                  secondary={
                    <Box className="flex flex-col gap-1">
                      <Typography variant="body2" color="text.secondary">
                        {boroughName}
                      </Typography>
                      {visit && visit.notes && (
                        <Typography variant="body2" className="text-gray-600 line-clamp-2">
                          {visit.notes}
                        </Typography>
                      )}
                      {visit && (
                        <Box className="flex gap-1 flex-wrap">
                          {visit.rating && (
                            <Chip
                              label={`${visit.rating} stars`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {visit.walkabilityScore && (
                            <Chip
                              label={`Walk: ${visit.walkabilityScore}/100`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Paper>
  );
};

export default NeighborhoodList;