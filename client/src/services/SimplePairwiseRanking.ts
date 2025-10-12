import { type Visit } from './visitsApi';

interface ComparisonState {
  visits: Visit[];
  currentIndex: number;
  low: number;
  high: number;
  totalComparisons: number;
  currentComparison: number;
}

type CategoryBounds = { min: number; max: number };

const CATEGORY_BOUNDS = {
  'Good': { min: 7.0, max: 10.0 },
  'Mid': { min: 4.0, max: 6.9 },
  'Bad': { min: 0.0, max: 3.9 }
} as const;

const COLLISION_THRESHOLD = 0.01;
const BOUNDARY_THRESHOLD = 0.01;
const MIN_SPACING = 0.15;

export class SimplePairwiseRanking {
  private state: ComparisonState;
  private category: 'Good' | 'Mid' | 'Bad';
  private bounds: CategoryBounds;

  constructor(visits: Visit[], category: 'Good' | 'Mid' | 'Bad') {
    const validVisits = visits.filter((v): v is Visit & { rating: number; category: 'Good' | 'Mid' | 'Bad' } =>
      v.rating !== null && v.category !== null
    ).sort((a, b) => b.rating - a.rating);

    this.category = category;
    this.bounds = CATEGORY_BOUNDS[category];
    this.state = {
      visits: validVisits,
      currentIndex: Math.floor(validVisits.length / 2),
      low: 0,
      high: validVisits.length,
      totalComparisons: validVisits.length > 0 ? Math.ceil(Math.log2(validVisits.length + 1)) : 0,
      currentComparison: 0
    };
  }

  /**
   * Get current comparison question
   */
  getCurrentComparison() {
    if (this.isComplete()) {
      return null;
    }

    return {
      compareVisit: this.state.visits[this.state.currentIndex],
      progress: {
        current: this.state.currentComparison,
        total: this.state.totalComparisons
      }
    };
  }

  /**
   * Process user's choice: is new location better than the current comparison?
   */
  processComparison(newLocationBetter: boolean) {
    if (this.isComplete()) {
      throw new Error('Comparison already complete');
    }

    this.state.currentComparison++;

    if (newLocationBetter) {
      // New location is better, search in upper half
      this.state.high = this.state.currentIndex;
    } else {
      // Existing location is better, search in lower half
      this.state.low = this.state.currentIndex + 1;
    }

    // Update current index for next comparison
    this.state.currentIndex = Math.floor((this.state.low + this.state.high) / 2);
  }

  /**
   * Check if comparison is complete
   */
  isComplete(): boolean {
    return this.state.low >= this.state.high;
  }

  /**
   * Calculate final rating for the new location with collision detection and redistribution
   */
  calculateFinalRating(): number {
    if (!this.isComplete()) {
      throw new Error('Comparison not yet complete');
    }

    const insertionPosition = this.state.low;
    const visits = this.state.visits;

    if (visits.length === 0) {
      return (this.bounds.min + this.bounds.max) / 2;
    }

    const newRating = this.calculateSimpleRating(insertionPosition);
    const hasCollision = this.detectCollision(newRating, insertionPosition, COLLISION_THRESHOLD);

    if (hasCollision) {
      return this.redistributeRatings(insertionPosition, this.bounds);
    }

    return newRating;
  }

