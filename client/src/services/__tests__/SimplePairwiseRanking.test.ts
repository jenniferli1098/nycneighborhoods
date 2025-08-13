import { SimplePairwiseRanking } from '../SimplePairwiseRanking';
import { type Visit } from '../visitsApi';

// Mock Visit interface for testing
interface MockVisit extends Omit<Visit, '_id' | 'user' | 'createdAt' | 'updatedAt'> {
  _id: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

const createMockVisit = (
  id: string, 
  name: string, 
  rating: number, 
  category: 'Good' | 'Mid' | 'Bad'
): MockVisit => ({
  _id: id,
  user: 'test-user',
  visitType: 'neighborhood' as const,
  neighborhood: `neighborhood-${id}`,
  visited: true,
  notes: `Notes for ${name}`,
  visitDate: '2024-01-01',
  rating,
  category,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
});

describe('SimplePairwiseRanking - Redistribution Tests', () => {
  describe('redistributeRatings via getRedistributedRatings', () => {
    test('should redistribute 3 visits evenly in Good category', () => {
      const visits = [
        createMockVisit('1', 'Place A', 9.5, 'Good'),
        createMockVisit('2', 'Place B', 8.8, 'Good'),
        createMockVisit('3', 'Place C', 7.2, 'Good'),
      ];

      const ranking = new SimplePairwiseRanking(visits, 'Good');
      const insertionPosition = 1; // Insert between Place A and Place B
      
      const redistributed = ranking.getRedistributedRatings(insertionPosition);
      
      // Good category bounds: 7.0 - 10.0 (range = 3.0)
      // 4 total items (3 existing + 1 new)
      // spacing = 3.0 / (4 + 1) = 0.6
      // Formula: bounds.max - (adjustedIndex + 1) * spacing
      // Expected ratings: 9.4, 8.2, 8.8 (Place A stays highest, then new item, then B, then C)
      
      expect(redistributed).toHaveLength(3);
      
      // Check that ratings are evenly distributed - Place A should get highest (9.4), B gets 8.2, C gets 7.6
      const expectedRatings = [9.4, 8.2, 7.6]; // Place A at pos 0, B at pos 2, C at pos 3
      redistributed.forEach((item, index) => {
        expect(item.newRating).toBeCloseTo(expectedRatings[index], 2);
      });
      
      // Verify order is maintained (highest rating visit should get highest redistributed rating)
      expect(redistributed[0].visit.rating).toBe(9.5); // Place A
      expect(redistributed[1].visit.rating).toBe(8.8); // Place B  
      expect(redistributed[2].visit.rating).toBe(7.2); // Place C
    });

    test('should redistribute 2 visits in Mid category with insertion at beginning', () => {
      const visits = [
        createMockVisit('1', 'Place A', 6.0, 'Mid'),
        createMockVisit('2', 'Place B', 5.0, 'Mid'),
      ];

      const ranking = new SimplePairwiseRanking(visits, 'Mid');
      const insertionPosition = 0; // Insert at beginning (better than all)
      
      const redistributed = ranking.getRedistributedRatings(insertionPosition);
      
      // Mid category bounds: 4.0 - 6.9 (range = 2.9)
      // 3 total items (2 existing + 1 new)
      // spacing = 2.9 / (3 + 1) = 0.725
      // Expected ratings for existing: 5.45, 6.175 (new would be at 4.725)
      
      expect(redistributed).toHaveLength(2);
      expect(redistributed[0].newRating).toBeCloseTo(5.45, 2);  // Place A moves to position 1
      expect(redistributed[1].newRating).toBeCloseTo(6.175, 2); // Place B moves to position 2
    });

    test('should redistribute 1 visit in Bad category with insertion at end', () => {
      const visits = [
        createMockVisit('1', 'Place A', 2.0, 'Bad'),
      ];

      const ranking = new SimplePairwiseRanking(visits, 'Bad');
      const insertionPosition = 1; // Insert at end (worse than existing)
      
      const redistributed = ranking.getRedistributedRatings(insertionPosition);
      
      // Bad category bounds: 0.0 - 3.9 (range = 3.9)
      // 2 total items (1 existing + 1 new)
      // spacing = 3.9 / (2 + 1) = 1.3
      // Expected ratings: 1.3 (existing), 2.6 (new would be here)
      
      expect(redistributed).toHaveLength(1);
      expect(redistributed[0].newRating).toBeCloseTo(1.3, 2);
    });

    test('should handle insertion in middle of 5 visits', () => {
      const visits = [
        createMockVisit('1', 'Place A', 9.8, 'Good'),
        createMockVisit('2', 'Place B', 9.0, 'Good'),
        createMockVisit('3', 'Place C', 8.5, 'Good'),
        createMockVisit('4', 'Place D', 8.0, 'Good'),
        createMockVisit('5', 'Place E', 7.5, 'Good'),
      ];

      const ranking = new SimplePairwiseRanking(visits, 'Good');
      const insertionPosition = 2; // Insert at position 2 (between Place B and Place C)
      
      const redistributed = ranking.getRedistributedRatings(insertionPosition);
      
      // Good category bounds: 7.0 - 10.0 (range = 3.0)
      // 6 total items (5 existing + 1 new)
      // spacing = 3.0 / (6 + 1) = 0.4286
      // Expected positions: A=0, B=1, NEW=2, C=3, D=4, E=5
      // Expected ratings: 7.43, 7.86, 8.29, 8.71, 9.14, 9.57
      
      expect(redistributed).toHaveLength(5);
      
      const expectedRatings = [7.43, 7.86, 8.71, 9.14, 9.57]; // Skip position 2 (new item)
      redistributed.forEach((item, index) => {
        expect(item.newRating).toBeCloseTo(expectedRatings[index], 2);
      });
    });

    test('should maintain relative order of existing visits', () => {
      const visits = [
        createMockVisit('1', 'Highest', 9.9, 'Good'),
        createMockVisit('2', 'Middle', 8.5, 'Good'),
        createMockVisit('3', 'Lowest', 7.1, 'Good'),
      ];

      const ranking = new SimplePairwiseRanking(visits, 'Good');
      const insertionPosition = 1; // Insert between Highest and Middle
      
      const redistributed = ranking.getRedistributedRatings(insertionPosition);
      
      // Good category bounds: 7.0 - 10.0 (range = 3.0)
      // 4 total items (3 existing + 1 new)
      // spacing = 3.0 / (4 + 1) = 0.6
      // Expected positions after insertion at pos 1:
      // Position 0: Highest (stays) -> rating 7.6
      // Position 1: NEW ITEM -> rating 8.2  
      // Position 2: Middle (moves from pos 1) -> rating 8.8
      // Position 3: Lowest (moves from pos 2) -> rating 9.4
      
      expect(redistributed).toHaveLength(3);
      expect(redistributed[0].visit._id).toBe('1'); // Highest at position 0
      expect(redistributed[1].visit._id).toBe('2'); // Middle now at position 2 
      expect(redistributed[2].visit._id).toBe('3'); // Lowest now at position 3
      
      // Check the actual redistributed ratings
      expect(redistributed[0].newRating).toBeCloseTo(7.6, 1); // Highest gets 7.6
      expect(redistributed[1].newRating).toBeCloseTo(8.8, 1); // Middle gets 8.8  
      expect(redistributed[2].newRating).toBeCloseTo(9.4, 1); // Lowest gets 9.4
      
      // Verify relative order is maintained (higher original rating = higher redistributed rating)
      expect(redistributed[2].newRating).toBeGreaterThan(redistributed[1].newRating); // Lowest > Middle
      expect(redistributed[1].newRating).toBeGreaterThan(redistributed[0].newRating); // Middle > Highest
    });

    test('should work with visits that have identical original ratings', () => {
      const visits = [
        createMockVisit('1', 'Place A', 8.5, 'Good'),
        createMockVisit('2', 'Place B', 8.5, 'Good'), // Same rating
        createMockVisit('3', 'Place C', 8.5, 'Good'), // Same rating
      ];

      const ranking = new SimplePairwiseRanking(visits, 'Good');
      const insertionPosition = 1;
      
      const redistributed = ranking.getRedistributedRatings(insertionPosition);
      
      expect(redistributed).toHaveLength(3);
      // All should get different redistributed ratings
      const ratings = redistributed.map(r => r.newRating);
      const uniqueRatings = new Set(ratings);
      expect(uniqueRatings.size).toBe(3); // All ratings should be unique
    });

  });

  describe('getFinalResult with redistribution', () => {
    test('should indicate redistribution is needed when collision detected', () => {
      // Create visits at the boundary where collision is guaranteed
      const visits = [
        createMockVisit('1', 'Place A', 10.0, 'Good'), // At max boundary
        createMockVisit('2', 'Place B', 9.999, 'Good'), // Very close to max
      ];

      const ranking = new SimplePairwiseRanking(visits, 'Good');
      
      // Complete the comparison process to insert at position 0 (better than all)
      // This will cause the new item to be placed at the category boundary (10.0)
      // which will collide with the existing 10.0 rating
      while (!ranking.isComplete()) {
        // Choose to insert at position 0 (better than all) to trigger boundary collision
        ranking.processComparison(true); // New location IS better than current comparison
      }
      
      const finalResult = ranking.getFinalResult();
      
      expect(finalResult.needsRedistribution).toBe(true);
      expect(finalResult.redistributedRatings).toBeDefined();
      expect(finalResult.redistributedRatings).toHaveLength(2);
    });

    test('should not indicate redistribution when no collision', () => {
      const visits = [
        createMockVisit('1', 'Place A', 9.0, 'Good'),
        createMockVisit('2', 'Place B', 8.0, 'Good'), // Sufficient gap - no collision
      ];

      const ranking = new SimplePairwiseRanking(visits, 'Good');
      
      // Complete the comparison process to insert between visits
      while (!ranking.isComplete()) {
        // Insert between the two visits (worse than A, better than B)
        ranking.processComparison(false); // New location is NOT better than current comparison
      }
      
      const finalResult = ranking.getFinalResult();
      
      expect(finalResult.needsRedistribution).toBe(false);
      expect(finalResult.redistributedRatings).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    test('should handle empty visits array', () => {
      const ranking = new SimplePairwiseRanking([], 'Good');
      const redistributed = ranking.getRedistributedRatings(0);
      
      expect(redistributed).toHaveLength(0);
    });

    test('should handle single visit redistribution', () => {
      const visits = [
        createMockVisit('1', 'Only Place', 8.0, 'Good'),
      ];

      const ranking = new SimplePairwiseRanking(visits, 'Good');
      const redistributed = ranking.getRedistributedRatings(0); // Insert at beginning
      
      expect(redistributed).toHaveLength(1);
      // With 2 total items (1 existing + 1 new), spacing = 3.0/3 = 1.0
      // Existing item moves to position 1: 7.0 + (1+1) * 1.0 = 9.0
      expect(redistributed[0].newRating).toBeCloseTo(9.0, 2);
    });

    test('should respect category boundaries', () => {
      const visits = [
        createMockVisit('1', 'Place A', 4.5, 'Mid'),
        createMockVisit('2', 'Place B', 4.2, 'Mid'),
      ];

      const ranking = new SimplePairwiseRanking(visits, 'Mid');
      const redistributed = ranking.getRedistributedRatings(1);
      
      // All redistributed ratings should be within Mid bounds (4.0 - 6.9)
      redistributed.forEach(item => {
        expect(item.newRating).toBeGreaterThanOrEqual(4.0);
        expect(item.newRating).toBeLessThanOrEqual(6.9);
      });
    });
  });
});