interface Visit {
  _id: string;
  rating: number;
  category: 'Good' | 'Mid' | 'Bad';
  neighborhoodId?: string;
  countryId?: string;
  notes?: string;
}

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
    // Sort visits by rating (highest first)
    const sortedVisits = visits.sort((a, b) => b.rating - a.rating);
    
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
   * Calculate final rating for the new location
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

    if (visits.length === 0) {
      // First item in category - place in middle
      return (bounds.min + bounds.max) / 2;
    }

    if (insertionPosition === 0) {
      // Better than all existing items
      const bestRating = visits[0].rating;
      return Math.min(bestRating + 0.5, bounds.max);
    }

    if (insertionPosition >= visits.length) {
      // Worse than all existing items
      const worstRating = visits[visits.length - 1].rating;
      return Math.max(worstRating - 0.5, bounds.min);
    }

    // Between two items
    const upperRating = visits[insertionPosition - 1].rating;
    const lowerRating = visits[insertionPosition].rating;
    
    return (upperRating + lowerRating) / 2;
  }

  /**
   * Get final result
   */
  getFinalResult() {
    return {
      rating: this.calculateFinalRating(),
      category: this.category,
      insertionPosition: this.state.low,
      totalVisits: this.state.visits.length
    };
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