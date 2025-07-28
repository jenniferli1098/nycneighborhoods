import React, { useState } from 'react';
import api from '../config/api';
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

interface PairwiseComparison {
  sessionId: string;
  newLocation: {
    visitType: string;
    neighborhoodName?: string;
    boroughName?: string;
    countryName?: string;
  };
  compareVisit: {
    _id: string;
    neighborhoodId?: string;
    countryId?: string;
    rating: number;
    category: string;
    notes?: string;
  };
  progress: {
    current: number;
    total: number;
  };
}

interface PairwiseResult {
  score: number;
  category: 'Good' | 'Mid' | 'Bad';
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
}

const PairwiseRankingDialog: React.FC<PairwiseRankingDialogProps> = ({
  open,
  onClose,
  entity,
  visitType,
  locationData,
  onRankingComplete
}) => {
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'Good' | 'Mid' | 'Bad' | null>(null);
  const [currentComparison, setCurrentComparison] = useState<PairwiseComparison | null>(null);
  const [finalResult, setFinalResult] = useState<PairwiseResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = ['Choose Category', 'Compare Places', 'Final Rating'];

  const handleCategorySelect = (category: 'Good' | 'Mid' | 'Bad') => {
    setSelectedCategory(category);
    setStep(1);
    handleStartRanking(category);
  };

  const handleStartRanking = async (category?: 'Good' | 'Mid' | 'Bad') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/pairwise/start', {
        visitType,
        category: category || selectedCategory,
        ...locationData
      });

      if (response.data.isComplete) {
        // No existing visits, auto-completed
        setFinalResult(response.data.result);
        setSessionId(response.data.sessionId);
        setStep(2);
      } else {
        // Start pairwise comparisons
        setCurrentComparison(response.data.comparison);
        setSessionId(response.data.comparison.sessionId);
        // Stay on step 1 for comparisons (step 0 is now category selection)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start ranking');
    } finally {
      setLoading(false);
    }
  };

  const handleComparison = async (newLocationBetter: boolean) => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/pairwise/compare', {
        sessionId,
        newLocationBetter
      });

      if (response.data.isComplete) {
        // Comparison complete
        setFinalResult(response.data.result);
        setStep(2);
      } else {
        // Continue with next comparison
        setCurrentComparison(response.data.comparison);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    console.log('handleComplete called', { sessionId, finalResult });
    
    if (!sessionId || !finalResult) {
      console.error('Missing sessionId or finalResult', { sessionId, finalResult });
      setError('Missing session data. Please try ranking again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Calling create-visit API with sessionId:', sessionId);
      const response = await api.post('/api/pairwise/create-visit', { sessionId });
      console.log('Create-visit response:', response.data);
      
      console.log('Calling onRankingComplete with:', finalResult.category, finalResult.score);
      onRankingComplete(finalResult.category, finalResult.score);
      handleClose();
    } catch (err: any) {
      console.error('Failed to save ranking:', err);
      setError(err.response?.data?.error || 'Failed to save ranking');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setSelectedCategory(null);
    setCurrentComparison(null);
    setFinalResult(null);
    setSessionId(null);
    setError(null);
    onClose();
  };

  const getLocationName = (visit: any) => {
    if (visit.neighborhoodId && visit.neighborhoodId.name) {
      return visit.neighborhoodId.name;
    }
    if (visit.countryId && visit.countryId.name) {
      return visit.countryId.name;
    }
    return 'Unknown Location';
  };

  const getLocationDetails = (visit: any) => {
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
                Pairwise Ranking
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
                How would you categorize {entity.name}?
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 4 }}>
                First, choose a category. Then we'll compare it only with places in that same category 
                for faster, more relevant rankings.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
                {[
                  { 
                    category: 'Good' as const, 
                    label: 'Amazing Places', 
                    color: '#22c55e', 
                    bgColor: '#dcfce7',
                    description: 'Places you love and would definitely recommend'
                  },
                  { 
                    category: 'Mid' as const, 
                    label: 'Decent Places', 
                    color: '#f59e0b', 
                    bgColor: '#fef3c7',
                    description: 'Places that are okay but nothing special'
                  },
                  { 
                    category: 'Bad' as const, 
                    label: 'Disappointing', 
                    color: '#ef4444', 
                    bgColor: '#fee2e2',
                    description: 'Places you would not recommend to others'
                  }
                ].map(({ category, label, color, bgColor, description }) => (
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
                      <Box 
                        sx={{ 
                          width: 48, 
                          height: 48, 
                          borderRadius: '50%', 
                          backgroundColor: bgColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2
                        }}
                      >
                        <Typography variant="h6" sx={{ color, fontWeight: 600 }}>
                          {category === 'Good' ? '😍' : category === 'Mid' ? '😐' : '😔'}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color }}>
                        {label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280', lineHeight: 1.3 }}>
                        {description}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {loading && (
                <Box sx={{ mt: 3 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1, color: '#6b7280' }}>
                    Setting up comparisons...
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {/* Step 1: Comparison */}
        {step === 1 && currentComparison && (
          <Fade in timeout={300}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
                Which place do you prefer?
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: '#6b7280' }}>
                Comparison {currentComparison.progress.current + 1} of {currentComparison.progress.total}
              </Typography>

              <LinearProgress 
                variant="determinate" 
                value={((currentComparison.progress.current) / currentComparison.progress.total) * 100}
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
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.6 : 1,
                    '&:hover': !loading ? { 
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)' 
                    } : {}
                  }}
                  onClick={() => !loading && handleComparison(true)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {entity.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: '#6b7280' }}>
                      {entity.location}
                    </Typography>
                    <Chip 
                      label="NEW"
                      color="primary"
                      size="small"
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#6b7280' }}>
                      Click if you prefer this place
                    </Typography>
                  </CardContent>
                </Card>

                <Typography variant="h6" sx={{ textAlign: 'center', color: '#6b7280' }}>
                  VS
                </Typography>

                {/* Existing Item */}
                <Card 
                  sx={{ 
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.6 : 1,
                    '&:hover': !loading ? { 
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)' 
                    } : {}
                  }}
                  onClick={() => !loading && handleComparison(false)}
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
                    {currentComparison.compareVisit.notes && (
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        mt: 1, 
                        fontStyle: 'italic',
                        color: '#6b7280'
                      }}>
                        "{currentComparison.compareVisit.notes}"
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#6b7280' }}>
                      Click if you prefer this place
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {loading && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <LinearProgress sx={{ mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Processing comparison...
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {/* Step 2: Results */}
        {step === 2 && finalResult && (
          <Fade in timeout={300}>
            <Box>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <EmojiEvents sx={{ fontSize: 48, color: '#f59e0b', mb: 2 }} />
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
                  {finalResult.score.toFixed(1)}
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
              </Box>


              {loading && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <LinearProgress sx={{ mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Saving your ranking...
                  </Typography>
                </Box>
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