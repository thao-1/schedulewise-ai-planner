// Type for valid event types
export type EventType = 
  | 'meeting' 
  | 'deep-work' 
  | 'workout' 
  | 'lunch' 
  | 'breakfast' 
  | 'dinner' 
  | 'learning' 
  | 'relaxation' 
  | 'work' 
  | 'commute' 
  | 'sleep' 
  | 'personal' 
  | 'break' 
  | 'meals'
  | 'other';

// All supported event types with their colors
type KnownEventType = 
  | 'meeting'
  | 'work'
  | 'personal'
  | 'break'
  | 'deep-work'
  | 'learning'
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'workout'
  | 'relaxation'
  | 'commute'
  | 'sleep'
  | 'other';

// Color mapping for all event types
const colorMap: Record<KnownEventType, { bg: string; border: string; text: string }> = {
  // Work related
  'meeting': { bg: 'bg-red-100', border: 'border-red-500 border-l-4', text: 'text-gray-900 font-semibold' },
  'work': { bg: 'bg-blue-100', border: 'border-blue-500 border-l-4', text: 'text-gray-900 font-semibold' },
  'deep-work': { bg: 'bg-indigo-100', border: 'border-indigo-500 border-l-4', text: 'text-gray-900 font-semibold' },
  'learning': { bg: 'bg-purple-100', border: 'border-purple-500 border-l-4', text: 'text-gray-900 font-semibold' },
  
  // Meals
  'breakfast': { bg: 'bg-orange-100', border: 'border-orange-500 border-l-4', text: 'text-gray-900 font-semibold' },
  'lunch': { bg: 'bg-yellow-100', border: 'border-yellow-500 border-l-4', text: 'text-gray-900 font-semibold' },
  'dinner': { bg: 'bg-amber-100', border: 'border-amber-500 border-l-4', text: 'text-gray-900 font-semibold' },
  
  // Personal
  'personal': { bg: 'bg-teal-100', border: 'border-teal-500 border-l-4', text: 'text-gray-900 font-semibold' },
  'workout': { bg: 'bg-green-100', border: 'border-green-500 border-l-4', text: 'text-gray-900 font-semibold' },
  'relaxation': { bg: 'bg-pink-100', border: 'border-pink-500 border-l-4', text: 'text-gray-900 font-semibold' },
  'break': { bg: 'bg-amber-100', border: 'border-amber-500 border-l-4', text: 'text-gray-900 font-semibold' },
  
  // Other
  'commute': { bg: 'bg-gray-200', border: 'border-gray-500 border-l-4', text: 'text-gray-900 font-semibold' },
  'sleep': { bg: 'bg-gray-300', border: 'border-gray-600 border-l-4', text: 'text-gray-900 font-semibold' },
  'other': { bg: 'bg-gray-100', border: 'border-gray-400 border-l-4', text: 'text-gray-900 font-semibold' }
};

/**
 * Get the color classes for an event type
 * @param eventType The type of the event
 * @returns The Tailwind CSS classes for the event type
 */
/**
 * Get the color classes for an event type
 * @param eventType The type of the event
 * @returns The Tailwind CSS classes for the event type
 */
// Helper function to normalize event type strings
export function normalizeEventType(type: string | undefined): KnownEventType {
  if (!type) return 'other';
  
  const lowerType = type.toLowerCase().trim();
  
  // Direct match check first
  if (colorMap.hasOwnProperty(lowerType as KnownEventType)) {
    return lowerType as KnownEventType;
  }
  
  // Common variations and aliases with priority matching
  const typeMap: Record<string, KnownEventType> = {
    // Work related
    'meeting': 'meeting',
    'standup': 'meeting',
    'sync': 'meeting',
    'deep-work': 'deep-work',
    'deep work': 'deep-work',
    'focused work': 'deep-work',
    'focus time': 'deep-work',
    'work session': 'work',
    'work time': 'work',
    'work': 'work',
    
    // Meals - prioritize these exact matches
    'breakfast': 'breakfast',
    'brunch': 'breakfast',
    'lunch': 'lunch',
    'lunch break': 'lunch',
    'dinner': 'dinner',
    'supper': 'dinner',
    
    // Health and exercise
    'workout': 'workout',
    'exercise': 'workout',
    'gym': 'workout',
    'run': 'workout',
    'yoga': 'workout',
    'fitness': 'workout',
    'training': 'workout',
    
    // Personal
    'personal': 'personal',
    'personal time': 'personal',
    'errands': 'personal',
    'shopping': 'personal',
    'family': 'personal',
    'friends': 'personal',
    
    // Learning
    'learning': 'learning',
    'study': 'learning',
    'course': 'learning',
    'education': 'learning',
    'reading': 'learning',
    'research': 'learning',
    
    // Relaxation
    'relaxation': 'relaxation',
    'relax': 'relaxation',
    'downtime': 'relaxation',
    'leisure': 'relaxation',
    'hobby': 'relaxation',
    'tv': 'relaxation',
    'movie': 'relaxation',
    'games': 'relaxation',
    'gaming': 'relaxation',
    
    // Commute
    'commute': 'commute',
    'commuting': 'commute',
    'travel': 'commute',
    'driving': 'commute',
    'transit': 'commute',
    'transport': 'commute',
    
    // Sleep
    'sleep': 'sleep',
    'bedtime': 'sleep',
    'sleeping': 'sleep',
    'rest': 'sleep',
    'nap': 'sleep',
    'night sleep': 'sleep',
    
    // Breaks
    'break': 'break',
    'coffee break': 'break',
    'short break': 'break',
    'long break': 'break',
    'rest break': 'break',
    
    // Fallbacks
    'other': 'other',
    'misc': 'other',
    'miscellaneous': 'other'
  };
  
  // Check for exact matches first
  if (typeMap[lowerType]) {
    return typeMap[lowerType];
  }
  
  // Check for partial matches with priority to more specific terms
  const priorityTerms: KnownEventType[] = [
    // Meals
    'breakfast', 'lunch', 'dinner',
    // Work
    'meeting', 'deep-work', 'work',
    // Exercise
    'workout', 
    // Sleep/rest
    'sleep',
    // Commute
    'commute'
  ];
  
  // Check priority terms first
  for (const term of priorityTerms) {
    if (lowerType.includes(term) || term.includes(lowerType)) {
      return term as KnownEventType;
    }
  }
  
  // Then check all other terms
  for (const [key, value] of Object.entries(typeMap)) {
    if (lowerType.includes(key) || key.includes(lowerType)) {
      return value;
    }
  }
  
  // If we get here, try to guess based on common patterns
  if (lowerType.endsWith('ing') && !['meeting', 'reading', 'training'].includes(lowerType)) {
    const baseType = lowerType.replace(/ing$/, '');
    if (baseType.length > 3) {  // Only if the base word is long enough
      return 'work';
    }
  }
  
  // Default to 'other' if no match found
  return 'other';
}

export function getEventColorVars(eventType: string | undefined): {
  bg: string;
  border: string;
  text: string;
} {
  // Always normalize the event type first
  const normalizedType = normalizeEventType(eventType);
  
  // Get the color mapping for the normalized type
  const colors = colorMap[normalizedType];
  
  // If we have valid colors, return them
  if (colors) {
    return colors;
  }
  
  // Log a warning for unexpected types (helps with debugging)
  if (eventType && eventType !== 'undefined') {
    console.warn(`No color mapping found for event type: "${eventType}" (normalized to: "${normalizedType}")`);
  }
  
  // Always return a valid color set (never undefined)
  return colorMap['other'];
}
