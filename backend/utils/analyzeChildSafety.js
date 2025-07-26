import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MODEL_NAME = 'gemini-1.5-flash'; // Change to 'gemini-pro' or other model if needed
const API_KEY = process.env.GEMINI_API_KEY;

function formatIsoToIST(isoDateString) {
  // 1. Create a Date object from the ISO string.
  // The Date constructor correctly parses ISO 8601 strings, treating 'Z' as UTC.
  const date = new Date(isoDateString);

  // 2. Define formatting options for Indian Standard Time (IST).
  const options = {
    weekday: 'long',   // e.g., "Saturday"
    year: 'numeric',   // e.g., "2025"
    month: 'long',     // e.g., "July"
    day: 'numeric',    // e.g., "26"
    hour: 'numeric',   // e.g., "12"
    minute: 'numeric', // e.g., "42"
    second: 'numeric', // e.g., "35"
    hour12: true,      // Use 12-hour clock (AM/PM)
    timeZone: 'Asia/Kolkata', // Specify the desired time zone (IST)
    timeZoneName: 'short', // e.g., "IST"
  };

  // 3. Create a DateTimeFormat instance for the desired locale and options.
  // 'en-IN' is the locale for English in India, which will help with number formatting
  // and other locale-specific nuances if any.
  const formatter = new Intl.DateTimeFormat('en-IN', options);

  // 4. Format the date.
  return formatter.format(date);
}

// Function to analyze child safety using Gemini API via axios
async function analyzeChildSafety(latitude, longitude) {
  // Validate inputs
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
    return JSON.stringify({
      error: true,
      message: 'Invalid latitude or longitude.',
      data: null,
    });
  }

  try {
    // Craft prompt for Gemini API
    const prompt = `
      You are a safety analysis system for a child tracking application. Given the coordinates (latitude: ${latitude}, longitude: ${longitude}), determine if the location is safe for a child. Consider factors like known safe areas (e.g., schools, homes), risky areas (e.g., crowded places, remote areas), or hypothetical geofencing rules. Return a JSON object with:
      - priority: "low", "medium", or "high" (indicating urgency)
      - description: A brief explanation of the safety status keep it under 50 words
      - actions: An array of recommended actions (e.g., ["Call Child", "Send Safety Prompt", "Contact Authorities"])

      Example response:
      {
        "priority": "low",
        "description": "The child is in a known safe area, likely a school.",
        "actions": []
      }
    `;

    // Make POST request to Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract response text
    const responseText = response.data.candidates[0].content.parts[0].text;

    // Parse JSON from response
    let safetyData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini.');
      }
      safetyData = JSON.parse(jsonMatch[0]);
      console.log('Safety analysis response:', safetyData);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError, 'Response:', responseText);
      return JSON.stringify({
        error: true,
        message: 'Failed to parse safety analysis.',
        data: null,
      });
    }

    // Validate response structure
    if (!safetyData.priority || !safetyData.description || !Array.isArray(safetyData.actions)) {
      return JSON.stringify({
        error: true,
        message: 'Invalid safety analysis response format.',
        data: null,
      });
    }

    // Return JSON string
    return JSON.stringify({
      error: false,
      data: {
        priority: safetyData.priority,
        description: safetyData.description,
        actions: safetyData.actions,
      },
      timestamp: formatIsoToIST(new Date()),
    });
  } catch (error) {
    console.error('Error analyzing child safety with Gemini:', error.message);
    return JSON.stringify({
      error: true,
      message: 'Failed to analyze child safety.',
      data: null,
    });
  }
}

export default analyzeChildSafety;