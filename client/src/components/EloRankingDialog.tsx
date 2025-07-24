import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Fade,
  Slide,
  Zoom,
  Avatar,
  Paper
} from '@mui/material';
import {
  Psychology,
  EmojiEvents,
  Star,
  StarHalf,
  StarBorder,
  ThumbUp,
  ThumbDown,
  TrendingUp,
  Speed,
  Analytics,
  Celebration,
  Whatshot
} from '@mui/icons-material';
import {
  type CategoryType,
  type RankableItem,
  type EloRatingUpdate,
  getBaseCategoryRating,
  selectOptimalOpponents,
  getOptimalComparisonCount,
  processComparison,
  convertEloToDisplayRating,
  convertLegacyRatingToElo,
  ELO_CONFIG
} from '../utils/eloRanking';

export interface RankableEntity {
  name: string;
  location: string;
}

interface Visit {
  _id: string;
  visited: boolean;
  category: CategoryType | null;
  rating: number | null;
  neighborhoodId?: string;
  countryId?: string;
  notes?: string;
}

interface Neighborhood {
  id: string;
  name: string;
  boroughId?: string;
  cityId?: string;
  cityName?: string;
  city?: string;
}

interface Borough {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
}

interface Country {
  _id: string;
  name: string;
  continentId?: string;
  continent?: string;
}

interface Continent {
  _id: string;
  name: string;
}

interface EloRankingDialogProps {
  open: boolean;
  onClose: () => void;
  entity: RankableEntity;
  existingVisits: Visit[];
  neighborhoods?: Neighborhood[];
  boroughs?: Borough[];
  cities?: City[];
  countries?: Country[];
  continents?: Continent[];
  onRankingComplete: (category: CategoryType, eloRating: number, displayRating: number) => void;
}

