// Constants used throughout the application

// Define need types
export const NEED_TYPES = [
  'Fertilizer',
  'Seed Cane',
  'Harvesting',
  'Ploughing',
  'Crop Issues',
  'Pesticide'
];

// Maps database field names to display names
export const NEEDS_MAP = {
  'needs_fertilizer': 'Fertilizer',
  'needs_seed_cane': 'Seed Cane',
  'needs_harvesting': 'Harvesting',
  'needs_ploughing': 'Ploughing',
  'has_crop_issues': 'Crop Issues',
  'needs_pesticide': 'Pesticide'
};

// Color scheme for need types
export const NEED_COLORS = {
  'Fertilizer': '#3b82f6', // blue
  'Seed Cane': '#10b981', // green
  'Harvesting': '#f59e0b', // amber
  'Ploughing': '#8b5cf6', // purple
  'Crop Issues': '#ef4444', // red
  'Pesticide': '#ec4899'  // pink
};

// Farming categories
export const FARMING_CATEGORIES = [
  'Planting',
  'Irrigation',
  'Fertilization',
  'Pest Control',
  'Harvesting',
  'Post-Harvest'
];

// Growth stages for sugarcane
export const GROWTH_STAGES = {
  PLOUGHED: 'ploughed',
  SEEDS: 'seeds',
  GROWING: 'growing',
  MATURE: 'mature',
  HARVESTED: 'harvested'
};

// Activity to growth stage mapping
export const ACTIVITY_TO_GROWTH_STAGE = {
  ploughing: GROWTH_STAGES.PLOUGHED,
  planting: GROWTH_STAGES.SEEDS,
  irrigation: GROWTH_STAGES.GROWING,
  harvesting: GROWTH_STAGES.HARVESTED
};

// Constants for farmer needs and activities
export const ACTIVITIES = {
  PLOUGHING: 'ploughing',
  PLANTING: 'planting',
  IRRIGATION: 'irrigation',
  FERTILIZER: 'fertilizer',
  PESTICIDE: 'pesticide',
  HARVESTING: 'harvesting'
};

// Maps activities to their corresponding need types
export const ACTIVITY_TO_NEED = {
  [ACTIVITIES.PLOUGHING]: 'needs_ploughing',
  [ACTIVITIES.PLANTING]: 'needs_seed_cane',
  [ACTIVITIES.FERTILIZER]: 'needs_fertilizer',
  [ACTIVITIES.PESTICIDE]: 'needs_pesticide',
  [ACTIVITIES.HARVESTING]: 'needs_harvesting'
};

// Maps need types to activities
export const NEED_TO_ACTIVITY = {
  'needs_ploughing': ACTIVITIES.PLOUGHING,
  'needs_seed_cane': ACTIVITIES.PLANTING,
  'needs_fertilizer': ACTIVITIES.FERTILIZER,
  'needs_pesticide': ACTIVITIES.PESTICIDE, 
  'needs_harvesting': ACTIVITIES.HARVESTING
};

// Game constants
export const GAME_CONSTANTS = {
  // Time intervals (in milliseconds)
  DROWNING_INTERVAL: 15000,
  REVIVAL_INTERVAL: 10000,
  ACTION_INTERVAL: 2000,
  
  // Needs decay rates (per second)
  DECAY_RATES: {
    energy: 0.01,
    hydration: 0.015,
    hunger: 0.008
  },
  
  // Need thresholds
  MAX_NEED: 100,
  CRITICAL_NEED: 20,
  
  // Keys for controls
  CONTROL_KEYS: {
    PERFORM_ACTION: 'p'
  }
};

export type FarmingCategory = typeof FARMING_CATEGORIES[number] 