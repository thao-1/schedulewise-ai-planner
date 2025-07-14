// Type for valid event types
export type EventType = 
  | 'work'
  | 'meeting'
  | 'meals'
  | 'personal'
  | 'workout'
  | 'sleep';

// All supported event types with their colors
type KnownEventType = EventType;

// Color mapping for all event types
const colorMap: Record<KnownEventType, { bg: string; border: string; text: string }> = {
  // Work related
  'work': { bg: 'bg-blue-100', border: 'border-blue-500 border-l-4', text: 'text-gray-900 font-semibold' },
  'meeting': { bg: 'bg-red-100', border: 'border-red-500 border-l-4', text: 'text-gray-900 font-semibold' },
  
  // Meals - all meals use the same orange color
  'meals': { bg: 'bg-orange-100', border: 'border-orange-400 border-l-4', text: 'text-gray-900 font-semibold' },
  
  // Personal time - using green color
  'personal': { bg: 'bg-green-100', border: 'border-green-500 border-l-4', text: 'text-gray-900 font-semibold' },
  
  // Workout - using purple color
  'workout': { bg: 'bg-purple-100', border: 'border-purple-500 border-l-4', text: 'text-gray-900 font-semibold' },
  
  // Sleep - using gray color
  'sleep': { bg: 'bg-gray-100', border: 'border-gray-400 border-l-4', text: 'text-gray-800 font-medium' }
};

/**
 * Normalize event type string to one of our known event types
 * @param type The event type to normalize
 * @returns A normalized event type
 */
// Type for our event type matchers
type EventTypeMatcher = {
  keywords: string[];
  type: KnownEventType;
  priority?: number; // Higher number means higher priority
};

// Define our event type matchers with priorities
const eventTypeMatchers: EventTypeMatcher[] = [
  // Meals - high priority
  {
    keywords: ['breakfast', 'lunch', 'dinner', 'brunch', 'meal', 'food', 'eating', 'coffee', 'tea', 'snack'],
    type: 'meals',
    priority: 5
  },
  // Sleep - high priority
  {
    keywords: ['sleep', 'bedtime', 'sleeping', 'rest', 'nap', 'night sleep', 'snooze', 'siesta'],
    type: 'sleep',
    priority: 5
  },
  // Workout - medium priority
  {
    keywords: ['workout', 'exercise', 'gym', 'fitness', 'training', 'run', 'yoga', 'jog', 'swim', 'bike', 'cycle', 'lift', 'weights', 'cardio', 'hiit', 'pilates', 'stretch', 'stretching'],
    type: 'workout',
    priority: 4
  },
  // Meetings - medium priority
  {
    keywords: ['meeting', 'meet', 'appointment', 'call', 'standup', 'sync', 'conference', 'interview', 'discussion', 'planning', 'review', 'retro', 'demo', 'presentation', 'workshop', 'team', '1:1', 'one on one', 'one-on-one'],
    type: 'meeting',
    priority: 4
  },
  // Personal - lower priority (catch-all for personal activities and 'other' type)
  {
    keywords: ['personal', 'errands', 'shopping', 'family', 'friends', 'social', 'relax', 'relaxation', 'chill', 'downtime', 'free time', 'me time', 'self care', 'self-care', 'hobby', 'hobbies', 'fun', 'leisure', 'entertainment', 'movie', 'read', 'reading', 'game', 'games', 'play', 'other'],
    type: 'personal',
    priority: 3
  },
  // Work - default fallback (higher priority to catch work-related terms first)
  {
    keywords: [
      'work', 'job', 'office', 'deep work', 'deep_work', 'deepwork', 
      'focused work', 'focus time', 'coding', 'development', 'programming', 
      'design', 'research', 'study', 'learning', 'project', 'task', 'tasks', 
      'work time', 'work session', 'work block', 'focus', 'focused', 'deep', 
      'deep focus', 'deep thinking', 'thinking', 'brainstorming', 'planning', 
      'plan', 'strategy'
    ],
    type: 'work',
    priority: 4  // Increased priority to match meetings
  }
];

export function normalizeEventType(type: string | undefined): KnownEventType {
  // Default to work if type is not provided
  if (!type) return 'work';
  
  const lowerType = type.toLowerCase().trim();
  
  // Direct match in color map
  if (colorMap[lowerType as KnownEventType]) {
    return lowerType as KnownEventType;
  }
  
  // Find all matching matchers
  const matchingMatchers = eventTypeMatchers
    .filter(matcher => 
      matcher.keywords.some(keyword => 
        lowerType.includes(keyword) || 
        lowerType.split(/\s+/).some(word => word === keyword)
      )
    )
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  // Return the highest priority match, or default to work
  if (matchingMatchers.length > 0) {
    return matchingMatchers[0].type;
  }
  
  // Special case for words ending with 'ing'
  if (lowerType.endsWith('ing')) {
    const baseWord = lowerType.replace(/ing$/, '');
    if (baseWord.length > 3) {
      // If it's a verb, it's likely work-related
      return 'work';
    }
  }
  
  // Default to work
  return 'work';
}

export function getEventColorVars(eventType: string | undefined | null): {
  bg: string;
  border: string;
  text: string;
} {
  // Handle undefined or null
  if (eventType === undefined || eventType === null) {
    return colorMap.work;
  }

  // Normalize the event type
  const normalizedType = normalizeEventType(eventType);
  
  // Get the color mapping for the normalized type
  const colors = colorMap[normalizedType];
  
  // If we have valid colors, return them
  if (colors) {
    return colors;
  }
  
  // Log a warning for unexpected types (helps with debugging)
  console.warn(`No color mapping found for event type: "${eventType}" (normalized to: "${normalizedType}")`);
  
  // Return default work colors
  return colorMap.work;
}