  /**
   * Detect if the new rating would cause a collision with neighboring ratings
   */
  private detectCollision(newRating: number, insertionPosition: number, threshold: number): boolean {
    const visits = this.state.visits;

    // Check collision with item above (better rating)
    if (insertionPosition > 0) {
      const upperRating = visits[insertionPosition - 1].rating!;
      if (Math.abs(upperRating - newRating) < threshold) {
        return true;
      }
    }

    // Check collision with item below (worse rating)
    if (insertionPosition < visits.length) {
      const lowerRating = visits[insertionPosition].rating!;
      if (Math.abs(lowerRating - newRating) < threshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Redistribute all ratings in the category to be evenly spaced
   */
  private redistributeRatings(insertionPosition: number, bounds: { min: number; max: number }): number {
    const visits = this.state.visits;
    const totalItems = visits.length + 1; // Include the new item
    const range = bounds.max - bounds.min;
    const spacing = range / (totalItems + 1); // +1 to leave space at boundaries
    
    // Calculate the new rating for the inserted item
    // Higher positions (lower insertionPosition) should get higher ratings
    const newRating = bounds.max - (insertionPosition + 1) * spacing;
    
    // Note: We return the new rating here. The actual redistribution of existing visits
    // would need to be handled at a higher level (in the component that calls this)
    // since this class doesn't have access to update other visits in the database.
    
    return newRating;
  }

  /**
   * Get redistributed ratings for all items in the category
   * This method can be called by the component to update all existing visits
   */
  getRedistributedRatings(insertionPosition: number): Array<{ visit: Visit; newRating: number }> {
    const visits = this.state.visits;
    const totalItems = visits.length + 1;
    const range = this.bounds.max - this.bounds.min;
    const spacing = range / (totalItems + 1);

    return visits.map((visit, index) => {
      const adjustedIndex = index >= insertionPosition ? index + 1 : index;
      const newRating = this.bounds.max - (adjustedIndex + 1) * spacing;
      return { visit, newRating };
    });
  }

  /**
   * Get final result with rating and redistribution information
   */
  getFinalResult() {
    const insertionPosition = this.state.low;
    const newRating = this.calculateFinalRating();
    const needsRedistribution = this.shouldRedistribute(insertionPosition, newRating);

    return {
      rating: newRating,
      category: this.category,
      insertionPosition,
      totalVisits: this.state.visits.length,
      needsRedistribution,
      redistributedRatings: needsRedistribution ? this.getRedistributedRatings(insertionPosition) : undefined
    };
  }

  /**
   * Determine if redistribution is needed based on collision, crowding, or boundary proximity
   */
  private shouldRedistribute(insertionPosition: number, newRating: number): boolean {
    const simpleRating = this.calculateSimpleRating(insertionPosition);
    const hasCollision = this.detectCollision(simpleRating, insertionPosition, COLLISION_THRESHOLD);

    const range = this.bounds.max - this.bounds.min;
    const totalItems = this.state.visits.length + 1;
    const averageSpacing = range / totalItems;
    const isCrowded = averageSpacing < MIN_SPACING;

    const nearUpperBoundary = insertionPosition === 0 && newRating > this.bounds.max - BOUNDARY_THRESHOLD;
    const nearLowerBoundary = insertionPosition >= this.state.visits.length && newRating < this.bounds.min + BOUNDARY_THRESHOLD;
    const nearBoundary = nearUpperBoundary || nearLowerBoundary;

    return hasCollision || isCrowded || nearBoundary;
  }

  /**
   * Calculate rating using the simple method (without redistribution)
   */
  private calculateSimpleRating(insertionPosition: number): number {
    const visits = this.state.visits;

    if (visits.length === 0) {
      return (this.bounds.min + this.bounds.max) / 2;
    }

    if (insertionPosition === 0) {
      return (visits[0].rating! + this.bounds.max) / 2;
    }

    if (insertionPosition >= visits.length) {
      return (visits[visits.length - 1].rating! + this.bounds.min) / 2;
    }

    const upperRating = visits[insertionPosition - 1].rating!;
    const lowerRating = visits[insertionPosition].rating!;
    return (upperRating + lowerRating) / 2;
  }

  /**
   * Get progress information
   */
  getProgress() {
    return {
      current: this.state.currentComparison,
      total: this.state.totalComparisons,
      percentage: this.state.totalComparisons > 0 
        ? (this.state.currentComparison / this.state.totalComparisons) * 100 
        : 100
    };
  }

}