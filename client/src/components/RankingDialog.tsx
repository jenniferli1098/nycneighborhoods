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

interface RankingDialogProps {
  open: boolean;
  onClose: () => void;
  neighborhood: { name: string; borough: string };
  existingVisits: any[];
  neighborhoods: any[];
  boroughs: any[];
  onRankingComplete: (category: 'Bad' | 'Mid' | 'Good', rating: number) => void;
}

const RankingDialog: React.FC<RankingDialogProps> = ({
  open,
  onClose,
  neighborhood,
  existingVisits,
  neighborhoods,
  boroughs,
  onRankingComplete
}) => {
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'Bad' | 'Mid' | 'Good' | ''>('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [comparisonIndex, setComparisonIndex] = useState(0);
  const [sortedComparisons, setSortedComparisons] = useState<any[]>([]);

  const steps = ['Choose Category', 'Pairwise Comparison', 'Final Ranking'];

  const getCategoryRange = (category: 'Bad' | 'Mid' | 'Good') => {
    switch (category) {
      case 'Bad': return { min: 0.0, max: 3.0 };
      case 'Mid': return { min: 3.1, max: 7.0 };
      case 'Good': return { min: 7.1, max: 10.0 };
    }
  };

  const getCategoryMidpoint = (category: 'Bad' | 'Mid' | 'Good') => {
    const range = getCategoryRange(category);
    return (range.min + range.max) / 2;
  };

  const getComparisonsInCategory = (category: 'Bad' | 'Mid' | 'Good') => {
    // Create lookup maps for neighborhoods and boroughs
    const neighborhoodMap = new Map(neighborhoods.map(n => [n._id, n]));
    const boroughMap = new Map(boroughs.map(b => [b._id, b]));
    
    return existingVisits
      .filter(v => v.visited && v.category === category && v.rating != null)
      .map(v => {
        // Look up neighborhood and borough info
        const neighborhoodData = neighborhoodMap.get(v.neighborhoodId);
        const boroughData = neighborhoodData ? boroughMap.get(neighborhoodData.boroughId) : null;
        
        return {
          _id: v.neighborhoodId || v._id,
          name: neighborhoodData?.name || 'Unknown',
          borough: boroughData?.name || 'Unknown',
          rating: v.rating,
          category: v.category,
          notes: v.notes
        };
      })
      .sort((a, b) => b.rating - a.rating);
  };


  const handleCategorySelect = async (category: 'Bad' | 'Mid' | 'Good') => {
    setSelectedCategory(category);
    const comparisons = getComparisonsInCategory(category);
    setSortedComparisons(comparisons.sort((a, b) => a.rating - b.rating)); // Sort ascending for comparison
    
    if (comparisons.length === 0) {
      // No existing neighborhoods in this category, go directly to final step
      const midpoint = getCategoryMidpoint(category);
      setSelectedRating(midpoint);
      setStep(2);
    } else {
      // Start pairwise comparisons
      setComparisonIndex(0);
      setStep(1);
    }
  };

  const redistributeRatings = async (allNeighborhoods: any[], newRating: number, insertIndex: number) => {
    if (!selectedCategory) return { newRating, updates: [] };
    
    const categoryRange = getCategoryRange(selectedCategory);
    const updates = [];
    
    // Calculate the new rating for the neighborhood being inserted
    let calculatedNewRating = newRating;
    
    if (allNeighborhoods.length === 0) {
      // First neighborhood in category, place at midpoint
      calculatedNewRating = getCategoryMidpoint(selectedCategory);
    } else if (insertIndex === 0) {
      // Better than all existing, place above the current best
      const bestRating = allNeighborhoods[0].rating;
      calculatedNewRating = Math.min(categoryRange.max, bestRating + 0.5);
    } else if (insertIndex === allNeighborhoods.length) {
      // Worse than all existing, place below the current worst
      const worstRating = allNeighborhoods[allNeighborhoods.length - 1].rating;
      calculatedNewRating = Math.max(categoryRange.min, worstRating - 0.5);
    } else {
      // Between two neighborhoods - place in the middle
      const upperRating = allNeighborhoods[insertIndex - 1].rating;
      const lowerRating = allNeighborhoods[insertIndex].rating;
      calculatedNewRating = (upperRating + lowerRating) / 2;
    }
    
    // Adjust adjacent neighbors using averaging logic
    // Only update the immediate neighbors (one above, one below)
    
    // Update neighbor above (if exists and there's a non-adjacent neighbor above it)
    if (insertIndex > 0 && insertIndex > 1) {
      const adjacentAbove = allNeighborhoods[insertIndex - 1]; // B in example
      const nonAdjacentAbove = allNeighborhoods[insertIndex - 2]; // A in example
      
      const newRatingForAdjacent = (nonAdjacentAbove.rating + calculatedNewRating) / 2;
      
      if (Math.abs(adjacentAbove.rating - newRatingForAdjacent) > 0.1) {
        const visit = existingVisits.find(v => v.neighborhoodId === adjacentAbove._id);
        if (visit) {
          updates.push({
            visitId: visit._id,
            neighborhoodId: adjacentAbove._id,
            oldRating: visit.rating,
            newRating: newRatingForAdjacent,
            category: selectedCategory
          });
        }
      }
    }
    
    // Update neighbor below (if exists and there's a non-adjacent neighbor below it)
    if (insertIndex < allNeighborhoods.length && insertIndex < allNeighborhoods.length - 1) {
      const adjacentBelow = allNeighborhoods[insertIndex]; // C in example
      const nonAdjacentBelow = allNeighborhoods[insertIndex + 1]; // D in example
      
      const newRatingForAdjacent = (calculatedNewRating + nonAdjacentBelow.rating) / 2;
      
      if (Math.abs(adjacentBelow.rating - newRatingForAdjacent) > 0.1) {
        const visit = existingVisits.find(v => v.neighborhoodId === adjacentBelow._id);
        if (visit) {
          updates.push({
            visitId: visit._id,
            neighborhoodId: adjacentBelow._id,
            oldRating: visit.rating,
            newRating: newRatingForAdjacent,
            category: selectedCategory
          });
        }
      }
    }
    
    return {
      newRating: calculatedNewRating,
      updates: updates
    };
  };

  const handlePairwiseComparison = async (better: boolean) => {
    if (!selectedCategory) return;
    
    let result;
    
    if (better) {
      // New neighborhood is better than current comparison
      if (comparisonIndex === sortedComparisons.length - 1) {
        // Better than all - calculate redistributed rating
        result = await redistributeRatings(sortedComparisons, 10, sortedComparisons.length);
        setSelectedRating(result.newRating);
        await applyRatingUpdates(result.updates);
        setStep(2);
      } else {
        // Continue to next comparison
        setComparisonIndex(comparisonIndex + 1);
      }
    } else {
      // New neighborhood is worse than current comparison
      if (comparisonIndex === 0) {
        // Worse than all - calculate redistributed rating
        result = await redistributeRatings(sortedComparisons, 0, 0);
        setSelectedRating(result.newRating);
        await applyRatingUpdates(result.updates);
        setStep(2);
      } else {
        // Place between previous and current - calculate redistributed rating
        result = await redistributeRatings(sortedComparisons, 5, comparisonIndex);
        setSelectedRating(result.newRating);
        await applyRatingUpdates(result.updates);
        setStep(2);
      }
    }
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
    onClose();
  };


  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h6">
            Rank {neighborhood.name}, {neighborhood.borough}
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
              How would you categorize this neighborhood?
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
                        Bad (0.0 - 3.0)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Neighborhoods you didn't enjoy or wouldn't recommend
                      </Typography>
                    </Box>
                    <Chip label="0.0 - 3.0" color="error" variant="outlined" />
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
                        Mid (3.1 - 7.0)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Decent neighborhoods - nothing special but not bad
                      </Typography>
                    </Box>
                    <Chip label="3.1 - 7.0" color="warning" variant="outlined" />
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
                        Good (7.1 - 10.0)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Neighborhoods you loved and would highly recommend
                      </Typography>
                    </Box>
                    <Chip label="7.1 - 10.0" color="success" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {step === 1 && selectedCategory && sortedComparisons.length > 0 && (
          <Box>
            <Typography variant="h6" className="mb-4">
              How does {neighborhood.name} compare?
            </Typography>
            
            <Typography variant="body1" className="mb-6 text-center">
              Comparing with {sortedComparisons[comparisonIndex]?.name}, {sortedComparisons[comparisonIndex]?.borough}
            </Typography>

            <Typography variant="body1" className="mb-4 text-center">
              Click on the neighborhood you prefer:
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
                    {neighborhood.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="mb-2">
                    {neighborhood.borough}
                  </Typography>
                  <Chip label="?" color="secondary" variant="outlined" />
                  <Typography variant="caption" color="text.secondary" className="mt-2 block">
                    New neighborhood to rank
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
                    {sortedComparisons[comparisonIndex]?.borough}
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
              Step {comparisonIndex + 1} of {sortedComparisons.length}
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
                {neighborhood.name}, {neighborhood.borough}
              </Typography>
              <Chip label={selectedCategory} color="primary" />
            </Box>

            {sortedComparisons.length > 0 && (
              <Box>
                <Typography variant="subtitle1" className="mb-3">
                  Your {selectedCategory} neighborhoods ranking:
                </Typography>
                <Box className="space-y-2 max-h-60 overflow-y-auto">
                  {[...sortedComparisons, { name: neighborhood.name, borough: neighborhood.borough, rating: selectedRating, _id: 'new' }]
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
                                {comp.name}, {comp.borough}
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