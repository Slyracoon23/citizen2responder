// API Tool Schemas and Constants
// Extracted from apiService.ts to eliminate duplication

export const SYSTEM_PROMPT = `You are a helpful emergency response AI assistant. Keep all responses to 1-2 sentences maximum. Be concise, direct, and focus only on the most important information. Avoid long explanations or lists.

THE APP HAS THREE MODES:
- ASSESS MODE: User wants to evaluate an emergency situation through guided questions
- REPORT MODE: User wants to generate an emergency report for 911 services
- CARE MODE: User needs immediate care instructions for medical emergencies

ASSESSMENT MODE BEHAVIOR:
When in assessment mode, provide helpful context and end your response with a direct question to gather more information. Focus on:
1. First question: Basic situation assessment (What is happening? Is anyone injured?)
2. Follow-up questions: Severity, immediate dangers, nature of emergency
3. Progressive questioning: Move from general to specific based on responses
4. Always end assessment responses with a clear question using "?" to trigger the question UI

QUESTIONING GUIDELINES:
- End responses with direct questions when you need more information
- Use clear, simple questions that can be answered with Yes/No/Don't Know when possible
- Questions ending with "?" will automatically activate the question interface
- Provide brief context before asking the question

TOOL USAGE GUIDELINES:

1. SHOW_PRECARE_INSTRUCTIONS TOOL: When the user describes a medical emergency or asks for immediate help, use this tool to provide step-by-step care guidance. Set priority based on urgency:
   - When calling this tool, always provide at least 2-3 clear, step-by-step instructions in the "instructions" array.
   - HIGH priority: Life-threatening (choking, cardiac arrest, severe bleeding, overdose)
   - MEDIUM priority: Serious but stable (chest pain, head injury, burns, fractures)
   - LOW priority: Minor injuries (cuts, sprains, minor burns)

   Examples:
   - "My friend is having chest pain" → title: "Chest Pain Emergency Care", priority: "medium"
   - "Someone is choking" → title: "Choking Response", priority: "high"
   - "Person fell and hit their head" → title: "Head Injury Care", priority: "medium"
   - "Someone is bleeding heavily" → title: "Severe Bleeding Control", priority: "high"
   - "Sprained ankle" → title: "Sprain Care", priority: "low"

2. GENERATE_REPORT TOOL: When generating emergency reports, always include any evidence images that were captured during the conversation in the evidence_images array. If images were captured, populate the evidence_images field with the provided image URIs. Location data will be automatically provided by GPS - do not generate fake location information.

3. SHOW_PRECARE_INSTRUCTIONS TOOL: When providing care instructions, include any evidence images that were captured during the conversation in the evidence_images array. These images can help provide visual context for the care situation and assist in proper instruction delivery.

Always prioritize immediate safety and encourage calling 911 for serious emergencies.`;

export const GENERATE_REPORT_TOOL = {
  type: 'function',
  function: {
    name: 'generate_report',
    description: 'Generate an emergency report to be sent to 911 services.',
    parameters: {
      type: 'object',
      properties: {
        report_id: {
          type: 'string',
          description: 'Unique identifier for the report (format: 911-YYYYMMDD-HHMMSS)'
        },
        summary: {
          type: 'string',
          description: 'Brief summary of the emergency situation'
        },
        details: {
          type: 'object',
          properties: {
            caller_name: { type: 'string', description: 'Name of the person calling' },
            phone_number: { type: 'string', description: 'Caller phone number' },
            incident_type: { type: 'string', description: 'Type of incident (e.g., traffic accident, medical emergency)' },
            description: { type: 'string', description: 'Detailed description of the situation' },
            location: {
              type: 'object',
              properties: {
                address: { type: 'string', description: 'Street address of incident (optional - GPS coordinates will be provided automatically)' },
                latitude: { type: 'number', description: 'GPS latitude (automatically provided)' },
                longitude: { type: 'number', description: 'GPS longitude (automatically provided)' }
              },
              required: []
            },
            injuries_reported: { type: 'boolean', description: 'Whether injuries are reported' },
            number_of_people_involved: { type: 'number', description: 'Number of people involved' },
            is_active_threat: { type: 'boolean', description: 'Whether there is an active threat' },
            timestamp: { type: 'string', description: 'ISO timestamp of incident' },
            evidence_images: { 
              type: 'array', 
              items: { type: 'string' }, 
              description: 'Array of image URIs captured during the incident' 
            }
          },
          required: ['incident_type', 'description', 'injuries_reported', 'number_of_people_involved', 'is_active_threat', 'timestamp']
        }
      },
      required: ['report_id', 'summary', 'details']
    }
  }
} as const;

export const SHOW_PRECARE_INSTRUCTIONS_TOOL = {
  type: 'function',
  function: {
    name: 'show_precare_instructions',
    description: 'Display pre-care instructions to help the user provide immediate assistance.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title for the instruction category (e.g., "First Aid for Chest Pain")'
        },
        instructions: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Array of step-by-step instruction strings'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Priority level indicating urgency (low/medium/high)'
        },
        evidence_images: { 
          type: 'array', 
          items: { type: 'string' }, 
          description: 'Array of image URIs captured during the incident for visual context' 
        }
      },
      required: ['title', 'instructions', 'priority']
    }
  }
} as const;

export const ALL_TOOLS = [
  GENERATE_REPORT_TOOL,
  SHOW_PRECARE_INSTRUCTIONS_TOOL
] as const;

export const API_CONFIG = {
  model: 'google/gemini-flash-1.5-8b',
  maxTokens: 5000,
  temperature: 0.7,
  visionMaxTokens: 50
} as const;