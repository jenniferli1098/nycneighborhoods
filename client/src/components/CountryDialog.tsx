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
  ratingType?: string;
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
          visitDate: visit.visitDate ? visit.visitDate.toISOString() : undefined,
          rating: visit.rating,
          eloRating: visit.eloRating,
          category: visit.category,
        };
        console.log('📤 CountryDialog: Sending update data:', updateData);
        console.log('🔄 CountryDialog: Updating existing visit with ID:', visit._id);
        await visitsApi.updateVisit(visit._id, updateData);
      } else {
        // Create new visit
        const createData = {
          countryName: country.name,
          visited: visit.visited,
          notes: visit.notes,
          visitDate: visit.visitDate || undefined,
          rating: visit.rating,
          eloRating: visit.eloRating,
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

  const handleVisitChange = (updates: Partial<BaseVisit>) => {
    setVisit({ ...visit, ...updates });
  };

  const handlePairwiseRankingComplete = (category: 'Good' | 'Mid' | 'Bad', eloRating: number) => {
    setVisit({ ...visit, category, eloRating, rating: eloRating, ratingType: 'elo' });
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