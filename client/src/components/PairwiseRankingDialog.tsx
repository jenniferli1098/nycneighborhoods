import React, { useState } from 'react';
import api from '../config/api';
import { SimplePairwiseRanking } from '../services/SimplePairwiseRanking';
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
  LinearProgress,
  Fade,
  IconButton,
  Divider,
  Alert
} from '@mui/material';
import {
  Close,
  Psychology,
  EmojiEvents,
  CompareArrows
} from '@mui/icons-material';

export interface RankableEntity {
  name: string;
  location: string;
}

interface PairwiseRankingDialogProps {
  open: boolean;
  onClose: () => void;
  entity: RankableEntity;
  visitType: 'neighborhood' | 'country';
  locationData: {
    neighborhoodName?: string;
    boroughName?: string;
    countryName?: string;
    visited?: boolean;
    notes?: string;
    visitDate?: string;
  };
  onRankingComplete: (category: 'Good' | 'Mid' | 'Bad', rating: number) => void;
  existingRating?: {
    rating: number;
    category: 'Good' | 'Mid' | 'Bad';
    visitId: string;
  };
}

const PairwiseRankingDialog: React.FC<PairwiseRankingDialogProps> = ({
  open,
  onClose,
  entity,
  visitType,
  locationData,
  onRankingComplete,
  existingRating
}) => {
  const [step, setStep] = useState(0); // 0: category, 1: compare, 2: result
  const [selectedCategory, setSelectedCategory] = useState<'Good' | 'Mid' | 'Bad' | null>(null);
  const [ranking, setRanking] = useState<SimplePairwiseRanking | null>(null);
  const [currentComparison, setCurrentComparison] = useState<{ 
    compareVisit: { 
      neighborhoodId?: { name: string; boroughId?: { name: string }; cityId?: { name: string } }; 
      countryId?: { name: string; continent: string };
      rating: number;
      category: string;
    }; 
    progress: { current: number; total: number } 
  } | null>(null);
  const [finalResult, setFinalResult] = useState<{ rating: number; category: string; insertionPosition: number; totalVisits: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleCategorySelect = async (category: 'Good' | 'Mid' | 'Bad') => {
    setSelectedCategory(category);
    setLoading(true);
    setError(null);

    try {
      // Fetch existing visits in this category
      const response = await api.get(`/api/visits`);
      const allVisits = response.data;
      
      // Filter visits for this category and type
      const relevantVisits = allVisits.filter((visit: { 
        visitType: string; 
        category: string; 
        rating: number; 
        _id: string;
        neighborhoodId?: { name: string; boroughId?: { name: string }; cityId?: { name: string } };
        countryId?: { name: string; continent: string };
      }) => 
        visit.visitType === visitType &&
        visit.category === category &&
        visit.rating != null &&
        // Exclude existing visit if re-ranking
        (!existingRating || visit._id !== existingRating.visitId)
      );

      // Initialize ranking system
      const newRanking = new SimplePairwiseRanking(relevantVisits, category);
      setRanking(newRanking);

      if (newRanking.isComplete()) {
        // No comparisons needed
        const result = newRanking.getFinalResult();
        setFinalResult(result);
        setStep(2);
      } else {
        // Start comparisons
        const comparison = newRanking.getCurrentComparison();
        setCurrentComparison(comparison);
        setStep(1);
      }
    } catch {
      setError('Failed to load existing visits');
    } finally {
      setLoading(false);
    }
  };

  const handleComparison = (newLocationBetter: boolean) => {
    if (!ranking) return;

    ranking.processComparison(newLocationBetter);

    if (ranking.isComplete()) {
      // Done with comparisons
      const result = ranking.getFinalResult();
      setFinalResult(result);
      setStep(2);
    } else {
      // Next comparison
      const comparison = ranking.getCurrentComparison();
      setCurrentComparison(comparison);
    }
  };

  const handleComplete = async () => {
    if (!finalResult || !selectedCategory) return;

    setLoading(true);
    setError(null);

    try {
      // Save the visit with the calculated rating
      const visitData = {
        visitType,
        ...locationData,
        rating: finalResult.rating,
        category: selectedCategory
      };

      await api.post('/api/visits', visitData);

      onRankingComplete(selectedCategory, finalResult.rating);
      onClose();
    } catch (err: any) {
      console.error('Save ranking error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save ranking');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setSelectedCategory(null);
    setRanking(null);
    setCurrentComparison(null);
    setFinalResult(null);
    setError(null);
    onClose();
  };

  const getLocationName = (visit: { neighborhoodId?: { name: string }; countryId?: { name: string } }) => {
    if (visit.neighborhoodId?.name) return visit.neighborhoodId.name;
    if (visit.countryId?.name) return visit.countryId.name;
    return 'Unknown Location';
  };

  const getLocationDetails = (visit: { neighborhoodId?: { boroughId?: { name: string }; cityId?: { name: string } }; countryId?: { continent: string } }) => {
    if (visit.neighborhoodId) {
      return visit.neighborhoodId.boroughId?.name || visit.neighborhoodId.cityId?.name || 'Unknown Area';
    }
    if (visit.countryId) {
      return visit.countryId.continent || 'Unknown Continent';
    }
    return 'Unknown';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Good': return '#22c55e';
      case 'Mid': return '#f59e0b';
      case 'Bad': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'Good': return '#dcfce7';
      case 'Mid': return '#fef3c7';
      case 'Bad': return '#fee2e2';
      default: return '#f3f4f6';
    }
  };

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
                {existingRating ? 'Re-ranking' : 'Pairwise Ranking'}
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
        <Divider />
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Step 0: Category Selection */}
        {step === 0 && (
          <Fade in timeout={300}>
            <Box sx={{ textAlign: 'center' }}>
              <CompareArrows sx={{ fontSize: 48, color: '#6366f1', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                {existingRating 
                  ? `Re-rank ${entity.name}` 
                  : `How would you categorize ${entity.name}?`
                }
              </Typography>
              {existingRating && (
                <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
                  Currently rated <strong>{existingRating.rating.toFixed(1)}</strong> in <em>{existingRating.category}</em> category
                </Typography>
              )}
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 4 }}>
                Choose a category to start ranking this location.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
                {[
                  { category: 'Good' as const, label: 'Amazing Places', emoji: '😍' },
                  { category: 'Mid' as const, label: 'Decent Places', emoji: '😐' },
                  { category: 'Bad' as const, label: 'Disappointing', emoji: '😔' }
                ].map(({ category, label, emoji }) => (
                  <Card 
                    key={category}
                    sx={{ 
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: loading ? 0.6 : 1,
                      minWidth: 160,
                      '&:hover': !loading ? { 
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        transform: 'translateY(-4px)' 
                      } : {}
                    }}
                    onClick={() => !loading && handleCategorySelect(category)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {emoji}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        mb: 1, 
                        color: getCategoryColor(category) 
                      }}>
                        {label}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {loading && (
                <Box sx={{ mt: 3 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1, color: '#6b7280' }}>
                    Loading comparisons...
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {/* Step 1: Comparison */}
        {step === 1 && currentComparison && ranking && (
          <Fade in timeout={300}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
                Which place do you prefer?
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: '#6b7280' }}>
                Comparison {ranking.getProgress().current + 1} of {ranking.getProgress().total}
              </Typography>

              <LinearProgress 
                variant="determinate" 
                value={ranking.getProgress().percentage}
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
                  onClick={() => handleComparison(true)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {entity.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: '#6b7280' }}>
                      {entity.location}
                    </Typography>
                    <Chip label="NEW" color="primary" size="small" />
                  </CardContent>
                </Card>

                <Typography variant="h6" sx={{ textAlign: 'center', color: '#6b7280' }}>
                  VS
                </Typography>

                {/* Existing Item */}
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)' 
                    }
                  }}
                  onClick={() => handleComparison(false)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {getLocationName(currentComparison.compareVisit)}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: '#6b7280' }}>
                      {getLocationDetails(currentComparison.compareVisit)}
                    </Typography>
                    <Chip 
                      label={`${currentComparison.compareVisit.rating.toFixed(1)} • ${currentComparison.compareVisit.category}`}
                      sx={{
                        backgroundColor: getCategoryBg(currentComparison.compareVisit.category),
                        color: getCategoryColor(currentComparison.compareVisit.category)
                      }}
                      size="small"
                    />
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Step 2: Results */}
        {step === 2 && finalResult && (
          <Fade in timeout={300}>
            <Box sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 48, color: '#f59e0b', mb: 2 }} />
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
                {finalResult.rating.toFixed(1)}
              </Typography>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {entity.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
                {entity.location}
              </Typography>
              <Chip 
                label={finalResult.category}
                sx={{ 
                  backgroundColor: getCategoryBg(finalResult.category),
                  color: getCategoryColor(finalResult.category),
                  fontWeight: 600
                }}
              />
              
              {finalResult.totalVisits > 0 && (
                <Typography variant="body2" sx={{ mt: 2, color: '#6b7280' }}>
                  Ranked against {finalResult.totalVisits} other places in {finalResult.category} category
                </Typography>
              )}
            </Box>
          </Fade>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2, borderTop: '1px solid #e5e7eb' }}>
        <Button onClick={handleClose} variant="outlined" disabled={loading}>
          Cancel
        </Button>
        
        {step === 2 && finalResult && (
          <Button 
            onClick={handleComplete} 
            variant="contained"
            sx={{ backgroundColor: '#6366f1' }}
            disabled={loading}
          >
            Save Ranking ✨
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PairwiseRankingDialog;