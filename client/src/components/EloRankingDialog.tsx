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
  IconButton,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Star,
  ThumbUp,
  ThumbDown,
  Close,
  Psychology,
  EmojiEvents
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

  const steps = ['Choose Category', 'Compare Places', 'Final Rating'];

  const getComparisonsInCategory = (category: CategoryType): RankableItem[] => {
    const neighborhoodMap = new Map(neighborhoods.map(n => [n.id, n]));
    const boroughMap = new Map(boroughs.map(b => [b.id, b]));
    const cityMap = new Map(cities.map(c => [c.id, c]));
    const countryMap = new Map(countries.map(c => [c._id, c]));
    const continentMap = new Map(continents.map(c => [c._id, c]));
    
    return existingVisits
      .filter(v => v.visited && v.category === category && v.rating != null)
      .map(v => {
        const rating = v.rating!;
        const categoryTyped = v.category as CategoryType;
        
        if (v.neighborhoodId) {
          const neighborhoodData = neighborhoodMap.get(v.neighborhoodId);
          if (!neighborhoodData) return null;
          
          const boroughData = neighborhoodData.boroughId ? boroughMap.get(neighborhoodData.boroughId) : null;
          const cityData = neighborhoodData.cityId ? cityMap.get(neighborhoodData.cityId) : null;
          
          if (neighborhoodData.boroughId && !boroughData) return null;
          if (neighborhoodData.cityId && !cityData) return null;

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
          const countryData = countryMap.get(v.countryId);
          if (!countryData) return null;
          
          const continentData = countryData?.continentId ? continentMap.get(countryData.continentId) : null;
          const eloRating = rating > 100 ? rating : convertLegacyRatingToElo(rating, category);
          
          return {
            _id: v.countryId,
            name: countryData.name,
            location: continentData?.name || countryData.continent || 'Unknown',
            rating: eloRating,
            category: categoryTyped,
            notes: v.notes
          };
        }
        return null;
      })
      .filter((comp): comp is NonNullable<typeof comp> => comp !== null)
      .filter(comp => comp.name !== entity.name || comp.location !== entity.location)
      .sort((a, b) => b.rating - a.rating);
  };

  const handleCategorySelect = (category: CategoryType) => {
    setSelectedCategory(category);
    const comparisons = getComparisonsInCategory(category);
    
    if (comparisons.length === 0) {
      const baseRating = getBaseCategoryRating(category);
      setCurrentRating(baseRating);
      setFinalRating(baseRating);
      setStep(2);
    } else {
      const baseRating = getBaseCategoryRating(category);
      setCurrentRating(baseRating);
      
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
    
    setCurrentRating(result.newItemNewRating);
    
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
    
    setSelectedOpponents(prev => 
      prev.map(opp => 
        opp._id === opponent._id 
          ? { ...opp, rating: result.opponentUpdate?.newRating || opp.rating }
          : opp
      )
    );
    
    if (comparisonIndex + 1 >= selectedOpponents.length) {
      setFinalRating(result.newItemNewRating);
      setStep(2);
    } else {
      setComparisonIndex(comparisonIndex + 1);
    }
  };

  const applyRatingUpdates = async (updates: EloRatingUpdate[]) => {
    for (const update of updates) {
      try {
        await fetch(`/api/visits/${update.visitId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: convertEloToDisplayRating(update.newRating, update.category),
            eloRating: update.newRating,
            category: update.category
          }),
        });
      } catch (error) {
        console.error(`Failed to update visit ${update.visitId}:`, error);
      }
    }
  };

  const handleComplete = async () => {
    if (selectedCategory && finalRating !== null) {
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

  const getCurrentOpponent = () => selectedOpponents[comparisonIndex];
  const getDisplayRating = (eloRating: number, category: CategoryType) => 
    convertEloToDisplayRating(eloRating, category);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)' }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 3,
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Psychology sx={{ color: '#6366f1', fontSize: 24 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                Smart Ranking
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                {entity.name}, {entity.location}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </Box>
        
        {/* Stepper */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Stepper activeStep={step} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        <Divider />
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {/* Step 0: Category Selection */}
        {step === 0 && (
          <Fade in timeout={300}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
                How would you categorize this place?
              </Typography>
              <Typography variant="body2" sx={{ mb: 4, textAlign: 'center', color: '#6b7280' }}>
                Choose the category that best describes your experience
              </Typography>
              
              <Stack spacing={2}>
                {['Good', 'Mid', 'Bad'].map((category) => (
                  <Card 
                    key={category}
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { 
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        transform: 'translateY(-2px)' 
                      }
                    }}
                    onClick={() => handleCategorySelect(category as CategoryType)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {category === 'Good' ? (
                          <ThumbUp sx={{ color: '#22c55e' }} />
                        ) : category === 'Mid' ? (
                          <Star sx={{ color: '#f59e0b' }} />
                        ) : (
                          <ThumbDown sx={{ color: '#ef4444' }} />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 0.5 }}>
                            {category === 'Good' ? 'Amazing' : category === 'Mid' ? 'Decent' : 'Disappointing'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6b7280' }}>
                            {category === 'Good' 
                              ? 'Places you loved and would highly recommend'
                              : category === 'Mid'
                              ? 'Solid places - nothing special but not bad'
                              : 'Places you didn\'t enjoy or wouldn\'t recommend'
                            }
                          </Typography>
                        </Box>
                        <Chip 
                          label={ELO_CONFIG.CATEGORY_RANGES[category as CategoryType].display}
                          sx={{ 
                            backgroundColor: category === 'Good' ? '#dcfce7' : category === 'Mid' ? '#fef3c7' : '#fee2e2',
                            color: category === 'Good' ? '#166534' : category === 'Mid' ? '#92400e' : '#991b1b'
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          </Fade>
        )}

        {/* Step 1: Comparison */}
        {step === 1 && selectedCategory && selectedOpponents.length > 0 && (
          <Fade in timeout={300}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
                Which place do you prefer?
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: '#6b7280' }}>
                Comparison {comparisonIndex + 1} of {selectedOpponents.length}
              </Typography>

              <LinearProgress 
                variant="determinate" 
                value={(comparisonIndex / selectedOpponents.length) * 100}
                sx={{ mb: 4, height: 8, borderRadius: 4 }}
              />
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto 1fr', 
                gap: 3, 
                alignItems: 'center' 
              }}>
                {/* New Item */}
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)' 
                    }
                  }}
                  onClick={() => handlePairwiseComparison(true)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {entity.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: '#6b7280' }}>
                      {entity.location}
                    </Typography>
                    <Chip 
                      label={`~${getDisplayRating(currentRating, selectedCategory).toFixed(1)}`}
                      color="primary"
                      size="small"
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#6b7280' }}>
                      NEW
                    </Typography>
                  </CardContent>
                </Card>

                <Typography variant="h6" sx={{ textAlign: 'center', color: '#6b7280' }}>
                  VS
                </Typography>

                {/* Opponent */}
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)' 
                    }
                  }}
                  onClick={() => handlePairwiseComparison(false)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {getCurrentOpponent()?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: '#6b7280' }}>
                      {getCurrentOpponent()?.location}
                    </Typography>
                    <Chip 
                      label={getDisplayRating(getCurrentOpponent()?.rating || 0, selectedCategory).toFixed(1)}
                      color="secondary"
                      size="small"
                    />
                    {getCurrentOpponent()?.notes && (
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        mt: 1, 
                        fontStyle: 'italic',
                        color: '#6b7280'
                      }}>
                        "{getCurrentOpponent()?.notes}"
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Step 2: Results */}
        {step === 2 && selectedCategory && finalRating !== null && (
          <Fade in timeout={300}>
            <Box>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <EmojiEvents sx={{ fontSize: 48, color: '#f59e0b', mb: 2 }} />
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
                  {getDisplayRating(finalRating, selectedCategory).toFixed(1)}
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {entity.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
                  {entity.location}
                </Typography>
                <Chip 
                  label={selectedCategory}
                  sx={{ 
                    backgroundColor: selectedCategory === 'Good' ? '#dcfce7' : selectedCategory === 'Mid' ? '#fef3c7' : '#fee2e2',
                    color: selectedCategory === 'Good' ? '#166534' : selectedCategory === 'Mid' ? '#92400e' : '#991b1b'
                  }}
                />
              </Box>

              {selectedOpponents.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Your {selectedCategory} Rankings
                  </Typography>
                  <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {[...selectedOpponents, { 
                      _id: 'new', 
                      name: entity.name, 
                      location: entity.location, 
                      rating: finalRating, 
                      category: selectedCategory 
                    }]
                      .sort((a, b) => b.rating - a.rating)
                      .map((item, index) => (
                        <ListItem 
                          key={item._id}
                          sx={{ 
                            backgroundColor: item._id === 'new' ? '#f0f9ff' : 'transparent',
                            borderRadius: 1,
                            mb: 0.5
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 24 }}>
                                  #{index + 1}
                                </Typography>
                                <Typography variant="body1">
                                  {item.name}
                                </Typography>
                                {item._id === 'new' && (
                                  <Chip label="NEW" size="small" color="primary" />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                  {item.location}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {getDisplayRating(item.rating, selectedCategory).toFixed(1)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2, borderTop: '1px solid #e5e7eb' }}>
        {(step === 1 || step === 2) && (
          <Button onClick={() => setStep(0)} variant="outlined">
            Back
          </Button>
        )}
        
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        
        {step === 2 && finalRating !== null && (
          <Button 
            onClick={handleComplete} 
            variant="contained"
            sx={{ backgroundColor: '#6366f1' }}
          >
            Complete ✨
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EloRankingDialog;