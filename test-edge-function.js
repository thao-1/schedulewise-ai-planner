// Test script for the generate-schedule Edge Function
import fetch from 'node-fetch';

const preferences = {
  workHours: "9:00 AM - 5:00 PM",
  deepWorkHours: "3",
  personalActivities: ["Reading", "Exercise", "Family time"],
  workoutTime: "Morning",
  meetingPreference: "Afternoon",
  meetingsPerDay: "2",
  autoReschedule: true,
  customPreferences: "I prefer to have lunch around noon."
};

async function testGenerateSchedule() {
  try {
    console.log("Testing generate-schedule Edge Function...");
    console.log("Sending preferences:", JSON.stringify(preferences, null, 2));

    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ preferences }),
    });

    const status = response.status;
    console.log("Response status:", status);

    const data = await response.json();

    if (response.ok) {
      console.log("Success! Received schedule with", data.schedule?.length || 0, "events");
      // Print the first few events as a sample
      if (data.schedule && data.schedule.length > 0) {
        console.log("Sample events:");
        data.schedule.slice(0, 3).forEach((event, index) => {
          console.log(`Event ${index + 1}:`, JSON.stringify(event, null, 2));
        });
      }
    } else {
      console.error("Error:", data.error || "Unknown error");
      console.error("Details:", data.details || "No details provided");
    }
  } catch (error) {
    console.error("Exception:", error.message);
  }
}

testGenerateSchedule();
