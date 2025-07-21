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
  StepLabel
} from '@mui/material';

export interface RankableEntity {
  name: string;
  location: string;
}

interface RankingDialogProps {
  open: boolean;
  onClose: () => void;
  entity: RankableEntity;
  existingVisits: any[];
  neighborhoods?: any[];
  boroughs?: any[];
  cities?: any[];
  countries?: any[];
  continents?: any[];
  onRankingComplete: (category: 'Bad' | 'Mid' | 'Good', rating: number) => void;
}

const RankingDialog: React.FC<RankingDialogProps> = ({
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
  const [selectedCategory, setSelectedCategory] = useState<'Bad' | 'Mid' | 'Good' | ''>('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [comparisonIndex, setComparisonIndex] = useState(0);
  const [sortedComparisons, setSortedComparisons] = useState<any[]>([]);
  const [binarySearchState, setBinarySearchState] = useState<{
    left: number;
    right: number;
    currentMid: number;
  } | null>(null);

  const steps = ['Choose Category', 'Pairwise Comparison', 'Final Ranking'];

  const getCategoryRange = (category: 'Bad' | 'Mid' | 'Good') => {
    switch (category) {
      case 'Bad': return { min: 0.0, max: 2.5 };
      case 'Mid': return { min: 2.6, max: 6.0 };
      case 'Good': return { min: 6.1, max: 10.0 };
    }
  };

  const getCategoryMidpoint = (category: 'Bad' | 'Mid' | 'Good') => {
    const range = getCategoryRange(category);
    return (range.min + range.max) / 2;
  };

  const getComparisonsInCategory = (category: 'Bad' | 'Mid' | 'Good') => {
    // Create lookup maps for both neighborhoods/boroughs/cities and countries/continents
    const neighborhoodMap = new Map(neighborhoods.map(n => [n.id, n]));
    const boroughMap = new Map(boroughs.map(b => [b.id, b]));
    const cityMap = new Map(cities.map(c => [c.id, c]));
    const countryMap = new Map(countries.map(c => [c._id, c]));
    const continentMap = new Map(continents.map(c => [c._id, c]));
    
    return existingVisits
      .filter(v => v.visited && v.category === category && v.rating != null)
      .map(v => {
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
          
          return {
            _id: v.neighborhoodId,
            name: neighborhoodData.name,
            location: boroughData?.name || cityData?.name || neighborhoodData.cityName || neighborhoodData.city || 'Unknown',
            rating: v.rating,
            category: v.category,
            notes: v.notes
          };
        } else if (v.countryId) {
          // Country visit - only include if country is in current area (if countries are filtered)
          const countryData = countryMap.get(v.countryId);
          if (!countryData) {
            return null; // Not in current area, exclude from comparisons
          }
          
          const continentData = countryData ? continentMap.get(countryData.continentId) : null;
          
          return {
            _id: v.countryId,
            name: countryData.name,
            location: continentData?.name || countryData.continent || 'Unknown',
            rating: v.rating,
            category: v.category,
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


  const handleCategorySelect = async (category: 'Bad' | 'Mid' | 'Good') => {
    setSelectedCategory(category);
    const comparisons = getComparisonsInCategory(category);
    setSortedComparisons(comparisons.sort((a, b) => b.rating - a.rating)); // Sort descending (best first) for comparison
    
    if (comparisons.length === 0) {
      // No existing items in this category, go directly to final step
      const midpoint = getCategoryMidpoint(category);
      setSelectedRating(midpoint);
      setStep(2);
    } else {
      // Start binary search
      initializeBinarySearch(comparisons.length);
      setStep(1);
    }
  };

  const initializeBinarySearch = (totalItems: number) => {
    setBinarySearchState({
      left: 0,
      right: totalItems,
      currentMid: Math.floor(totalItems / 2)
    });
    setComparisonIndex(Math.floor(totalItems / 2));
  };

  const redistributeRatings = async (allItems: any[], newRating: number, insertIndex: number) => {
    if (!selectedCategory) return { newRating, updates: [] };
    
    const categoryRange = getCategoryRange(selectedCategory);
    const updates: any[] = [];
    
    // Calculate the new rating for the item being inserted
    let calculatedNewRating = newRating;
    
    if (allItems.length === 0) {
      // First item in category, place at midpoint
      calculatedNewRating = getCategoryMidpoint(selectedCategory);
    } else {
      // Always redistribute 1/4 of the items in the category
      const totalItems = allItems.length + 1; // +1 for the new item
      const redistributeCount = Math.max(1, Math.ceil(totalItems / 4));
      
      // Determine the range of items to redistribute based on insertion point
      let startIndex, endIndex;
      
      if (insertIndex === 0) {
        // Inserting at the beginning - redistribute from start
        startIndex = 0;
        endIndex = Math.min(redistributeCount - 1, allItems.length - 1);
        calculatedNewRating = categoryRange.max;
      } else if (insertIndex === allItems.length) {
        // Inserting at the end - redistribute from end
        endIndex = allItems.length - 1;
        startIndex = Math.max(0, allItems.length - redistributeCount + 1);
        calculatedNewRating = categoryRange.min;
      } else {
        // Inserting in the middle - redistribute around insertion point
        const halfRedistribute = Math.floor(redistributeCount / 2);
        startIndex = Math.max(0, insertIndex - halfRedistribute);
        endIndex = Math.min(allItems.length - 1, insertIndex + halfRedistribute);
        
        // Adjust if we don't have enough items on one side
        const actualCount = endIndex - startIndex + 1;
        if (actualCount < redistributeCount) {
          if (startIndex === 0) {
            endIndex = Math.min(allItems.length - 1, startIndex + redistributeCount - 1);
          } else if (endIndex === allItems.length - 1) {
            startIndex = Math.max(0, endIndex - redistributeCount + 1);
          }
        }
        
        // Calculate new rating as average of neighbors
        const upperRating = insertIndex > 0 ? allItems[insertIndex - 1].rating : categoryRange.max;
        const lowerRating = insertIndex < allItems.length ? allItems[insertIndex].rating : categoryRange.min;
        calculatedNewRating = (upperRating + lowerRating) / 2;
      }
      
      // Redistribute the selected range of items
      const itemsToRedistribute = allItems.slice(startIndex, endIndex + 1);
      
      // Create new evenly spaced ratings for the redistribution range
      if (itemsToRedistribute.length > 0) {
        const totalRedistributeItems = itemsToRedistribute.length + (insertIndex >= startIndex && insertIndex <= endIndex + 1 ? 1 : 0);
        const span = categoryRange.max - categoryRange.min;
        const step = span / (totalRedistributeItems + 1);
        
        itemsToRedistribute.forEach((item, index) => {
          let newRatingForExisting;
          
          if (insertIndex === 0) {
            // New item at top, redistribute existing items below it
            newRatingForExisting = categoryRange.max - (step * (index + 1));
          } else if (insertIndex === allItems.length) {
            // New item at bottom, redistribute existing items above it
            newRatingForExisting = categoryRange.min + (step * (itemsToRedistribute.length - index));
          } else {
            // Middle insertion - redistribute around the insertion point
            const relativeIndex = startIndex + index;
            if (relativeIndex < insertIndex) {
              // Items before insertion point
              newRatingForExisting = categoryRange.min + (step * (index + 1));
            } else {
              // Items after insertion point
              newRatingForExisting = categoryRange.min + (step * (index + 2));
            }
          }
          
          if (Math.abs(item.rating - newRatingForExisting) > 0.1) {
            const visit = existingVisits.find(v => v.neighborhoodId === item._id || v.countryId === item._id);
            if (visit) {
              updates.push({
                visitId: visit._id,
                entityId: item._id,
                oldRating: visit.rating,
                newRating: newRatingForExisting,
                category: selectedCategory
              });
            }
          }
        });
      }
    }
    
    return {
      newRating: calculatedNewRating,
      updates: updates
    };
  };

  const handlePairwiseComparison = async (better: boolean) => {
    if (!selectedCategory || !binarySearchState) return;
    
    const { left, right, currentMid } = binarySearchState;
    
    let newLeft = left;
    let newRight = right;
    
    if (better) {
      // New item is better than current comparison
      // Search in the left half (since array is sorted descending - best first)
      newRight = currentMid;
    } else {
      // New item is worse than current comparison
      // Search in the right half (since array is sorted descending - worst last)
      newLeft = currentMid + 1;
    }
    
    // Check if binary search is complete
    if (newLeft >= newRight) {
      // Found the insertion point
      await finalizeRanking(newLeft);
    } else {
      // Continue binary search
      const newMid = Math.floor((newLeft + newRight) / 2);
      setBinarySearchState({
        left: newLeft,
        right: newRight,
        currentMid: newMid
      });
      setComparisonIndex(newMid);
    }
  };

  const finalizeRanking = async (insertIndex: number) => {
    const result = await redistributeRatings(sortedComparisons, 0, insertIndex);
    setSelectedRating(result.newRating);
    await applyRatingUpdates(result.updates);
    setStep(2);
  };

  const applyRatingUpdates = async (updates: any[]) => {
    console.log('🔄 RankingDialog: Applying rating updates:', updates);
    
    for (const update of updates) {
      try {
        await fetch(`/api/visits/${update.visitId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating: update.newRating,
            category: update.category
          }),
        });
        console.log(`✅ Updated visit ${update.visitId}: ${update.oldRating} → ${update.newRating}`);
      } catch (error) {
        console.error(`❌ Failed to update visit ${update.visitId}:`, error);
      }
    }
  };

  const handleComplete = () => {
    if (selectedCategory && selectedRating !== null) {
      onRankingComplete(selectedCategory, selectedRating);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(0);
    setSelectedCategory('');
    setSelectedRating(null);
    setComparisonIndex(0);
    setSortedComparisons([]);
    setBinarySearchState(null);
    onClose();
  };


  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h6">
            Rank {entity.name}, {entity.location}
          </Typography>
          <Box className="mt-2">
            <Stepper activeStep={step} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {step === 0 && (
          <Box>
            <Typography variant="h6" className="mb-4">
              How would you categorize this?
            </Typography>
            
            <Box className="space-y-3">
              <Card 
                className="cursor-pointer hover:bg-gray-50" 
                onClick={() => handleCategorySelect('Bad')}
              >
                <CardContent>
                  <Box className="flex justify-between items-center">
                    <Box>
                      <Typography variant="h6" color="error">
                        Bad (0.0 - 2.5)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Places you didn't enjoy or wouldn't recommend
                      </Typography>
                    </Box>
                    <Chip label="0.0 - 2.5" color="error" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-gray-50" 
                onClick={() => handleCategorySelect('Mid')}
              >
                <CardContent>
                  <Box className="flex justify-between items-center">
                    <Box>
                      <Typography variant="h6" color="warning.main">
                        Mid (2.6 - 6.0)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Decent places - nothing special but not bad
                      </Typography>
                    </Box>
                    <Chip label="2.6 - 6.0" color="warning" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-gray-50" 
                onClick={() => handleCategorySelect('Good')}
              >
                <CardContent>
                  <Box className="flex justify-between items-center">
                    <Box>
                      <Typography variant="h6" color="success.main">
                        Good (6.1 - 10.0)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Places you loved and would highly recommend
                      </Typography>
                    </Box>
                    <Chip label="6.1 - 10.0" color="success" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {step === 1 && selectedCategory && sortedComparisons.length > 0 && (
          <Box>
            <Typography variant="h6" className="mb-4">
              How does {entity.name} compare?
            </Typography>
            
            <Typography variant="body1" className="mb-6 text-center">
              Comparing with {sortedComparisons[comparisonIndex]?.name}, {sortedComparisons[comparisonIndex]?.location}
            </Typography>

            <Typography variant="body1" className="mb-4 text-center">
              Click on the option you prefer:
            </Typography>

            <Box className="flex gap-4 mb-6">
              {/* New neighborhood being ranked - clickable (LEFT SIDE) */}
              <Card 
                className="flex-1 cursor-pointer"
                variant="outlined"
                onClick={() => handlePairwiseComparison(true)}
                sx={{
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#eff6ff', // blue-50
                    borderColor: '#93c5fd', // blue-300
                    boxShadow: 3,
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <CardContent className="text-center">
                  <Typography variant="h6" className="mb-2">
                    {entity.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="mb-2">
                    {entity.location}
                  </Typography>
                  <Chip label="?" color="secondary" variant="outlined" />
                  <Typography variant="caption" color="text.secondary" className="mt-2 block">
                    New item to rank
                  </Typography>
                </CardContent>
              </Card>

              <Box className="flex flex-col justify-center">
                <Typography variant="h5" className="text-gray-400">
                  vs
                </Typography>
              </Box>

              {/* Current comparison neighborhood - clickable (RIGHT SIDE) */}
              <Card 
                className="flex-1 cursor-pointer"
                variant="outlined"
                onClick={() => handlePairwiseComparison(false)}
                sx={{
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#eff6ff', // blue-50
                    borderColor: '#93c5fd', // blue-300
                    boxShadow: 3,
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <CardContent className="text-center">
                  <Typography variant="h6" className="mb-2">
                    {sortedComparisons[comparisonIndex]?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="mb-2">
                    {sortedComparisons[comparisonIndex]?.location}
                  </Typography>
                  <Chip 
                    label={sortedComparisons[comparisonIndex]?.rating.toFixed(1)} 
                    color="primary" 
                  />
                  {sortedComparisons[comparisonIndex]?.notes && (
                    <Typography variant="caption" color="text.secondary" className="mt-2 block">
                      "{sortedComparisons[comparisonIndex]?.notes}"
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>

            <Typography variant="caption" color="text.secondary" className="mt-4 text-center block">
              {binarySearchState ? 
                `Binary Search: ${Math.ceil(Math.log2(sortedComparisons.length + 1))} max steps (current: ${Math.ceil(Math.log2(sortedComparisons.length + 1)) - Math.ceil(Math.log2(binarySearchState.right - binarySearchState.left + 1)) + 1})` :
                `Step ${comparisonIndex + 1} of ${sortedComparisons.length}`
              }
            </Typography>
          </Box>
        )}

        {step === 2 && selectedCategory && selectedRating !== null && (
          <Box>
            <Typography variant="h6" className="mb-4">
              Final Ranking
            </Typography>
            
            <Box className="text-center mb-6">
              <Typography variant="h4" className="mb-2">
                {selectedRating.toFixed(1)}
              </Typography>
              <Typography variant="body1" className="mb-2">
                {entity.name}, {entity.location}
              </Typography>
              <Chip label={selectedCategory} color="primary" />
            </Box>

            {sortedComparisons.length > 0 && (
              <Box>
                <Typography variant="subtitle1" className="mb-3">
                  Your {selectedCategory} ranking:
                </Typography>
                <Box className="space-y-2 max-h-60 overflow-y-auto">
                  {[...sortedComparisons, { name: entity.name, location: entity.location, rating: selectedRating, _id: 'new' }]
                    .sort((a, b) => b.rating - a.rating)
                    .map((comp, index) => (
                      <Card 
                        key={comp._id} 
                        variant={comp._id === 'new' ? 'elevation' : 'outlined'}
                        className={comp._id === 'new' ? 'bg-blue-50' : ''}
                      >
                        <CardContent className="py-2">
                          <Box className="flex justify-between items-center">
                            <Box className="flex items-center gap-2">
                              <Typography variant="body2" className="font-mono text-gray-500">
                                #{index + 1}
                              </Typography>
                              <Typography variant="body2" className={comp._id === 'new' ? 'font-bold' : ''}>
                                {comp.name}, {comp.location}
                                {comp._id === 'new' && ' (New)'}
                              </Typography>
                            </Box>
                            <Chip 
                              label={comp.rating.toFixed(1)} 
                              color={comp._id === 'new' ? 'primary' : 'default'}
                              variant={comp._id === 'new' ? 'filled' : 'outlined'}
                              size="small"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {(step === 1 || step === 2) && (
          <Button onClick={() => setStep(0)}>
            Back to Categories
          </Button>
        )}
        <Button onClick={handleClose}>
          Cancel
        </Button>
        {step === 2 && selectedRating !== null && (
          <Button onClick={handleComplete} variant="contained">
            Complete Ranking
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RankingDialog;