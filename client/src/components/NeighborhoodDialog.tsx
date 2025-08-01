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
      const visits = await visitsApi.getAllVisits();
      
      const existingVisit = visits.find(
        (v: any) => {
          // Handle both populated (object) and non-populated (string) neighborhood
          if (typeof v.neighborhood === 'string') {
            return v.neighborhood === neighborhoodId;
          } else if (v.neighborhood && typeof v.neighborhood === 'object') {
            return (v.neighborhood as any)._id === neighborhoodId;
          }
          return false;
        }
      );
      
      if (existingVisit) {
        const updatedVisit = {
          ...existingVisit,
          neighborhood,
          borough,
          visitDate: existingVisit.visitDate ? new Date(existingVisit.visitDate) : null
        };
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
        setVisit(newVisit);
      }
    } catch (err: any) {
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

    try {
      if (visit._id) {
        // PUT request - only send visit fields (no lookup fields needed)
        const updateData = {
          visited: visit.visited,
          notes: visit.notes,
          visitDate: visit.visitDate ? visit.visitDate.toISOString() : undefined,
          rating: visit.rating,
          category: visit.category,
        };
        await visitsApi.updateVisit(visit._id, updateData);
      } else {
        // POST request - send lookup fields to find/create neighborhood
        const createData = {
          neighborhoodName: neighborhood,
          districtName: borough,
          visited: visit.visited,
          notes: visit.notes,
          visitDate: visit.visitDate || undefined,
          rating: visit.rating,
          category: visit.category,
        };
        await visitsApi.createNeighborhoodVisit(createData);
      }
      
      onSave();
      onClose();
    } catch (err: any) {
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

  const handlePairwiseRankingComplete = (category: 'Good' | 'Mid' | 'Bad', rating: number) => {
    setVisit({ ...visit, category, rating });
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
          ratingButtonText={visit.rating ? "Re-rank" : "Rank"}
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
          districtName: borough,
          visited: visit.visited,
          notes: visit.notes,
          visitDate: visit.visitDate?.toISOString()
        }}
        onRankingComplete={handlePairwiseRankingComplete}
        existingRating={visit.rating && visit.category && visit._id ? {
          rating: visit.rating,
          category: visit.category,
          visitId: visit._id
        } : undefined}
      />
    </>
  );
};

export default NeighborhoodDialog;