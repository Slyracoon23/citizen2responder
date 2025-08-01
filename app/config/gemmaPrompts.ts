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

// Helper function to extract JSON from various response formats
function extractJsonFromResponse(response: string): string | null {
  const trimmedResponse = response.trim();
  console.log('🔧 JSON EXTRACTOR DEBUG: Processing response of length:', trimmedResponse.length);
  
  // Method 1: Direct JSON (current behavior)
  if (trimmedResponse.startsWith('{"name":')) {
    console.log('🔧 JSON EXTRACTOR DEBUG: Found direct JSON');
    return trimmedResponse;
  }
  
  // Method 2: Code block wrapped JSON
  const codeBlockPatterns = [
    /```json\s*\n?([\s\S]*?)\n?\s*```/i,     // ```json\n{...}\n```
    /```\s*\n?([\s\S]*?)\n?\s*```/i,         // ```\n{...}\n```
    /`([^`]*\{"name"[^`]*)`/i                // Single backticks `{...}`
  ];
  
  for (let i = 0; i < codeBlockPatterns.length; i++) {
    const pattern = codeBlockPatterns[i];
    console.log(`🔧 JSON EXTRACTOR DEBUG: Trying pattern ${i + 1}:`, pattern.toString());
    const match = trimmedResponse.match(pattern);
    
    if (match) {
      console.log(`🔧 JSON EXTRACTOR DEBUG: Pattern ${i + 1} matched, groups:`, match.length);
      if (match[1]) {
        const jsonCandidate = match[1].trim();
        console.log('🔧 JSON EXTRACTOR DEBUG: Found code block match, candidate starts with:', jsonCandidate.substring(0, 50));
        console.log('🔧 JSON EXTRACTOR DEBUG: Full candidate length:', jsonCandidate.length);
        
        // Check if it contains the JSON structure we're looking for
        if (jsonCandidate.includes('"name":')) {
          // Find the start of the JSON object
          const jsonStart = jsonCandidate.indexOf('{');
          if (jsonStart !== -1) {
            const jsonFromStart = jsonCandidate.substring(jsonStart);
            if (jsonFromStart.startsWith('{"name":') || jsonFromStart.includes('"name":')) {
              console.log('🔧 JSON EXTRACTOR DEBUG: Valid JSON found in code block');
              return jsonFromStart;
            }
          }
        }
      }
    } else {
      console.log(`🔧 JSON EXTRACTOR DEBUG: Pattern ${i + 1} did not match`);
    }
  }
  
  // Method 3: Search for JSON anywhere in the response and extract complete object
  console.log('🔧 JSON EXTRACTOR DEBUG: Trying fallback method - searching for {"name": anywhere');
  
  // Look for any occurrence of {"name": (with or without exact spacing)
  const patterns = [
    '{"name":',
    '{ "name":',
    '{\n  "name":',
    '{\n"name":'
  ];
  
  let nameIndex = -1;
  for (const pattern of patterns) {
    nameIndex = trimmedResponse.indexOf(pattern);
    if (nameIndex !== -1) {
      console.log(`🔧 JSON EXTRACTOR DEBUG: Found pattern "${pattern}" at index ${nameIndex}`);
      break;
    }
  }
  
  if (nameIndex !== -1) {
    // Find the start of the JSON object (look backwards for the opening brace)
    let jsonStart = nameIndex;
    while (jsonStart > 0 && trimmedResponse[jsonStart] !== '{') {
      jsonStart--;
    }
    
    // Find the complete JSON object by counting braces
    let braceCount = 0;
    let endIndex = -1;
    
    for (let i = jsonStart; i < trimmedResponse.length; i++) {
      if (trimmedResponse[i] === '{') braceCount++;
      if (trimmedResponse[i] === '}') braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
    
    if (endIndex > jsonStart) {
      const extractedJson = trimmedResponse.substring(jsonStart, endIndex);
      console.log('🔧 JSON EXTRACTOR DEBUG: Extracted JSON from anywhere in response, length:', extractedJson.length);
      console.log('🔧 JSON EXTRACTOR DEBUG: Extracted JSON starts with:', extractedJson.substring(0, 100));
      return extractedJson;
    }
  }
  
  console.log('🔧 JSON EXTRACTOR DEBUG: No JSON found in response');
  return null;
}

export function parseGemmaResponse(response: string): ParsedResponse {
  const trimmedResponse = response.trim();
  
  // Try to extract JSON from the response using various methods
  const jsonContent = extractJsonFromResponse(response);
  
  if (jsonContent) {
    try {
      const toolCall = JSON.parse(jsonContent);
      console.log('🔧 JSON PARSER DEBUG: Successfully parsed JSON tool call:', toolCall.name);
      
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
        // Convert to standard tool call format expected by existing handlers
        const standardToolCall: StandardToolCall = {
          type: 'function',
          function: {
            name: toolCall.name,
            arguments: JSON.stringify(toolCall.parameters)
          }
        };
        
        console.log('🔧 JSON PARSER DEBUG: Converted to standard tool call format');
        return {
          isToolCall: true,
          content: '',
          toolCall: toolCall,
          standardToolCalls: [standardToolCall]
        };
      }
      
      console.log('🔧 JSON PARSER DEBUG: Unknown tool call name:', toolCall.name);
    } catch (error) {
      console.error('🔧 JSON PARSER ERROR: Failed to parse extracted JSON:', error);
      console.error('🔧 JSON PARSER ERROR: Extracted content was:', jsonContent);
    }
  } else {
    console.log('🔧 JSON PARSER DEBUG: No JSON tool call detected, treating as regular text');
  }
  
  return {
    isToolCall: false,
    content: trimmedResponse,
    toolCall: undefined
  };
}