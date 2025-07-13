// Color mapping for different event types
export const EVENT_COLORS = {
  'meeting': 'bg-red-100 border-red-300 text-red-800',
  'deep-work': 'bg-green-100 border-green-300 text-green-800',
  'workout': 'bg-yellow-100 border-yellow-300 text-yellow-800',
  'meals': 'bg-orange-100 border-orange-300 text-orange-800',
  'learning': 'bg-purple-100 border-purple-300 text-purple-800',
  'relaxation': 'bg-blue-100 border-blue-300 text-blue-800',
  'work': 'bg-indigo-100 border-indigo-300 text-indigo-800',
  'commute': 'bg-gray-100 border-gray-300 text-gray-800',
  'sleep': 'bg-slate-100 border-slate-300 text-slate-800',
  'personal': 'bg-pink-100 border-pink-300 text-pink-800',
  'break': 'bg-gray-200 border-gray-400 text-gray-800',
  'other': 'bg-gray-100 border-gray-300 text-gray-800',
} as const;

// Type for valid event types
export type EventType = keyof typeof EVENT_COLORS;

/**
 * Get the color classes for an event type
 * @param eventType The type of the event
 * @returns The Tailwind CSS classes for the event type
 */
export function getEventColor(eventType: string): string {
  // Normalize the event type by converting to lowercase and removing any spaces or special characters
  const normalizedType = eventType.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  // Try to find a matching color, fall back to 'other' if not found
  return EVENT_COLORS[normalizedType as EventType] || EVENT_COLORS.other;
}
