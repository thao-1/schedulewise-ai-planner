export interface ScheduleEvent {
  title: string;
  day: number;
  hour: number;
  duration: number;
  type: string;
  description?: string;
}

export interface SchedulePreferences {
  workHours: string;
  deepWorkHours: number;
  personalActivities: string[];
  workoutTime: string;
  meetingPreference: string;
  meetingsPerDay: number;
  autoReschedule: boolean;
  customPreferences?: string;
}

export interface ScheduleResponse {
  success: boolean;
  schedule: ScheduleEvent[];
  message?: string;
}
