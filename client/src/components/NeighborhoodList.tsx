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
import type { Visit } from '../services/visitsApi';
import type { CachedNeighborhood, CachedBorough, CachedCity } from '../services/neighborhoodCache';
import type { CategoryType } from '../config/mapConfigs';

interface NeighborhoodListProps {
  neighborhoods: CachedNeighborhood[];
  categories: (CachedBorough | CachedCity)[];
  categoryType: CategoryType;
  visits: Visit[];
  onNeighborhoodClick: (neighborhood: string, category: string) => void;
}

const NeighborhoodList: React.FC<NeighborhoodListProps> = ({ neighborhoods, categories, categoryType, visits, onNeighborhoodClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterVisited, setFilterVisited] = useState('all');

  const visitedSet = new Set(visits.filter(v => v.visited && v.neighborhoodId).map(v => v.neighborhoodId!));
  
  // Create a mapping from category ID to category name (works for both boroughs and cities)
  const categoryIdToName = new Map(categories.map(c => [c.id, c.name]));

  const filteredNeighborhoods = neighborhoods.filter(neighborhood => {
    const name = neighborhood.name;
    const categoryId = categoryType === 'borough' ? neighborhood.boroughId : neighborhood.cityId;
    const categoryName = categoryId ? categoryIdToName.get(categoryId) || '' : '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || categoryName === selectedCategory;
    
    let matchesVisited = true;
    if (filterVisited === 'visited') {
      matchesVisited = visitedSet.has(neighborhood.id);
    } else if (filterVisited === 'not-visited') {
      matchesVisited = !visitedSet.has(neighborhood.id);
    }
    
    return matchesSearch && matchesCategory && matchesVisited;
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
              <InputLabel>{categoryType === 'borough' ? 'Borough' : 'City'}</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label={categoryType === 'borough' ? 'Borough' : 'City'}
              >
                <MenuItem value="">All</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
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
            const categoryId = categoryType === 'borough' ? neighborhood.boroughId : neighborhood.cityId;
            const categoryName = categoryId ? categoryIdToName.get(categoryId) || '' : '';
            const isVisited = visitedSet.has(neighborhood.id);
            
            return (
              <ListItem
                key={neighborhood.id}
                onClick={() => onNeighborhoodClick(name, categoryName)}
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
                      {categoryName}
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