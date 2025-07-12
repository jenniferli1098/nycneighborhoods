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
  FormControlLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export interface BaseVisit {
  visited: boolean;
  notes: string;
  visitDate: Date | null;
  rating: number | null;
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {showVisitedToggle && (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={visit.visited}
                  onChange={(e) => onVisitChange({ visited: e.target.checked })}
                  color="primary"
                />
              }
              label="Mark as visited"
            />
          </Box>
        )}

        {visit.visited && (
          <>
            <DatePicker
              label="Visit Date"
              value={visit.visitDate}
              onChange={(date) => onVisitChange({ visitDate: date })}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal'
                }
              }}
            />

            {showRankingButton && (
              <Box className="flex gap-2">
                <Button
                  variant="contained"
                  onClick={onRankingClick}
                  fullWidth
                >
                  {ratingButtonText}
                </Button>
              </Box>
            )}

            {showManualRating && (
              <>
                <Box>
                  <Typography gutterBottom>
                    Overall Rating: {visit.rating !== null ? visit.rating : 'Not rated'}
                  </Typography>
                  <Slider
                    value={visit.rating || 0}
                    onChange={(_, value) => onVisitChange({ rating: value as number })}
                    step={1}
                    marks
                    min={0}
                    max={10}
                    valueLabelDisplay="auto"
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box>
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
                </Box>
              </>
            )}

            {visit.category && visit.rating !== null && visit.rating !== undefined && (
              <Box>
                <Typography variant="body1" className="mb-2">
                  <strong>Category:</strong> {visit.category} • <strong>Score:</strong> {visit.rating.toFixed(1)}/10.0
                </Typography>
                {showRankingButton && (
                  <Typography variant="body2" color="text.secondary">
                    Use the "{ratingButtonText}" button above to change this rating
                  </Typography>
                )}
              </Box>
            )}

            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={4}
              value={visit.notes}
              onChange={(e) => onVisitChange({ notes: e.target.value })}
              placeholder="What did you do? What did you like? Any recommendations?"
            />

            {showManualRating && visit.rating !== null && visit.rating !== undefined && visit.category && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Rating:</strong> {visit.rating}/10 • <strong>Category:</strong> {visit.category}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default VisitFormFields;