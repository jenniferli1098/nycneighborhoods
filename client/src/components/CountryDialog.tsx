import React, { useState, useEffect } from 'react';
import { visitsApi, type Visit } from '../services/visitsApi';
import { type Country } from '../services/countriesApi';
import BaseVisitDialog from './shared/BaseVisitDialog';
import VisitFormFields, { type BaseVisit } from './shared/VisitFormFields';
import PairwiseRankingDialog, { type RankableEntity } from './PairwiseRankingDialog';

interface CountryDialogProps {
  open: boolean;
  onClose: () => void;
  country: Country;
  onSave: () => void;
}

interface CountryVisit extends BaseVisit {
  _id?: string;
  userId?: string;
  countryId?: string;
  countryName?: string; // For form display only
  continent?: string; // For form display only
}

const CountryDialog: React.FC<CountryDialogProps> = ({
  open,
  onClose,
  country,
  onSave
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
  const [showPairwiseRanking, setShowPairwiseRanking] = useState(false);

  useEffect(() => {
    if (open && country) {
      fetchVisit();
    }
  }, [open, country]);

  const fetchVisit = async () => {
    try {
      const visits = await visitsApi.getAllVisits();
      
      const existingVisit = visits.find(
        (v: Visit) => {
          // Handle both populated (object) and non-populated (string) countryId
          if (typeof v.countryId === 'string') {
            return v.countryId === country._id;
          } else if (v.countryId && typeof v.countryId === 'object') {
            return (v.countryId as any)._id === country._id;
          }
          return false;
        }
      );
      
      if (existingVisit) {
        const updatedVisit = {
          ...existingVisit,
          countryName: country.name,
          continent: country.continent,
          visitDate: existingVisit.visitDate ? new Date(existingVisit.visitDate) : null
        };
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
        setVisit(newVisit);
      }
    } catch (err: any) {
      setError('Failed to load visit data');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      if (visit._id) {
        // Update existing visit
        const updateData = {
          visited: visit.visited,
          notes: visit.notes,
          visitDate: visit.visitDate ? visit.visitDate.toISOString() : undefined,
          rating: visit.rating,
          category: visit.category,
        };
        await visitsApi.updateVisit(visit._id, updateData);
      } else {
        // Create new visit
        const createData = {
          countryName: country.name,
          visited: visit.visited,
          notes: visit.notes,
          visitDate: visit.visitDate || undefined,
          rating: visit.rating,
          category: visit.category,
        };
        await visitsApi.createCountryVisit(createData);
      }
      
      onSave();
      onClose();
    } catch (err: any) {
      setError('Failed to save visit data');
    } finally {
      setLoading(false);
    }
  };

  const handleVisitChange = (updates: Partial<BaseVisit>) => {
    setVisit({ ...visit, ...updates });
  };

  const handlePairwiseRankingComplete = (category: 'Good' | 'Mid' | 'Bad', rating: number) => {
    setVisit({ ...visit, category, rating });
  };

  const entity: RankableEntity = {
    name: country.name,
    location: country.continent
  };

  return (
    <>
      <BaseVisitDialog
        open={open}
        onClose={onClose}
        title={`${country.name}, ${country.continent}`}
        subtitle={country.code}
        loading={loading}
        error={error}
        onSave={handleSave}
        saveButtonText="Save"
        showDeleteButton={false}
      >
        <VisitFormFields
          visit={visit}
          onVisitChange={handleVisitChange}
          showRankingButton={true}
          onRankingClick={() => setShowPairwiseRanking(true)}
          ratingButtonText={visit.rating ? "Re-rank" : "Rank"}
        />
      </BaseVisitDialog>

      <PairwiseRankingDialog
        open={showPairwiseRanking}
        onClose={() => setShowPairwiseRanking(false)}
        entity={entity}
        visitType="country"
        locationData={{
          countryName: country.name,
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

export default CountryDialog;