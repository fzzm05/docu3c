// safetyPromptSchema.js
import { z } from 'zod';

/**
 * Zod schemas for runtime validation
 */
export const InputContextSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  floor: z.number().optional(),
  accuracy: z.number().optional(),
  nearest_poi: z.string().optional(),
  poi_type: z.string().optional(),
  crowd_density: z.enum(['low', 'medium', 'high']).optional(),
  crime_score: z.number().min(0).max(1).optional(),
  is_familiar: z.boolean().optional(),
  parent_sensitivity: z.enum(['low', 'medium', 'high']).optional()
});

export const SafetyNarrationSchema = z.object({
  narrative_alert: z.string(),
  risk_level: z.enum(['low', 'medium', 'high']), // This will serve as the 'priority' (string enum)
  recommended_action: z.array(z.string()),       // *** CRITICAL CHANGE: Changed to array of strings ***
  nearest_exit: z.string().optional(),
  // Removed the numerical 'priority' field as it's redundant and caused conflicts
});

/**
 * Inline Gemini-safe JSON schema (NO $schema, $ref, or definitions)
 * This defines the tool Gemini will "call" with its generated parameters.
 */
export const SafetyNarrationTool = {
  name: 'SafetyNarration',
  description: 'Generates a parent-readable safety/action narration JSON based on location and context.',
  parameters: {
    type: 'object',
    properties: {
      narrative_alert: { type: 'string' },
      risk_level: { type: 'string', enum: ['low', 'medium', 'high'] }, // This is the string priority
      recommended_action: { type: 'array', items: { type: 'string' } }, // *** CRITICAL CHANGE: Array of actions ***
      nearest_exit: { type: 'string' },
      // Removed the numerical 'priority' field from tool definition
    },
    required: ['narrative_alert', 'risk_level', 'recommended_action']
  }
};
