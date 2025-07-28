import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import {
  EmojiEvents,
  Star,
  ThumbDown,
  ExpandLess,
  ExpandMore,
  Refresh
} from '@mui/icons-material';
import { pairwiseApi, type RankingsResponse } from '../services/pairwiseApi';

interface RankingsListProps {
  visitType?: 'neighborhood' | 'country';
}

const RankingsList: React.FC<RankingsListProps> = ({ visitType }) => {
  const [rankings, setRankings] = useState<RankingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({
    Good: true,
    Mid: false,
    Bad: false
  });

  const categories = [
    { name: 'Good', label: 'Amazing Places', icon: EmojiEvents, color: '#22c55e', bgColor: '#dcfce7' },
    { name: 'Mid', label: 'Decent Places', icon: Star, color: '#f59e0b', bgColor: '#fef3c7' },
    { name: 'Bad', label: 'Disappointing Places', icon: ThumbDown, color: '#ef4444', bgColor: '#fee2e2' }
  ];

  useEffect(() => {
    loadRankings();
  }, [visitType]);

  const loadRankings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await pairwiseApi.getRankings(visitType);
      setRankings(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  const handleRebalance = async (category: 'Good' | 'Mid' | 'Bad') => {
    setLoading(true);
    setError(null);
    
    try {
      await pairwiseApi.rebalanceCategory({ category });
      await loadRankings(); // Reload rankings after rebalancing
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to rebalance category');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getLocationName = (item: any) => {
    if (item.neighborhoodId) {
      return item.neighborhoodId.name || 'Unknown Neighborhood';
    }
    if (item.countryId) {
      return item.countryId.name || 'Unknown Country';
    }
    return 'Unknown Location';
  };

  const getLocationDetails = (item: any) => {
    if (item.neighborhoodId) {
      const neighborhood = item.neighborhoodId;
      const borough = neighborhood.boroughId?.name;
      const city = neighborhood.cityId?.name;
      return borough || city || neighborhood.cityName || neighborhood.city || 'Unknown Area';
    }
    if (item.countryId) {
      return item.countryId.continent || 'Unknown Continent';
    }
    return 'Unknown';
  };

  const renderCategorySection = (category: typeof categories[0]) => {
    const categoryData = rankings?.[category.name as keyof RankingsResponse] || [];
    const isExpanded = expandedCategories[category.name];
    const Icon = category.icon;

    return (
      <Card key={category.name} sx={{ mb: 2 }}>
        <CardContent sx={{ p: 0 }}>
          {/* Category Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              cursor: 'pointer',
              backgroundColor: category.bgColor,
              '&:hover': { backgroundColor: category.bgColor, opacity: 0.8 }
            }}
            onClick={() => toggleCategory(category.name)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon sx={{ color: category.color, fontSize: 24 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: category.color }}>
                  {category.label}
                </Typography>
                <Typography variant="body2" sx={{ color: category.color, opacity: 0.8 }}>
                  {categoryData.length} places
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRebalance(category.name as 'Good' | 'Mid' | 'Bad');
                }}
                disabled={loading || categoryData.length < 2}
                sx={{ 
                  borderColor: category.color, 
                  color: category.color,
                  '&:hover': { borderColor: category.color, backgroundColor: category.bgColor }
                }}
              >
                Rebalance
              </Button>
              <IconButton size="small" sx={{ color: category.color }}>
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          </Box>

          {/* Category Content */}
          <Collapse in={isExpanded}>
            <Box sx={{ p: 2, pt: 0 }}>
              {categoryData.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: '#6b7280' }}>
                  <Typography variant="body2">
                    No {category.label.toLowerCase()} yet
                  </Typography>
                  <Typography variant="caption">
                    Places ranked in this category will appear here
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {categoryData
                    .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
                    .map((item: any, index: number) => (
                    <React.Fragment key={item._id}>
                      <ListItem
                        sx={{
                          px: 0,
                          py: 1,
                          '&:hover': { backgroundColor: '#f8fafc' }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  minWidth: 32,
                                  textAlign: 'center',
                                  backgroundColor: category.bgColor,
                                  color: category.color,
                                  borderRadius: '4px',
                                  py: 0.5
                                }}
                              >
                                #{index + 1}
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {getLocationName(item)}
                              </Typography>
                              <Chip
                                label={`${(item.rating || 0).toFixed(1)}`}
                                size="small"
                                sx={{
                                  backgroundColor: category.bgColor,
                                  color: category.color,
                                  fontWeight: 600
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                {getLocationDetails(item)}
                              </Typography>
                              {item.notes && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#6b7280',
                                    fontStyle: 'italic',
                                    display: 'block',
                                    mt: 0.5
                                  }}
                                >
                                  "{item.notes}"
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < categoryData.length - 1 && <Divider sx={{ ml: 5 }} />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  if (loading && !rankings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Your Rankings
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={loadRankings}
          disabled={loading}
          variant="outlined"
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab label="All" />
          <Tab label="Neighborhoods" />
          <Tab label="Countries" />
        </Tabs>
      </Box>

      {/* Rankings by Category */}
      {rankings && (
        <Box>
          {categories.map(category => renderCategorySection(category))}
        </Box>
      )}

      {rankings && Object.values(rankings).every(arr => arr.length === 0) && (
        <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
          <EmojiEvents sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            No rankings yet
          </Typography>
          <Typography variant="body2">
            Start ranking places to see them organized here by category
          </Typography>
        </Box>
      )}

      {loading && rankings && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
};

export default RankingsList;