const EloRankingDialog: React.FC<EloRankingDialogProps> = ({
  open,
  onClose,
  entity,
  existingVisits,
  neighborhoods = [],
  boroughs = [],
  cities = [],
  countries = [],
  continents = [],
  onRankingComplete
}) => {
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | ''>('');
  const [currentRating, setCurrentRating] = useState<number>(0);
  const [comparisonIndex, setComparisonIndex] = useState(0);
  const [selectedOpponents, setSelectedOpponents] = useState<RankableItem[]>([]);
  const [ratingUpdates, setRatingUpdates] = useState<EloRatingUpdate[]>([]);
  const [finalRating, setFinalRating] = useState<number | null>(null);

  const steps = ['Choose Category', 'Pairwise Comparison', 'Final Ranking'];

  const getComparisonsInCategory = (category: CategoryType): RankableItem[] => {
    // Create lookup maps for both neighborhoods/boroughs/cities and countries/continents
    const neighborhoodMap = new Map(neighborhoods.map(n => [n.id, n]));
    const boroughMap = new Map(boroughs.map(b => [b.id, b]));
    const cityMap = new Map(cities.map(c => [c.id, c]));
    const countryMap = new Map(countries.map(c => [c._id, c]));
    const continentMap = new Map(continents.map(c => [c._id, c]));
    
    return existingVisits
      .filter(v => v.visited && v.category === category && v.rating != null)
      .map(v => {
        const rating = v.rating!; // We know it's not null due to filter above
        const categoryTyped = v.category as CategoryType; // We know it's not null due to filter above
        // Check if this is a neighborhood or country visit
        if (v.neighborhoodId) {
          // Neighborhood visit - only include if neighborhood is in current area
          const neighborhoodData = neighborhoodMap.get(v.neighborhoodId);
          if (!neighborhoodData) {
            return null; // Not in current area, exclude from comparisons
          }
          
          // Additional safeguard: ensure neighborhood belongs to the same city/borough context
          const boroughData = neighborhoodData.boroughId ? boroughMap.get(neighborhoodData.boroughId) : null;
          const cityData = neighborhoodData.cityId ? cityMap.get(neighborhoodData.cityId) : null;
          
          // Only include if the neighborhood's borough or city is in our filtered data
          if (neighborhoodData.boroughId && !boroughData) {
            return null; // Borough not in current area
          }
          if (neighborhoodData.cityId && !cityData) {
            return null; // City not in current area
          }

          // Convert legacy rating to Elo if needed
          const eloRating = rating > 100 ? rating : convertLegacyRatingToElo(rating, category);
          
          return {
            _id: v.neighborhoodId,
            name: neighborhoodData.name,
            location: boroughData?.name || cityData?.name || neighborhoodData.cityName || neighborhoodData.city || 'Unknown',
            rating: eloRating,
            category: categoryTyped,
            notes: v.notes
          };
        } else if (v.countryId) {
          // Country visit - only include if country is in current area (if countries are filtered)
          const countryData = countryMap.get(v.countryId);
          if (!countryData) {
            return null; // Not in current area, exclude from comparisons
          }
          
          const continentData = countryData?.continentId ? continentMap.get(countryData.continentId) : null;

          // Convert legacy rating to Elo if needed
          const eloRating = rating > 100 ? rating : convertLegacyRatingToElo(rating, category);
          
          return {
            _id: v.countryId,
            name: countryData.name,
            location: continentData?.name || countryData.continent || 'Unknown',
            rating: eloRating,
            category: categoryTyped,
            notes: v.notes
          };
        } else {
          // Fallback - exclude unknown visit types from comparisons
          return null;
        }
      })
      .filter((comp): comp is NonNullable<typeof comp> => comp !== null) // Remove null entries with type guard
      .filter(comp => comp.name !== entity.name || comp.location !== entity.location) // Remove current entity if it exists
      .sort((a, b) => b.rating - a.rating);
  };

  const handleCategorySelect = (category: CategoryType) => {
    setSelectedCategory(category);
    const comparisons = getComparisonsInCategory(category);
    
    if (comparisons.length === 0) {
      // No existing items in this category, go directly to final step
      const baseRating = getBaseCategoryRating(category);
      setCurrentRating(baseRating);
      setFinalRating(baseRating);
      setStep(2);
    } else {
      // Initialize Elo-based comparison
      const baseRating = getBaseCategoryRating(category);
      setCurrentRating(baseRating);
      
      // Select optimal opponents for comparison
      const optimalCount = getOptimalComparisonCount(comparisons.length);
      const opponents = selectOptimalOpponents(comparisons, baseRating, optimalCount);
      setSelectedOpponents(opponents);
      setComparisonIndex(0);
      setRatingUpdates([]);
      setStep(1);
    }
  };

  const handlePairwiseComparison = (newItemWon: boolean) => {
    if (!selectedCategory || comparisonIndex >= selectedOpponents.length) return;
    
    const opponent = selectedOpponents[comparisonIndex];
    const result = processComparison(currentRating, opponent, newItemWon, selectedCategory);
    
    // Update current rating for new item
    setCurrentRating(result.newItemNewRating);
    
    // Store opponent update if rating changed
    if (result.opponentUpdate) {
      const visitUpdate = existingVisits.find(v => 
        v.neighborhoodId === opponent._id || v.countryId === opponent._id
      );
      
      if (visitUpdate) {
        const update: EloRatingUpdate = {
          ...result.opponentUpdate,
          visitId: visitUpdate._id
        };
        setRatingUpdates(prev => [...prev, update]);
      }
    }
    
    // Update opponent rating in selectedOpponents for display
    setSelectedOpponents(prev => 
      prev.map(opp => 
        opp._id === opponent._id 
          ? { ...opp, rating: result.opponentUpdate?.newRating || opp.rating }
          : opp
      )
    );
    
    // Move to next comparison or finalize
    if (comparisonIndex + 1 >= selectedOpponents.length) {
      setFinalRating(result.newItemNewRating);
      setStep(2);
    } else {
      setComparisonIndex(comparisonIndex + 1);
    }
  };

  const applyRatingUpdates = async (updates: EloRatingUpdate[]) => {
    console.log('🔄 EloRankingDialog: Applying rating updates:', updates);
    
    for (const update of updates) {
      try {
        await fetch(`/api/visits/${update.visitId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating: convertEloToDisplayRating(update.newRating, update.category),
            eloRating: update.newRating,
            category: update.category
          }),
        });
        console.log(`✅ Updated visit ${update.visitId}: ${update.oldRating} → ${update.newRating}`);
      } catch (error) {
        console.error(`❌ Failed to update visit ${update.visitId}:`, error);
      }
    }
  };

  const handleComplete = async () => {
    if (selectedCategory && finalRating !== null) {
      // Apply all rating updates first
      if (ratingUpdates.length > 0) {
        await applyRatingUpdates(ratingUpdates);
      }
      
      const displayRating = convertEloToDisplayRating(finalRating, selectedCategory);
      onRankingComplete(selectedCategory, finalRating, displayRating);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(0);
    setSelectedCategory('');
    setCurrentRating(0);
    setComparisonIndex(0);
    setSelectedOpponents([]);
    setRatingUpdates([]);
    setFinalRating(null);
    onClose();
  };

  const getCurrentOpponent = () => {
    return selectedOpponents[comparisonIndex];
  };

  const getDisplayRating = (eloRating: number, category: CategoryType) => {
    return convertEloToDisplayRating(eloRating, category);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 4,
          overflow: 'visible'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #400B8B 0%, #B07FF6 100%)',
        color: 'white',
        borderRadius: '16px 16px 0 0'
      }}>
        <Box>
          <Box className="flex items-center mb-3">
            <Avatar sx={{ 
              width: 40, 
              height: 40, 
              mr: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <Analytics />
            </Avatar>
            <Box>
              <Typography variant="h5" className="font-bold">
                Smart Ranking System
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {entity.name}, {entity.location}
              </Typography>
            </Box>
          </Box>
          <Paper sx={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            p: 2
          }}>
            <Stepper 
              activeStep={step} 
              alternativeLabel
              sx={{
                '& .MuiStepLabel-label': { 
                  color: 'white !important',
                  fontWeight: 'bold'
                },
                '& .MuiStepIcon-root': {
                  color: 'rgba(255, 255, 255, 0.3)',
                  '&.Mui-active': {
                    color: '#FEF504'
                  },
                  '&.Mui-completed': {
                    color: '#FEF504'
                  }
                }
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {step === 0 && (
          <Fade in={step === 0} timeout={500}>
            <Box>
              <Box className="text-center mb-4">
                <Avatar sx={{ 
                  width: 48, 
                  height: 48, 
                  mx: 'auto', 
                  mb: 2,
                  background: 'linear-gradient(45deg, #400B8B 30%, #B07FF6 90%)'
                }}>
                  <Analytics />
                </Avatar>
                <Typography variant="h6" className="mb-1 font-bold">
                  How would you categorize this place?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose the category that best describes your experience
                </Typography>
              </Box>
              
              <Box className="space-y-3">
                <Zoom in={step === 0} timeout={600}>
                  <Card 
                    className="cursor-pointer transition-all duration-300 hover:shadow-xl" 
                    onClick={() => handleCategorySelect('Good')}
                    sx={{
                      background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)',
                      border: '2px solid transparent',
                      '&:hover': {
                        border: '2px solid #4caf50',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 16px rgba(76, 175, 80, 0.15)'
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <Box className="flex items-center justify-between">
                        <Box className="flex items-center space-x-3">
                          <Avatar sx={{ 
                            background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                            width: 40,
                            height: 40
                          }}>
                            <Celebration />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" className="font-bold text-green-700 mb-1">
                              Amazing
                            </Typography>
                            <Typography variant="body2" color="text.secondary" className="mb-1">
                              Places you loved and would highly recommend
                            </Typography>
                            <Box className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} sx={{ color: '#4caf50', fontSize: 16 }} />
                              ))}
                            </Box>
                          </Box>
                        </Box>
                        <Chip 
                          label={ELO_CONFIG.CATEGORY_RANGES.Good.display} 
                          sx={{ 
                            background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>

                <Zoom in={step === 0} timeout={800}>
                  <Card 
                    className="cursor-pointer transition-all duration-300 hover:shadow-xl" 
                    onClick={() => handleCategorySelect('Mid')}
                    sx={{
                      background: 'linear-gradient(135deg, #fff8e1 0%, #fffde7 100%)',
                      border: '2px solid transparent',
                      '&:hover': {
                        border: '2px solid #ff9800',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(255, 152, 0, 0.15)'
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <Box className="flex items-center justify-between">
                        <Box className="flex items-center space-x-3">
                          <Avatar sx={{ 
                            background: 'linear-gradient(45deg, #ff9800 30%, #ffc107 90%)',
                            width: 40,
                            height: 40
                          }}>
                            <ThumbUp />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" className="font-bold text-orange-700 mb-1">
                              Decent
                            </Typography>
                            <Typography variant="body2" color="text.secondary" className="mb-1">
                              Solid places - nothing special but not bad
                            </Typography>
                            <Box className="flex items-center space-x-1">
                              {[...Array(3)].map((_, i) => (
                                <Star key={i} sx={{ color: '#ff9800', fontSize: 16 }} />
                              ))}
                              {[...Array(2)].map((_, i) => (
                                <StarBorder key={i + 3} sx={{ color: '#ff9800', fontSize: 16 }} />
                              ))}
                            </Box>
                          </Box>
                        </Box>
                        <Chip 
                          label={ELO_CONFIG.CATEGORY_RANGES.Mid.display} 
                          sx={{ 
                            background: 'linear-gradient(45deg, #ff9800 30%, #ffc107 90%)',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>

                <Zoom in={step === 0} timeout={1000}>
                  <Card 
                    className="cursor-pointer transition-all duration-300 hover:shadow-xl" 
                    onClick={() => handleCategorySelect('Bad')}
                    sx={{
                      background: 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)',
                      border: '2px solid transparent',
                      '&:hover': {
                        border: '2px solid #f44336',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(244, 67, 54, 0.15)'
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <Box className="flex items-center justify-between">
                        <Box className="flex items-center space-x-3">
                          <Avatar sx={{ 
                            background: 'linear-gradient(45deg, #f44336 30%, #e57373 90%)',
                            width: 40,
                            height: 40
                          }}>
                            <ThumbDown />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" className="font-bold text-red-700 mb-1">
                              Disappointing
                            </Typography>
                            <Typography variant="body2" color="text.secondary" className="mb-1">
                              Places you didn't enjoy or wouldn't recommend
                            </Typography>
                            <Box className="flex items-center space-x-1">
                              <Star sx={{ color: '#f44336', fontSize: 16 }} />
                              {[...Array(4)].map((_, i) => (
                                <StarBorder key={i + 1} sx={{ color: '#f44336', fontSize: 16 }} />
                              ))}
                            </Box>
                          </Box>
                        </Box>
                        <Chip 
                          label={ELO_CONFIG.CATEGORY_RANGES.Bad.display} 
                          sx={{ 
                            background: 'linear-gradient(45deg, #f44336 30%, #e57373 90%)',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Box>
            </Box>
          </Fade>
        )}

        {step === 1 && selectedCategory && selectedOpponents.length > 0 && (
          <Fade in={step === 1} timeout={500}>
            <Box>
              <Box className="text-center mb-4">
                <Avatar sx={{ 
                  width: 48, 
                  height: 48, 
                  mx: 'auto', 
                  mb: 2,
                  background: 'linear-gradient(45deg, #400B8B 30%, #B07FF6 90%)'
                }}>
                  <Psychology />
                </Avatar>
                <Typography variant="h6" className="mb-1 font-bold">
                  Smart Comparison
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mb-1">
                  Comparison {comparisonIndex + 1} of {selectedOpponents.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Using advanced Elo algorithm for precise ranking
                </Typography>
              </Box>

              {/* Enhanced Progress bar */}
              <Box className="mb-4">
                <Box className="flex justify-between items-center mb-1">
                  <Typography variant="caption" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedOpponents.length - comparisonIndex - 1} remaining
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(comparisonIndex / selectedOpponents.length) * 100}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#FEF504',
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
              
              <Box className="text-center mb-4">
                <Typography variant="subtitle1" className="mb-1 font-semibold">
                  Which place do you prefer?
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Click on the place you think is better
                </Typography>
              </Box>

              <Box className="flex gap-4 mb-4 items-center">
                {/* New item being ranked - clickable (LEFT SIDE) */}
                <Slide direction="right" in={step === 1} timeout={600}>
                  <Paper 
                    className="flex-1 cursor-pointer transition-all duration-300"
                    elevation={2}
                    onClick={() => handlePairwiseComparison(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #f3e5f5 0%, #e8eaf6 100%)',
                      border: '2px solid transparent',
                      borderRadius: 3,
                      '&:hover': {
                        border: '2px solid #400B8B',
                        transform: 'translateY(-4px) scale(1.02)',
                        boxShadow: '0 8px 16px rgba(64, 11, 139, 0.2)',
                        background: 'linear-gradient(135deg, #e1bee7 0%, #c5cae9 100%)'
                      }
                    }}
                  >
                    <CardContent className="text-center p-4">
                      <Avatar sx={{ 
                        width: 40, 
                        height: 40, 
                        mx: 'auto', 
                        mb: 2,
                        background: 'linear-gradient(45deg, #400B8B 30%, #B07FF6 90%)'
                      }}>
                        <Whatshot />
                      </Avatar>
                      <Typography variant="subtitle1" className="mb-1 font-bold">
                        {entity.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" className="mb-2 block">
                        {entity.location}
                      </Typography>
                      <Chip 
                        label={`~${getDisplayRating(currentRating, selectedCategory).toFixed(1)}`}
                        sx={{ 
                          background: 'linear-gradient(45deg, #400B8B 30%, #B07FF6 90%)',
                          color: 'white',
                          fontWeight: 'bold',
                          mb: 1,
                          fontSize: '0.75rem'
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" className="block">
                        New • Elo: {currentRating}
                      </Typography>
                    </CardContent>
                  </Paper>
                </Slide>

                <Box className="flex flex-col justify-center items-center">
                  <Avatar sx={{ 
                    width: 32, 
                    height: 32,
                    background: 'linear-gradient(45deg, #FEF504 30%, #FFC107 90%)',
                    mb: 1
                  }}>
                    <Speed sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography variant="subtitle2" className="text-gray-600 font-bold">
                    VS
                  </Typography>
                </Box>

                {/* Current comparison item - clickable (RIGHT SIDE) */}
                <Slide direction="left" in={step === 1} timeout={600}>
                  <Paper 
                    className="flex-1 cursor-pointer transition-all duration-300"
                    elevation={2}
                    onClick={() => handlePairwiseComparison(false)}
                    sx={{
                      background: 'linear-gradient(135deg, rgba(254, 245, 4, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)',
                      border: '2px solid transparent',
                      borderRadius: 3,
                      '&:hover': {
                        border: '2px solid #FEF504',
                        transform: 'translateY(-4px) scale(1.02)',
                        boxShadow: '0 8px 16px rgba(254, 245, 4, 0.2)',
                        background: 'linear-gradient(135deg, rgba(254, 245, 4, 0.2) 0%, rgba(255, 193, 7, 0.2) 100%)'
                      }
                    }}
                  >
                    <CardContent className="text-center p-4">
                      <Avatar sx={{ 
                        width: 40, 
                        height: 40, 
                        mx: 'auto', 
                        mb: 2,
                        background: 'linear-gradient(45deg, #FEF504 30%, #FFC107 90%)',
                        color: '#400B8B'
                      }}>
                        <TrendingUp />
                      </Avatar>
                      <Typography variant="subtitle1" className="mb-1 font-bold">
                        {getCurrentOpponent()?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" className="mb-2 block">
                        {getCurrentOpponent()?.location}
                      </Typography>
                      <Chip 
                        label={getDisplayRating(getCurrentOpponent()?.rating || 0, selectedCategory).toFixed(1)}
                        sx={{ 
                          background: 'linear-gradient(45deg, #FEF504 30%, #FFC107 90%)',
                          color: '#400B8B',
                          fontWeight: 'bold',
                          mb: 1,
                          fontSize: '0.75rem'
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" className="block">
                        Elo: {getCurrentOpponent()?.rating}
                      </Typography>
                      {getCurrentOpponent()?.notes && (
                        <Typography variant="caption" color="text.secondary" className="block mt-1 italic">
                          "{getCurrentOpponent()?.notes}"
                        </Typography>
                      )}
                    </CardContent>
                  </Paper>
                </Slide>
              </Box>

              <Box className="text-center">
                <Typography variant="caption" color="text.secondary">
                  💡 Tip: Your choice helps the algorithm learn your preferences
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}

        {step === 2 && selectedCategory && finalRating !== null && (
          <Fade in={step === 2} timeout={500}>
            <Box>
              <Box className="text-center mb-4">
                <Zoom in={step === 2} timeout={800}>
                  <Avatar sx={{ 
                    width: 56, 
                    height: 56, 
                    mx: 'auto', 
                    mb: 2,
                    background: 'linear-gradient(45deg, #FEF504 30%, #FFC107 90%)',
                    color: '#400B8B'
                  }}>
                    <EmojiEvents />
                  </Avatar>
                </Zoom>
                <Typography variant="h5" className="mb-1 font-bold">
                  Ranking Complete!
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mb-3">
                  Your place has been precisely ranked using the Elo algorithm
                </Typography>
              </Box>

              <Paper 
                elevation={3}
                sx={{ 
                  background: 'linear-gradient(135deg, #400B8B 0%, #B07FF6 100%)',
                  border: '2px solid #FEF504',
                  borderRadius: 3,
                  p: 3,
                  mb: 3,
                  color: 'white'
                }}
              >
                <Box className="text-center">
                  <Typography variant="h4" className="mb-2 font-bold" sx={{ color: '#FEF504' }}>
                    {getDisplayRating(finalRating, selectedCategory).toFixed(1)}
                  </Typography>
                  <Typography variant="h6" className="mb-1 font-semibold">
                    {entity.name}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} className="mb-2">
                    {entity.location}
                  </Typography>
                  <Chip 
                    label={selectedCategory}
                    sx={{ 
                      background: selectedCategory === 'Good' 
                        ? 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)'
                        : selectedCategory === 'Mid'
                        ? 'linear-gradient(45deg, #ff9800 30%, #ffc107 90%)'
                        : 'linear-gradient(45deg, #f44336 30%, #e57373 90%)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      px: 2,
                      py: 1
                    }}
                  />
                  <Typography variant="caption" sx={{ opacity: 0.8 }} className="mt-2 block">
                    Elo Rating: {finalRating} • From {selectedOpponents.length} comparisons
                  </Typography>
                </Box>
              </Paper>

              {selectedOpponents.length > 0 && (
                <Box>
                  <Box className="flex items-center mb-3">
                    <Avatar sx={{ 
                      width: 28, 
                      height: 28, 
                      mr: 2,
                      background: 'linear-gradient(45deg, #400B8B 30%, #B07FF6 90%)'
                    }}>
                      <TrendingUp sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography variant="subtitle1" className="font-bold">
                      Your {selectedCategory} Rankings
                    </Typography>
                  </Box>
                  <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Box className="max-h-48 overflow-y-auto">
                      {[...selectedOpponents, { 
                        _id: 'new', 
                        name: entity.name, 
                        location: entity.location, 
                        rating: finalRating, 
                        category: selectedCategory 
                      }]
                        .sort((a, b) => b.rating - a.rating)
                        .map((comp, index) => (
                          <Box
                            key={comp._id}
                            sx={{
                              background: comp._id === 'new' 
                                ? 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)'
                                : index % 2 === 0 ? '#fafafa' : 'white',
                              borderBottom: '1px solid #e0e0e0',
                              p: 3,
                              '&:last-child': { borderBottom: 'none' }
                            }}
                          >
                            <Box className="flex justify-between items-center">
                              <Box className="flex items-center gap-3">
                                <Avatar sx={{ 
                                  width: 36, 
                                  height: 36,
                                  background: comp._id === 'new' 
                                    ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                                    : `linear-gradient(45deg, #${(index * 40 + 100).toString(16)}${(index * 60 + 150).toString(16)}${(index * 80 + 200).toString(16)} 30%, #${(index * 50 + 120).toString(16)}${(index * 70 + 170).toString(16)}${(index * 90 + 220).toString(16)} 90%)`,
                                  fontSize: '1rem',
                                  fontWeight: 'bold',
                                  color: 'white'
                                }}>
                                  {index + 1}
                                </Avatar>
                                <Box>
                                  <Typography variant="body1" className={comp._id === 'new' ? 'font-bold' : 'font-medium'}>
                                    {comp.name}
                                    {comp._id === 'new' && (
                                      <Chip 
                                        label="NEW" 
                                        size="small" 
                                        sx={{ 
                                          ml: 1, 
                                          background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                                          color: 'white',
                                          fontWeight: 'bold'
                                        }} 
                                      />
                                    )}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {comp.location}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Elo: {comp.rating}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box className="text-right">
                                <Typography variant="h6" className="font-bold">
                                  {getDisplayRating(comp.rating, selectedCategory).toFixed(1)}
                                </Typography>
                                <Box className="flex items-center justify-end mt-1">
                                  {[...Array(5)].map((_, i) => {
                                    const rating = getDisplayRating(comp.rating, selectedCategory);
                                    const categoryMax = selectedCategory === 'Good' ? 10 : selectedCategory === 'Mid' ? 6 : 2.5;
                                    const stars = (rating / categoryMax) * 5;
                                    return (
                                      <Box key={i}>
                                        {i < Math.floor(stars) ? (
                                          <Star sx={{ color: '#ffc107', fontSize: 16 }} />
                                        ) : i < stars ? (
                                          <StarHalf sx={{ color: '#ffc107', fontSize: 16 }} />
                                        ) : (
                                          <StarBorder sx={{ color: '#e0e0e0', fontSize: 16 }} />
                                        )}
                                      </Box>
                                    );
                                  })}
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        ))}
                    </Box>
                  </Paper>
                </Box>
              )}

              {ratingUpdates.length > 0 && (
                <Box className="mt-4 text-center">
                  <Paper sx={{ 
                    background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)',
                    p: 2,
                    borderRadius: 2
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      ⚡ {ratingUpdates.length} other rating(s) will be automatically updated using the Elo algorithm
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '0 0 16px 16px',
        p: 3,
        gap: 2
      }}>
        {(step === 1 || step === 2) && (
          <Button 
            onClick={() => setStep(0)}
            variant="outlined"
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 'bold',
              borderColor: '#667eea',
              color: '#667eea',
              '&:hover': {
                borderColor: '#5a6fd8',
                background: 'rgba(102, 126, 234, 0.1)'
              }
            }}
          >
            Back to Categories
          </Button>
        )}
        <Button 
          onClick={handleClose}
          variant="outlined"
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 'bold',
            borderColor: '#9e9e9e',
            color: '#666',
            '&:hover': {
              borderColor: '#757575',
              background: 'rgba(158, 158, 158, 0.1)'
            }
          }}
        >
          Cancel
        </Button>
        {step === 2 && finalRating !== null && (
          <Button 
            onClick={handleComplete} 
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 'bold',
              px: 4,
              py: 1.5,
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #45a049 30%, #7cb342 90%)',
                boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)'
              }
            }}
          >
            Complete Ranking ✨
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EloRankingDialog;