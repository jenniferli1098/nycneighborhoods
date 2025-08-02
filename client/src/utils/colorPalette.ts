// Expanded color palette for neighborhood visualization
// Colors are chosen to be distinct, accessible, and reduce collisions
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
  '#A8E6CF', // Mint Green
  '#FF8A80', // Light Red
  '#82B1FF', // Light Blue
  '#B39DDB', // Light Purple
  '#FFAB91', // Peach
  '#80CBC4', // Light Teal
  '#F8BBD9', // Light Pink
  '#C5E1A5', // Light Green
  '#FFCC02', // Gold
  '#E1BEE7', // Lavender
] as const;

export const DEFAULT_COLOR = '#E8E8E8'; // Light gray for unvisited

/**
 * Better hash function using djb2 algorithm for reduced collisions
 * This provides much better distribution than the simple hash
 */
const djb2Hash = (str: string): number => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
};

/**
 * Get a color for a category based on a hash of the category name.
 * This ensures consistent colors for the same category across sessions.
 * Uses improved hash function to reduce collisions.
 */
export const getCategoryColor = (category: string): string => {
  if (!category) return DEFAULT_COLOR;
  
  // Use djb2 hash for better distribution
  const hash = djb2Hash(category.toLowerCase());
  
  // Use modulo to get consistent index
  const index = hash % NEIGHBORHOOD_COLORS.length;
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
