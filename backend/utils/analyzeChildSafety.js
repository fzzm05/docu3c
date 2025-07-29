// analyzeChildSafety.js
import env from 'dotenv';
import { InputContextSchema, SafetyNarrationSchema, SafetyNarrationTool } from '../schemas/safetyPromptSchema.js';

env.config();

const MODEL_NAME = 'gemini-1.5-flash'; // Change to 'gemini-pro' or other model if needed

// Function to analyze child safety using Gemini API
async function analyzeChildSafety(locationData) {
  let validatedInput;
  try {
      // 1. Validate incoming locationData using Zod
      validatedInput = InputContextSchema.parse(locationData);
      console.log('Input location data validated successfully:', validatedInput);
  } catch (error) {
      console.error('Input validation error:', error.errors);
      return JSON.stringify({
          error: true,
          message: `Invalid input data: ${error.errors.map(e => e.message).join(', ')}`,
          data: null,
      });
  }

  // Initialize chat history with a system instruction for structured output
  // The system instruction is crucial for guiding the model to use the tool.
  // IMPORTANT: Updated instruction to reflect 'recommended_action' as an array
  let chatHistory = [
      {
          role: "user",
          parts: [
              {
                  text: `You are GuardianSense-LLM, a highly intelligent and proactive child safety analysis system. Your task is to analyze the provided child's location and context data, and then identify potential safety implications of each piece of data (e.g., high crime score, unfamiliar area, high crowd density) and synthesize this information to determine the *overall risk level*. Generate a safety narration using the 'SafetyNarration' tool.
                  Output ONLY valid JSON that conforms exactly to the "SafetyNarration" schema. Do NOT add markdown, comments, or keys not specified by the tool.
                  Focus on providing a *concise, actionable alert* for a parent, highlighting *what they need to know and do immediately* based on the inferred risk. Consider the intersection of factors like 'crime_score', 'crowd_density', 'poi_type', and 'is_familiar' to give a nuanced and specific assessment.

                  Ensure 'recommended_action' is an array of strings, providing clear, distinct steps.
                  Here is the child's current context:
                  ${JSON.stringify(validatedInput)}`
              }
          ]
      }
  ];

  const apiKey = process.env.GEMINI_API_KEY; // API key is provided by the Canvas environment at runtime
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

  // Construct the payload for the Gemini API call
  const payload = {
      contents: chatHistory,
      tools: [
          {
              functionDeclarations: [SafetyNarrationTool]
          }
      ],
      generationConfig: {
          temperature: 0.4,
      }
  };

  // Implement a timeout for the fetch request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

  try {
      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal // Attach the abort signal
      });

      clearTimeout(timeoutId); // Clear the timeout if the request completes in time

      if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini API call failed with status ${response.status}: ${errorText}`);
          return JSON.stringify({
              error: true,
              message: `Gemini API call failed: ${response.status} - ${errorText}`,
              data: null,
          });
      }

      const result = await response.json();

      // Check if the model responded with a function call
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0 &&
          result.candidates[0].content.parts[0].functionCall) {

          const functionCall = result.candidates[0].content.parts[0].functionCall;

          // Validate that the model called the correct function
          if (functionCall.name === SafetyNarrationTool.name) {
              const safetyDataRaw = functionCall.args;

              // 2. Validate the Gemini response (functionCall arguments) using Zod
              try {
                  const validatedSafetyData = SafetyNarrationSchema.parse(safetyDataRaw);
                  console.log('Gemini response validated successfully:', validatedSafetyData);

                  // Construct the response in the user's desired JSON string format
                  return JSON.stringify({
                      error: false,
                      data: {
                          // Map risk_level to priority, as per the updated schema and database expectation
                          priority: validatedSafetyData.risk_level,
                          description: validatedSafetyData.narrative_alert,
                          // recommended_action is now directly an array from Gemini
                          actions: validatedSafetyData.recommended_action,
                          ...(validatedSafetyData.nearest_exit && { nearest_exit: validatedSafetyData.nearest_exit }),
                      },
                      // Use UTC ISO string for database consistency
                      timestamp: new Date().toISOString(),
                  });

              } catch (validationError) {
                  console.error('Gemini response Zod validation error:', validationError.errors);
                  return JSON.stringify({
                      error: true,
                      message: `Invalid Gemini response schema: ${validationError.errors.map(e => e.message).join(', ')}`,
                      data: null,
                  });
              }

          } else {
              console.error(`Unexpected function call name from Gemini: ${functionCall.name}`);
              return JSON.stringify({
                  error: true,
                  message: `Unexpected function call from Gemini: ${functionCall.name}`,
                  data: null,
              });
          }
      } else {
          console.error('Gemini response did not contain an expected function call:', JSON.stringify(result, null, 2));
          // Provide more specific error if Gemini gives an error or safety feedback
          if (result.promptFeedback && result.promptFeedback.blockReason) {
              return JSON.stringify({
                  error: true,
                  message: `Gemini blocked the prompt: ${result.promptFeedback.blockReason}`,
                  data: null,
              });
          }
          if (result.candidates && result.candidates.length > 0 && result.candidates[0].finishReason) {
              return JSON.stringify({
                  error: true,
                  message: `Gemini finished with reason: ${result.candidates[0].finishReason}`,
                  data: null,
              });
          }
          return JSON.stringify({
              error: true,
              message: 'Gemini did not respond with a function call as expected.',
              data: null,
          });
      }
  } catch (error) {
      clearTimeout(timeoutId); // Ensure timeout is cleared even on other errors
      if (error.name === 'AbortError') {
          console.error('Gemini API call timed out:', error);
          return JSON.stringify({
              error: true,
              message: 'Gemini API call timed out. Please try again.',
              data: null,
          });
      }
      console.error('Error analyzing child safety:', error);
      return JSON.stringify({
          error: true,
          message: `Failed to analyze child safety: ${error.message}`,
          data: null,
      });
  }
}

// Removed runExample() as it's for testing within the file, not for deployment.
// If you want to test, you can uncomment and run it locally.

export default analyzeChildSafety;
