import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
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
import { visitsApi, type Visit } from '../services/visitsApi';
import { type Country } from '../services/countriesApi';

interface CountryDialogProps {
  open: boolean;
  onClose: () => void;
  country: Country;
  onSave: () => void;
  existingVisits?: Visit[];
}

interface CountryVisit {
  _id?: string;
  userId?: string;
  countryId?: string;
  countryName?: string; // For form display only
  continent?: string; // For form display only
  visited: boolean;
  notes: string;
  visitDate: Date | null;
  rating: number | null;
  category?: 'Bad' | 'Mid' | 'Good' | null;
}

const CountryDialog: React.FC<CountryDialogProps> = ({
  open,
  onClose,
  country,
  onSave,
  existingVisits = []
}) => {
  const [visit, setVisit] = useState<CountryVisit>({
    countryName: country.name,
    continent: country.continent,
    countryId: country._id,
    visited: true,
    notes: '',
    visitDate: new Date(),
    rating: null,
    category: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && country) {
      fetchVisit();
    }
  }, [open, country]);

  const fetchVisit = async () => {
    try {
      console.log('🔍 CountryDialog: Fetching visits for', country.name, 'with ID:', country._id);
      const visits = await visitsApi.getAllVisits();
      console.log('📝 CountryDialog: Received visits data:', visits);
      
      const existingVisit = visits.find(
        (v: Visit) => {
          console.log('🔍 CountryDialog: Comparing visit countryId:', v.countryId, 'with:', country._id);
          return v.countryId === country._id;
        }
      );
      
      console.log('📍 CountryDialog: Found existing visit:', existingVisit);
      
      if (existingVisit) {
        const updatedVisit = {
          ...existingVisit,
          countryName: country.name,
          continent: country.continent,
          visitDate: existingVisit.visitDate ? new Date(existingVisit.visitDate) : null
        };
        console.log('✅ CountryDialog: Setting existing visit:', updatedVisit);
        setVisit(updatedVisit);
      } else {
        const newVisit = {
          countryName: country.name,
          continent: country.continent,
          countryId: country._id,
          visited: true,
          notes: '',
          visitDate: new Date(),
          rating: null,
          category: null,
        };
        console.log('🆕 CountryDialog: Setting new visit:', newVisit);
        setVisit(newVisit);
      }
    } catch (err: any) {
      console.error('❌ CountryDialog: Error fetching visit data:', err);
      setError('Failed to load visit data');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    console.log('💾 CountryDialog: Starting save for', country.name);
    console.log('💾 CountryDialog: Visit data:', visit);

    try {
      if (visit._id) {
        // Update existing visit
        const updateData = {
          visited: visit.visited,
          notes: visit.notes,
          visitDate: visit.visitDate,
          rating: visit.rating,
          category: visit.category,
        };
        console.log('📤 CountryDialog: Sending update data:', updateData);
        console.log('🔄 CountryDialog: Updating existing visit with ID:', visit._id);
        await visitsApi.updateVisit(visit._id, updateData);
      } else {
        // Create new visit
        const createData = {
          countryId: country._id,
          visited: visit.visited,
          notes: visit.notes,
          visitDate: visit.visitDate,
          rating: visit.rating,
          category: visit.category,
        };
        console.log('📤 CountryDialog: Sending create data:', createData);
        console.log('🆕 CountryDialog: Creating new visit');
        await visitsApi.createCountryVisit(createData);
      }
      
      console.log('✅ CountryDialog: Save successful, calling onSave callback');
      onSave();
      console.log('✅ CountryDialog: Closing dialog');
      onClose();
    } catch (err: any) {
      console.error('❌ CountryDialog: Error saving visit:', err);
      setError('Failed to save visit data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('❌ CountryDialog: Dialog cancelled');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {country.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {country.continent} • {country.code}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={visit.visited}
                onChange={(e) => setVisit({ ...visit, visited: e.target.checked })}
                color="primary"
              />
            }
            label="Mark as visited"
          />
        </Box>

        {visit.visited && (
          <>
            <Box sx={{ mb: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Visit Date"
                  value={visit.visitDate}
                  onChange={(newValue) => setVisit({ ...visit, visitDate: newValue })}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      margin: 'normal'
                    }
                  }}
                />
              </LocalizationProvider>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Overall Rating: {visit.rating !== null ? visit.rating : 'Not rated'}
              </Typography>
              <Slider
                value={visit.rating || 0}
                onChange={(_, value) => setVisit({ ...visit, rating: value as number })}
                step={1}
                marks
                min={0}
                max={10}
                valueLabelDisplay="auto"
                sx={{ mt: 1 }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={visit.category || ''}
                  label="Category"
                  onChange={(e) => setVisit({ ...visit, category: e.target.value as 'Bad' | 'Mid' | 'Good' | null })}
                >
                  <MenuItem value="">Not categorized</MenuItem>
                  <MenuItem value="Bad">Bad</MenuItem>
                  <MenuItem value="Mid">Mid</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={visit.notes}
                onChange={(e) => setVisit({ ...visit, notes: e.target.value })}
                placeholder="Add your thoughts about this country..."
              />
            </Box>
          </>
        )}

        {/* Display rankings if available */}
        {visit.visited && visit.rating !== null && visit.rating !== undefined && visit.category && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Rating:</strong> {visit.rating}/10 • <strong>Category:</strong> {visit.category}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Saving...' : visit._id ? 'Update Visit' : 'Save Visit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CountryDialog;