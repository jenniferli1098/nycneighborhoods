// Fixed color palette for neighborhood visualization
// Colors are chosen to be distinct and accessible
export const NEIGHBORHOOD_COLORS = [
  '#FF6B6B', // Red/Coral
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FECA57', // Yellow
  '#FF9FF3', // Pink
  '#54A0FF', // Bright Blue
  '#5F27CD', // Purple
  '#00D2D3', // Cyan
  '#FF9F43', // Orange
] as const;

export const DEFAULT_COLOR = '#E8E8E8'; // Light gray for unvisited

/**
 * Get a color for a category based on a hash of the category name.
 * This ensures consistent colors for the same category across sessions.
 */
export const getCategoryColor = (category: string): string => {
  if (!category) return DEFAULT_COLOR;
  
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    const char = category.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use absolute value and modulo to get consistent index
  const index = Math.abs(hash) % NEIGHBORHOOD_COLORS.length;
  return NEIGHBORHOOD_COLORS[index];
};

/**
 * Get color for a neighborhood based on whether it's visited and its category
 */
export const getNeighborhoodColor = (
  category: string, 
  isVisited: boolean
): string => {
  if (!isVisited) {
    return DEFAULT_COLOR;
  }
  return getCategoryColor(category);
};