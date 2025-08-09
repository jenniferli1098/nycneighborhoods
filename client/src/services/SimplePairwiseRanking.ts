import { type Visit } from './visitsApi';

interface ComparisonState {
  visits: Visit[];
  currentIndex: number;
  low: number;
  high: number;
  totalComparisons: number;
  currentComparison: number;
}

export class SimplePairwiseRanking {
  private state: ComparisonState;
  private category: 'Good' | 'Mid' | 'Bad';

  constructor(visits: Visit[], category: 'Good' | 'Mid' | 'Bad') {
    // Filter out visits with null ratings and sort by rating (highest first)
    const validVisits = visits.filter((v): v is Visit & { rating: number; category: 'Good' | 'Mid' | 'Bad' } => 
      v.rating !== null && v.category !== null
    );
    const sortedVisits = validVisits.sort((a, b) => b.rating - a.rating);
    
    this.category = category;
    this.state = {
      visits: sortedVisits,
      currentIndex: Math.floor(sortedVisits.length / 2),
      low: 0,
      high: sortedVisits.length,
      totalComparisons: sortedVisits.length > 0 ? Math.ceil(Math.log2(sortedVisits.length + 1)) : 0,
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

    // Category bounds
    const categoryBounds = {
      'Good': { min: 7.0, max: 10.0 },
      'Mid': { min: 4.0, max: 6.9 },
      'Bad': { min: 0.0, max: 3.9 }
    };

    const bounds = categoryBounds[this.category];
    const COLLISION_THRESHOLD = 0.001; // If ratings are closer than this, it's a collision

    if (visits.length === 0) {
      // First item in category - place in middle
      return (bounds.min + bounds.max) / 2;
    }

    // Calculate initial rating using the simple method
    let newRating: number;

    if (insertionPosition === 0) {
      // Better than all existing items
      const bestRating = visits[0].rating!;
      newRating = (bestRating +  bounds.max) / 2;
    } else if (insertionPosition >= visits.length) {
      // Worse than all existing items
      const worstRating = visits[visits.length - 1].rating!;
      newRating = (worstRating +  bounds.min) / 2;
    } else {
      // Between two items
      const upperRating = visits[insertionPosition - 1].rating!;
      const lowerRating = visits[insertionPosition].rating!;
      newRating = (upperRating + lowerRating) / 2;
    }

    // Check for collisions with neighbors
    const hasCollision = this.detectCollision(newRating, insertionPosition, COLLISION_THRESHOLD);

    if (hasCollision) {
      // Redistribute all ratings to avoid collisions
      return this.redistributeRatings(insertionPosition, bounds);
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
    // Items are distributed as: bounds.min + spacing, bounds.min + 2*spacing, ..., bounds.min + totalItems*spacing
    const newRating = bounds.min + (insertionPosition + 1) * spacing;
    
    // Note: We return the new rating here. The actual redistribution of existing visits
    // would need to be handled at a higher level (in the component that calls this)
    // since this class doesn't have access to update other visits in the database.
    
    return newRating;
  }

  /**
   * Get redistributed ratings for all items in the category (including the new one)
   * This method can be called by the component to update all existing visits
   */
  getRedistributedRatings(insertionPosition: number): Array<{ visit: Visit; newRating: number }> {
    const visits = this.state.visits;
    const categoryBounds = {
      'Good': { min: 7.0, max: 10.0 },
      'Mid': { min: 4.0, max: 6.9 },
      'Bad': { min: 0.0, max: 3.9 }
    };
    
    const bounds = categoryBounds[this.category];
    const totalItems = visits.length + 1;
    const range = bounds.max - bounds.min;
    const spacing = range / (totalItems + 1);
    
    const redistributedRatings: Array<{ visit: Visit; newRating: number }> = [];
    
    // Redistribute existing visits
    visits.forEach((visit, index) => {
      // Adjust index based on insertion position
      const adjustedIndex = index >= insertionPosition ? index + 1 : index;
      const newRating = bounds.min + (adjustedIndex + 1) * spacing;
      redistributedRatings.push({ visit, newRating });
    });
    
    return redistributedRatings;
  }

  /**
   * Get final result
   */
  getFinalResult() {
    const insertionPosition = this.state.low;
    const newRating = this.calculateFinalRating();
    
    // Check if redistribution was needed
    const COLLISION_THRESHOLD = 0.005;
    const simpleRating = this.calculateSimpleRating(insertionPosition);
    const needsRedistribution = this.detectCollision(simpleRating, insertionPosition, COLLISION_THRESHOLD);
    
    return {
      rating: newRating,
      category: this.category,
      insertionPosition: insertionPosition,
      totalVisits: this.state.visits.length,
      needsRedistribution: needsRedistribution,
      redistributedRatings: needsRedistribution ? this.getRedistributedRatings(insertionPosition) : undefined
    };
  }

  /**
   * Calculate rating using the simple method (without redistribution)
   */
  private calculateSimpleRating(insertionPosition: number): number {
    const visits = this.state.visits;
    const categoryBounds = {
      'Good': { min: 7.0, max: 10.0 },
      'Mid': { min: 4.0, max: 6.9 },
      'Bad': { min: 0.0, max: 3.9 }
    };
    const bounds = categoryBounds[this.category];

    if (visits.length === 0) {
      return (bounds.min + bounds.max) / 2;
    }

    if (insertionPosition === 0) {
      const bestRating = visits[0].rating!;
      return Math.min(bestRating + 0.5, bounds.max);
    }

    if (insertionPosition >= visits.length) {
      const worstRating = visits[visits.length - 1].rating!;
      return Math.max(worstRating - 0.5, bounds.min);
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