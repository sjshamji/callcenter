// Predefined categories for farming issues
export const FARMING_CATEGORIES = [
  "Pest Control",
  "Irrigation",
  "Fertilizer",
  "Harvesting",
  "Planting",
  "Equipment",
  "Weather",
  "Market Prices"
] as const

export type FarmingCategory = typeof FARMING_CATEGORIES[number] 