export type EventType = 'work' | 'meeting' | 'deep-work' | 'workout' | 'meals' | 'break' | 'personal' | 'learning' | 'relaxation' | 'commute' | 'sleep';

export interface ScheduleEvent {
  id?: string;
  title: string;
  day: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  hour: number; // 0-23, can be decimal like 7.5 for 7:30
  duration: number; // in hours, can be decimal
  type: EventType;
  description?: string;
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
