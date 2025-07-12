
export type PreferencesKey = 
  | 'workHours' 
  | 'deepWorkHours' 
  | 'personalActivities' 
  | 'workoutTime' 
  | 'meetingPreference' 
  | 'meetingsPerDay' 
  | 'autoReschedule' 
  | 'customPreferences';

export interface Preferences {
  workHours: string;
  deepWorkHours: string;
  personalActivities: string[];
  workoutTime: string;
  meetingPreference: string;
  meetingsPerDay: string;
  autoReschedule: boolean;
  customPreferences: string;
}
