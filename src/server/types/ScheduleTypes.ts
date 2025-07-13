export type EventType = 
  | 'work' 
  | 'meeting' 
  | 'deep-work' 
  | 'workout' 
  | 'breakfast' 
  | 'lunch' 
  | 'dinner' 
  | 'meals' 
  | 'break' 
  | 'personal' 
  | 'learning' 
  | 'relaxation' 
  | 'commute' 
  | 'sleep'
  | 'other';

export interface ScheduleEvent {
  id?: string;
  title: string;
  day: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  hour: number; // 0-23.75, can be decimal like 7.5 for 7:30
  duration: number; // in hours, can be decimal
  type: EventType;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  isRecurring?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface ScheduleResponse {
  success: boolean;
  data: ScheduleEvent[];
  error?: string;
  message?: string;
  eventTypes?: EventType[];
}
