import { SchedulePreferences } from "@/types/schedule";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const generateSchedule = async (preferences: SchedulePreferences) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI scheduler specialized in creating realistic weekly work schedules that optimize productivity and work-life balance.`
          },
          {
            role: "user",
            content: `Based on these user preferences:
- Work hours: ${preferences.workHours}
- Deep work hours needed: ${preferences.deepWorkHours} hours per day
- Personal activities: ${preferences.personalActivities?.join(', ') || 'None'}
- Workout time preference: ${preferences.workoutTime || 'Not specified'}
- Meeting preference: ${preferences.meetingPreference || 'Not specified'}
- Meetings per day: ${preferences.meetingsPerDay || 0}
- Auto-reschedule preference: ${preferences.autoReschedule ? 'Yes' : 'No'}
- Additional custom preferences: ${preferences.customPreferences || 'None specified'}

Please generate a weekly schedule based on these preferences.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate schedule');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content;
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw error;
  }
};
