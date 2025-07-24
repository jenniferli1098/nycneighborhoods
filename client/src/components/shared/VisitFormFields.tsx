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
  FormControlLabel,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import {
  Event,
  Notes,
  Star,
  Category,
  CheckCircle,
  Analytics
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {showVisitedToggle && (
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)',
              border: '1px solid #4caf50',
              borderRadius: 3
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box className="flex items-center justify-between">
                <Box className="flex items-center">
                  <Avatar sx={{ 
                    width: 40, 
                    height: 40, 
                    mr: 2,
                    background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)'
                  }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" className="font-bold">
                      Visit Status
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mark this place as visited
                    </Typography>
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={visit.visited}
                      onChange={(e) => onVisitChange({ visited: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-track': {
                          backgroundColor: visit.visited ? '#4caf50' : '#ccc'
                        },
                        '& .MuiSwitch-thumb': {
                          backgroundColor: visit.visited ? '#2e7d32' : '#fff'
                        }
                      }}
                    />
                  }
                  label=""
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {visit.visited && (
          <>
            <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
              <CardContent sx={{ p: 3 }}>
                <Box className="flex items-center mb-3">
                  <Avatar sx={{ 
                    width: 32, 
                    height: 32, 
                    mr: 2,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                  }}>
                    <Event />
                  </Avatar>
                  <Typography variant="h6" className="font-bold">
                    Visit Date
                  </Typography>
                </Box>
                <DatePicker
                  label="When did you visit?"
                  value={visit.visitDate}
                  onChange={(date) => onVisitChange({ visitDate: date })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: '#2196F3'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#2196F3'
                          }
                        }
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>

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