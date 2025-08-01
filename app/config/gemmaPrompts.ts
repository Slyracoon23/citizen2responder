export const GEMMA_SYSTEM_PROMPT = `You are a medical video call AI assistant. You have TWO modes of response:

## MODE 1: CONVERSATIONAL RESPONSE
Use for: greetings, explanations, general support, acknowledgments
Format: Plain text ONLY (1-2 sentences maximum)

## MODE 2: QUESTION FUNCTION
Use for: gathering specific medical information, yes/no questions, symptom clarification
Format: EXACT JSON ONLY - no additional text whatsoever

## CRITICAL RULES:
- NEVER combine text with JSON in any response
- NEVER write explanations before function calls
- NEVER add text after function calls
- If you call a function, output ONLY the JSON
- If you respond conversationally, output ONLY text

## AVAILABLE FUNCTION:
ask_question - Use when you need specific information

## DECISION FLOWCHART:
1. Is this a greeting/explanation/support? → Use MODE 1 (text only)
2. Do I need specific medical info? → Use MODE 2 (JSON only)

## CORRECT EXAMPLES:

User: "Hello"
Response: "Hello! I'm here to help with your medical consultation."

User: "I have chest pain"
Response: "I understand you're experiencing chest pain. Let me gather some details."

User: "I have chest pain and need help"
Response: {"name": "ask_question", "parameters": {"question": "Is the chest pain sharp or dull?"}}

User: "It's sharp"
Response: {"name": "ask_question", "parameters": {"question": "Does it worsen when you breathe?"}}

User: "Yes"
Response: {"name": "ask_question", "parameters": {"question": "Have you had chest pain like this before?"}}

User: "Thanks for the help"
Response: "You're welcome! Take care."

User: "Can you tell me who you are?"
Response: "I'm an AI assistant designed to help with medical video calls and provide support during consultations."

## WRONG EXAMPLES (NEVER DO THIS):
❌ "Let me ask you: {"name": "ask_question", "parameters": {"question": "How are you?"}}"
❌ "I understand. {"name": "ask_question", "parameters": {"question": "Tell me more?"}}"
❌ Any response mixing text and JSON

## VALIDATION CHECKLIST:
Before responding, ask yourself:
1. Am I using MODE 1 (text) or MODE 2 (JSON)?
2. Does my response contain ONLY that format?
3. If JSON, is it valid and complete?
4. If text, is it conversational and helpful?

## FINAL RULE:
ONE response = ONE format. NEVER mix them.`;

export interface ToolCall {
  name: string;
  parameters: {
    [key: string]: any;
  };
}

export interface StandardToolCall {
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ParsedResponse {
  isToolCall: boolean;
  content: string;
  toolCall?: ToolCall;
  standardToolCalls?: StandardToolCall[];
}

// Helper function to extract complete JSON object by counting braces
function extractCompleteJson(text: string, startIndex: number): string | null {
  let braceCount = 0;
  let endIndex = -1;
  
  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === '{') braceCount++;
    if (text[i] === '}') braceCount--;
    if (braceCount === 0) {
      endIndex = i + 1;
      break;
    }
  }
  
  return endIndex > startIndex ? text.substring(startIndex, endIndex) : null;
}

// Helper function to validate if extracted content is a valid tool call JSON
function isValidToolCallJson(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed.name && parsed.parameters && 
           ['ask_question', 'generate_report', 'show_precare_instructions'].includes(parsed.name);
  } catch {
    return false;
  }
}

// Simplified helper function to extract JSON from various response formats
function extractJsonFromResponse(response: string): string | null {
  const trimmedResponse = response.trim();
  
  // Direct JSON check
  if (trimmedResponse.startsWith('{"name":')) {
    return trimmedResponse;
  }
  
  // Comprehensive regex for all code block variations and inline JSON
  const jsonExtractionRegex = /(?:```(?:json)?\s*\n?)?\s*(\{[\s\S]*?"name"\s*:[\s\S]*?\})(?:\s*\n?```)?/i;
  const match = trimmedResponse.match(jsonExtractionRegex);
  
  if (match && match[1]) {
    const candidate = match[1].trim();
    const jsonStart = candidate.indexOf('{');
    if (jsonStart !== -1) {
      const completeJson = extractCompleteJson(candidate, jsonStart);
      if (completeJson && isValidToolCallJson(completeJson)) {
        return completeJson;
      }
    }
  }
  
  // Fallback: Search for {"name": pattern anywhere and extract complete object
  const namePattern = /\{\s*"name"\s*:/;
  const nameMatch = trimmedResponse.match(namePattern);
  if (nameMatch) {
    const startIndex = nameMatch.index!;
    const completeJson = extractCompleteJson(trimmedResponse, startIndex);
    if (completeJson && isValidToolCallJson(completeJson)) {
      return completeJson;
    }
  }
  
  return null;
}

// Helper function to create standard tool call format
function createStandardToolCall(toolCall: ToolCall): StandardToolCall {
  return {
    type: 'function',
    function: {
      name: toolCall.name,
      arguments: JSON.stringify(toolCall.parameters)
    }
  };
}

export function parseGemmaResponse(response: string): ParsedResponse {
  const trimmedResponse = response.trim();
  const jsonContent = extractJsonFromResponse(response);
  
  if (jsonContent) {
    try {
      const toolCall = JSON.parse(jsonContent);
      
      // Handle ask_question (legacy support)
      if (toolCall.name === 'ask_question' && toolCall.parameters?.question) {
        return {
          isToolCall: true,
          content: '',
          toolCall: toolCall
        };
      }
      
      // Handle generate_report and show_precare_instructions
      if ((toolCall.name === 'generate_report' || toolCall.name === 'show_precare_instructions') 
          && toolCall.parameters) {
        return {
          isToolCall: true,
          content: '',
          toolCall: toolCall,
          standardToolCalls: [createStandardToolCall(toolCall)]
        };
      }
      
    } catch (error) {
      console.error('🔧 JSON PARSER: Failed to parse extracted JSON:', error);
    }
  }
  
  return {
    isToolCall: false,
    content: trimmedResponse,
    toolCall: undefined
  };
}