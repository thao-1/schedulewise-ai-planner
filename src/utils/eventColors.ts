import { type EventType } from '@/server/types/ScheduleTypes';

export const getEventColor = (type: EventType): string => {
  const colors: { [key in EventType]: string } = {
    'meeting': 'bg-red-100 border-red-300',
    'deep-work': 'bg-green-100 border-green-300',
    'workout': 'bg-yellow-100 border-yellow-300',
    'meals': 'bg-orange-100 border-orange-300',
    'learning': 'bg-purple-100 border-purple-300',
    'relaxation': 'bg-blue-100 border-blue-300',
    'work': 'bg-indigo-100 border-indigo-300',
    'break': 'bg-pink-100 border-pink-300',
    'personal': 'bg-teal-100 border-teal-300',
    'commute': 'bg-gray-100 border-gray-300',
    'sleep': 'bg-slate-100 border-slate-300',
  };
  return colors[type] || 'bg-gray-100 border-gray-300';
};
