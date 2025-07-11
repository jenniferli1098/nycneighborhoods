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
  Slider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import RankingDialog from './RankingDialog';


interface NeighborhoodDialogProps {
  open: boolean;
  onClose: () => void;
  neighborhoodId: string;
  neighborhood: string;
  borough: string;
  onSave: () => void;
  existingVisits?: any[];
  neighborhoods?: any[];
  boroughs?: any[];
}

interface Visit {
  _id?: string;
  userId?: string;
  neighborhoodId?: string;
  neighborhood?: string; // For form display only
  borough?: string; // For form display only
  visited: boolean;
  notes: string;
  visitDate: Date | null;
  rating: number | null;
  category?: 'Bad' | 'Mid' | 'Good' | null;
  walkabilityScore: number | null;
}

const NeighborhoodDialog: React.FC<NeighborhoodDialogProps> = ({
  open,
  onClose,
  neighborhoodId,
  neighborhood,
  borough,
  onSave,
  existingVisits = [],
  neighborhoods = [],
  boroughs = []
}) => {
  const [visit, setVisit] = useState<Visit>({
    neighborhood,
    borough,
    neighborhoodId,
    visited: true,
    notes: '',
    visitDate: new Date(),
    rating: null,
    category: null,
    walkabilityScore: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRanking, setShowRanking] = useState(false);

  useEffect(() => {
    if (open && neighborhoodId && neighborhood && borough) {
      fetchVisit();
    }
  }, [open, neighborhoodId, neighborhood, borough]);

  const fetchVisit = async () => {
    try {
      console.log('🔍 NeighborhoodDialog: Fetching visits for', neighborhood, borough, 'with ID:', neighborhoodId);
      const response = await axios.get('/api/visits');
      console.log('📝 NeighborhoodDialog: Received visits data:', response.data);
      
      const existingVisit = response.data.find(
        (v: any) => {
          console.log('🔍 NeighborhoodDialog: Comparing visit neighborhoodId:', v.neighborhoodId, 'with:', neighborhoodId);
          return v.neighborhoodId === neighborhoodId;
        }
      );
      
      console.log('📍 NeighborhoodDialog: Found existing visit:', existingVisit);
      
      if (existingVisit) {
        const updatedVisit = {
          ...existingVisit,
          neighborhood,
          borough,
          visitDate: existingVisit.visitDate ? new Date(existingVisit.visitDate) : null
        };
        console.log('✅ NeighborhoodDialog: Setting existing visit:', updatedVisit);
        setVisit(updatedVisit);
      } else {
        const newVisit = {
          neighborhood,
          borough,
          neighborhoodId,
          visited: true,
          notes: '',
          visitDate: new Date(),
          rating: null,
          category: null,
          walkabilityScore: null
        };
        console.log('🆕 NeighborhoodDialog: Setting new visit:', newVisit);
        setVisit(newVisit);
      }
    } catch (err: any) {
      console.error('❌ NeighborhoodDialog: Error fetching visit data:', err);
      setError('Failed to load visit data');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    console.log('💾 NeighborhoodDialog: Starting save for', neighborhood, borough);
    console.log('💾 NeighborhoodDialog: Visit data:', visit);

    try {
      if (visit._id) {
        // PUT request - only send visit fields (no lookup fields needed)
        const updateData = {
          visited: true,
          notes: visit.notes,
          visitDate: visit.visitDate,
          rating: visit.rating,
          category: visit.category,
          walkabilityScore: visit.walkabilityScore
        };
        console.log('📤 NeighborhoodDialog: Sending update data:', updateData);
        console.log('🔄 NeighborhoodDialog: Updating existing visit with ID:', visit._id);
        await axios.put(`/api/visits/${visit._id}`, updateData);
      } else {
        // POST request - send lookup fields to find/create neighborhood
        const createData = {
          neighborhoodName: neighborhood,
          boroughName: borough,
          visited: true,
          notes: visit.notes,
          visitDate: visit.visitDate,
          rating: visit.rating,
          category: visit.category,
          walkabilityScore: visit.walkabilityScore
        };
        console.log('📤 NeighborhoodDialog: Sending create data:', createData);
        console.log('🆕 NeighborhoodDialog: Creating new visit');
        await axios.post('/api/visits', createData);
      }
      
      console.log('✅ NeighborhoodDialog: Save successful, calling onSave callback');
      onSave();
      console.log('✅ NeighborhoodDialog: Closing dialog');
      onClose();
    } catch (err: any) {
      console.error('❌ NeighborhoodDialog: Save error:', err);
      console.error('❌ NeighborhoodDialog: Error response:', err.response);
      setError(err.response?.data?.error || 'Failed to save visit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!visit._id) return;

    setLoading(true);
    setError('');

    try {
      await axios.delete(`/api/visits/${visit._id}`);
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete visit');
    } finally {
      setLoading(false);
    }
  };

  const handleRankingComplete = (category: 'Bad' | 'Mid' | 'Good', rating: number) => {
    setVisit({ ...visit, category, rating });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {neighborhood}, {borough}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}
          
          <Box className="space-y-4">
            <DatePicker
              label="Visit Date"
              value={visit.visitDate}
              onChange={(date) => setVisit({ ...visit, visitDate: date })}
              slotProps={{
                textField: {
                  fullWidth: true
                }
              }}
            />
            
            <Box className="flex gap-2 mb-4">
              <Button
                variant="contained"
                onClick={() => setShowRanking(true)}
                fullWidth
              >
                Rank
              </Button>
            </Box>

            {visit.category && visit.rating && (
              <Box>
                <Typography variant="body1" className="mb-2">
                  <strong>Category:</strong> {visit.category} • <strong>Score:</strong> {visit.rating.toFixed(1)}/10.0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use the "Rank" button above to change this rating
                </Typography>
              </Box>
            )}
        
        
        <Box>
          <Typography component="legend" gutterBottom>
            Walkability Score: {visit.walkabilityScore || 0}/100
          </Typography>
          <Slider
            value={visit.walkabilityScore || 0}
            onChange={(_, newValue) => setVisit({ ...visit, walkabilityScore: newValue as number })}
            min={0}
            max={100}
            step={5}
            marks={[
              { value: 0, label: '0' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
              { value: 75, label: '75' },
              { value: 100, label: '100' }
            ]}
            valueLabelDisplay="auto"
            sx={{ mt: 1, mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Rate how walkable this neighborhood is (0 = not walkable, 100 = very walkable)
          </Typography>
        </Box>
        
        <TextField
          fullWidth
          label="Notes"
          multiline
          rows={4}
          value={visit.notes}
          onChange={(e) => setVisit({ ...visit, notes: e.target.value })}
          placeholder="What did you do? What did you like? Any recommendations?"
        />
          </Box>
        </DialogContent>
        
        <DialogActions>
          {visit._id && (
            <Button onClick={handleDelete} color="error" disabled={loading}>
              Unvisit
            </Button>
          )}
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <RankingDialog
        open={showRanking}
        onClose={() => setShowRanking(false)}
        neighborhood={{ name: neighborhood, borough }}
        existingVisits={existingVisits}
        neighborhoods={neighborhoods}
        boroughs={boroughs}
        onRankingComplete={handleRankingComplete}
      />
    </LocalizationProvider>
  );
};

export default NeighborhoodDialog;