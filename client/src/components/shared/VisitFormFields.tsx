import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  Chip,
  Stack
} from '@mui/material';
import {
  CheckCircle,
  Star
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export interface BaseVisit {
  visited: boolean;
  notes: string;
  visitDate: Date | null;
  rating: number | null;
  eloRating?: number | null;
  category?: 'Bad' | 'Mid' | 'Good' | null;
}

interface VisitFormFieldsProps {
  visit: BaseVisit;
  onVisitChange: (updates: Partial<BaseVisit>) => void;
  showVisitedToggle?: boolean;
  showRankingButton?: boolean;
  showManualRating?: boolean;
  onRankingClick?: () => void;
  ratingButtonText?: string;
}

const VisitFormFields: React.FC<VisitFormFieldsProps> = ({
  visit,
  onVisitChange,
  showVisitedToggle = false,
  showRankingButton = false,
  showManualRating = false,
  onRankingClick,
  ratingButtonText = "Rank"
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack spacing={3}>
        {showVisitedToggle && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 2,
            borderRadius: 2,
            backgroundColor: visit.visited ? '#f0fdf4' : '#f9fafb',
            border: visit.visited ? '1px solid #bbf7d0' : '1px solid #e5e7eb'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircle sx={{ 
                color: visit.visited ? '#22c55e' : '#9ca3af',
                fontSize: 20 
              }} />
              <Typography variant="body1" sx={{ 
                fontWeight: 500,
                color: visit.visited ? '#166534' : '#374151'
              }}>
                Mark as visited
              </Typography>
            </Box>
            <Switch
              checked={visit.visited}
              onChange={(e) => onVisitChange({ visited: e.target.checked })}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#22c55e'
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#22c55e'
                }
              }}
            />
          </Box>
        )}

        {visit.visited && (
          <>
            {/* Date Picker */}
            <Box>
              <Typography variant="subtitle2" sx={{ 
                mb: 1.5, 
                color: '#374151',
                fontWeight: 500
              }}>
                Visit Date
              </Typography>
              <DatePicker
                label="When did you visit?"
                value={visit.visitDate}
                onChange={(date) => onVisitChange({ visitDate: date })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'medium'
                  }
                }}
              />
            </Box>

            {/* Rating Section */}
            {visit.category && visit.rating !== null && (
              <Box sx={{ 
                p: 3,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 2, 
                  color: '#374151',
                  fontWeight: 500
                }}>
                  Current Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip 
                    label={visit.category}
                    sx={{ 
                      backgroundColor: visit.category === 'Good' 
                        ? '#dcfce7' 
                        : visit.category === 'Mid' 
                        ? '#fef3c7' 
                        : '#fee2e2',
                      color: visit.category === 'Good' 
                        ? '#166534' 
                        : visit.category === 'Mid' 
                        ? '#92400e' 
                        : '#991b1b',
                      fontWeight: 500
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {visit.rating.toFixed(1)}/10
                  </Typography>
                </Box>
                {showRankingButton && (
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Use the "{ratingButtonText}" button to update this rating
                  </Typography>
                )}
              </Box>
            )}

            {/* Ranking Button */}
            {showRankingButton && (
              <Button
                variant="outlined"
                onClick={onRankingClick}
                startIcon={<Star />}
                fullWidth
                sx={{
                  py: 1.5,
                  color: '#f59e0b',
                  borderColor: '#f59e0b',
                  '&:hover': {
                    borderColor: '#d97706',
                    backgroundColor: '#fffbeb'
                  }
                }}
              >
                {ratingButtonText}
              </Button>
            )}

            {/* Manual Rating (if enabled) */}
            {showManualRating && (
              <>
                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    mb: 2, 
                    color: '#374151',
                    fontWeight: 500
                  }}>
                    Rating: {visit.rating !== null ? visit.rating : 'Not rated'}
                  </Typography>
                  <Slider
                    value={visit.rating || 0}
                    onChange={(_, value) => onVisitChange({ rating: value as number })}
                    step={0.5}
                    marks
                    min={0}
                    max={10}
                    valueLabelDisplay="auto"
                  />
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={visit.category || ''}
                    label="Category"
                    onChange={(e) => onVisitChange({ category: e.target.value as 'Bad' | 'Mid' | 'Good' | null })}
                  >
                    <MenuItem value="">Not categorized</MenuItem>
                    <MenuItem value="Bad">Bad</MenuItem>
                    <MenuItem value="Mid">Mid</MenuItem>
                    <MenuItem value="Good">Good</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            {/* Notes */}
            <Box>
              <Typography variant="subtitle2" sx={{ 
                mb: 1.5, 
                color: '#374151',
                fontWeight: 500
              }}>
                Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={visit.notes}
                onChange={(e) => onVisitChange({ notes: e.target.value })}
                placeholder="What did you do? What did you like? Any recommendations?"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#ffffff'
                  }
                }}
              />
            </Box>

            {/* Summary for manual rating */}
            {showManualRating && visit.rating !== null && visit.category && (
              <Box sx={{ 
                p: 2, 
                backgroundColor: '#f1f5f9', 
                borderRadius: 2,
                border: '1px solid #cbd5e1'
              }}>
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  <strong>Rating:</strong> {visit.rating}/10 • <strong>Category:</strong> {visit.category}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Stack>
    </LocalizationProvider>
  );
};

export default VisitFormFields;