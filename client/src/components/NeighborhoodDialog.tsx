import React, { useState, useEffect } from 'react';
import { visitsApi } from '../services/visitsApi';
import BaseVisitDialog from './shared/BaseVisitDialog';
import VisitFormFields, { type BaseVisit } from './shared/VisitFormFields';
import PairwiseRankingDialog, { type RankableEntity } from './PairwiseRankingDialog';


interface NeighborhoodDialogProps {
  open: boolean;
  onClose: () => void;
  neighborhoodId: string;
  neighborhood: string;
  borough: string;
  onSave: () => void;
}

interface Visit extends BaseVisit {
  _id?: string;
  userId?: string;
  neighborhoodId?: string;
  neighborhood?: string; // For form display only
  borough?: string; // For form display only
  ratingType?: string;
}

const NeighborhoodDialog: React.FC<NeighborhoodDialogProps> = ({
  open,
  onClose,
  neighborhoodId,
  neighborhood,
  borough,
  onSave
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const [showPairwiseRanking, setShowPairwiseRanking] = useState(false);

  useEffect(() => {
    if (open && neighborhoodId && neighborhood && borough) {
      fetchVisit();
    }
  }, [open, neighborhoodId, neighborhood, borough]);

  const fetchVisit = async () => {
    try {
      console.log('🔍 NeighborhoodDialog: Fetching visits for', neighborhood, borough, 'with ID:', neighborhoodId);
      const visits = await visitsApi.getAllVisits();
      console.log('📝 NeighborhoodDialog: Received visits data:', visits);
      
      const existingVisit = visits.find(
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
    // Check for validation errors before proceeding
    if (hasValidationErrors) {
      setError('Notes contain inappropriate language. Please use appropriate language and try again.');
      return;
    }

    setLoading(true);
    setError('');
    
    console.log('💾 NeighborhoodDialog: Starting save for', neighborhood, borough);
    console.log('💾 NeighborhoodDialog: Visit data:', visit);

    try {
      if (visit._id) {
        // PUT request - only send visit fields (no lookup fields needed)
        const updateData = {
          visited: visit.visited,
          notes: visit.notes,
          visitDate: visit.visitDate ? visit.visitDate.toISOString() : undefined,
          rating: visit.rating,
          eloRating: visit.eloRating,
          category: visit.category,
        };
        console.log('📤 NeighborhoodDialog: Sending update data:', updateData);
        console.log('🔄 NeighborhoodDialog: Updating existing visit with ID:', visit._id);
        await visitsApi.updateVisit(visit._id, updateData);
      } else {
        // POST request - send lookup fields to find/create neighborhood
        const createData = {
          neighborhoodName: neighborhood,
          boroughName: borough,
          visited: visit.visited,
          notes: visit.notes,
          visitDate: visit.visitDate || undefined,
          rating: visit.rating,
          eloRating: visit.eloRating,
          category: visit.category,
        };
        console.log('📤 NeighborhoodDialog: Sending create data:', createData);
        console.log('🆕 NeighborhoodDialog: Creating new visit');
        await visitsApi.createNeighborhoodVisit(createData);
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
      await visitsApi.deleteVisit(visit._id);
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete visit');
    } finally {
      setLoading(false);
    }
  };

  const handlePairwiseRankingComplete = (category: 'Good' | 'Mid' | 'Bad', eloRating: number) => {
    setVisit({ ...visit, category, eloRating, rating: eloRating, ratingType: 'elo' });
  };

  const handleVisitChange = (updates: Partial<BaseVisit>) => {
    setVisit({ ...visit, ...updates });
  };

  const entity: RankableEntity = {
    name: neighborhood,
    location: borough
  };

  return (
    <>
      <BaseVisitDialog
        open={open}
        onClose={onClose}
        title={`${neighborhood}, ${borough}`}
        loading={loading}
        error={error}
        onSave={handleSave}
        onDelete={visit._id ? handleDelete : undefined}
        saveButtonText="Save"
        deleteButtonText="Unvisit"
        showDeleteButton={!!visit._id}
      >
        <VisitFormFields
          visit={visit}
          onVisitChange={handleVisitChange}
          showRankingButton={true}
          onRankingClick={() => setShowPairwiseRanking(true)}
          ratingButtonText="Rank"
          onValidationChange={setHasValidationErrors}
        />
      </BaseVisitDialog>

      <PairwiseRankingDialog
        open={showPairwiseRanking}
        onClose={() => setShowPairwiseRanking(false)}
        entity={entity}
        visitType="neighborhood"
        locationData={{
          neighborhoodName: neighborhood,
          boroughName: borough,
          visited: visit.visited,
          notes: visit.notes,
          visitDate: visit.visitDate?.toISOString()
        }}
        onRankingComplete={handlePairwiseRankingComplete}
      />
    </>
  );
};

export default NeighborhoodDialog;