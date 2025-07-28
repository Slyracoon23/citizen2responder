
export interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
}

class ApiService {
  private static instance: ApiService;
  
  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private convertConversationToMessages(conversationHistory: ConversationMessage[], currentMessage: string, currentMessageContent?: any[]): any[] {
    const systemMessage = {
      role: 'system',
      content: 'You are a helpful emergency response AI assistant. Keep all responses to 1-2 sentences maximum. Be concise, direct, and focus only on the most important information. Avoid long explanations or lists.\n\nIMPORTANT: If you need to ask the user a question, do not reply with a text message. Instead, use the ask_question tool to display the question in the UI. Use this tool whenever you need more information from the user to provide better assistance.\n\nFor testing purposes, when appropriate, generate an emergency report using the generate_report tool with realistic fake details to demonstrate the report functionality.'
    };

    const historyMessages = conversationHistory.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const currentUserMessage = {
      role: 'user',
      content: currentMessageContent || [{ type: 'text', text: currentMessage }]
    };

    return [systemMessage, ...historyMessages, currentUserMessage];
  }

  async callOpenRouterAPI(conversationHistory: ConversationMessage[], currentMessage: string): Promise<any> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API key not found');
      }

      const messages = this.convertConversationToMessages(conversationHistory, currentMessage);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Relay Responder App',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: messages,
          tools: [
            {
              type: 'function',
              function: {
                name: 'ask_question',
                description: 'Display a question popup for the user to answer in the UI.',
                parameters: {
                  type: 'object',
                  properties: {
                    question: {
                      type: 'string',
                      description: 'The question to display to the user.'
                    }
                  },
                  required: ['question']
                }
              }
            },
            {
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
                            address: { type: 'string', description: 'Street address of incident' },
                            latitude: { type: 'number', description: 'GPS latitude' },
                            longitude: { type: 'number', description: 'GPS longitude' }
                          },
                          required: ['address']
                        },
                        injuries_reported: { type: 'boolean', description: 'Whether injuries are reported' },
                        number_of_people_involved: { type: 'number', description: 'Number of people involved' },
                        is_active_threat: { type: 'boolean', description: 'Whether there is an active threat' },
                        timestamp: { type: 'string', description: 'ISO timestamp of incident' }
                      },
                      required: ['incident_type', 'description', 'location', 'injuries_reported', 'number_of_people_involved', 'is_active_threat', 'timestamp']
                    }
                  },
                  required: ['report_id', 'summary', 'details']
                }
              }
            }
          ],
          max_tokens: 5000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('🔧 OPENROUTER TEXT API DEBUG: Full response:', JSON.stringify(data, null, 2));
      console.log('🔧 TOOL CALLS DEBUG: Tool calls present:', data.choices?.[0]?.message?.tool_calls);
      console.log('🔧 MESSAGE CONTENT DEBUG: Message content:', data.choices?.[0]?.message?.content);
      return data;

    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }

  async callOpenRouterVisionAPI(conversationHistory: ConversationMessage[], frames: string[], currentMessage: string): Promise<any> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API key not found');
      }

      const messageContent = [
        {
          type: 'text',
          text: currentMessage
        },
        ...frames.map(frame => ({
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${frame}`
          }
        }))
      ];

      const messages = this.convertConversationToMessages(conversationHistory, currentMessage, messageContent);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Relay Responder App',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: messages,
          tools: [
            {
              type: 'function',
              function: {
                name: 'ask_question',
                description: 'Display a question popup for the user to answer in the UI.',
                parameters: {
                  type: 'object',
                  properties: {
                    question: {
                      type: 'string',
                      description: 'The question to display to the user.'
                    }
                  },
                  required: ['question']
                }
              }
            },
            {
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
                            address: { type: 'string', description: 'Street address of incident' },
                            latitude: { type: 'number', description: 'GPS latitude' },
                            longitude: { type: 'number', description: 'GPS longitude' }
                          },
                          required: ['address']
                        },
                        injuries_reported: { type: 'boolean', description: 'Whether injuries are reported' },
                        number_of_people_involved: { type: 'number', description: 'Number of people involved' },
                        is_active_threat: { type: 'boolean', description: 'Whether there is an active threat' },
                        timestamp: { type: 'string', description: 'ISO timestamp of incident' }
                      },
                      required: ['incident_type', 'description', 'location', 'injuries_reported', 'number_of_people_involved', 'is_active_threat', 'timestamp']
                    }
                  },
                  required: ['report_id', 'summary', 'details']
                }
              }
            }
          ],
          max_tokens: 50,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('🔧 OPENROUTER VISION API DEBUG: Full response:', JSON.stringify(data, null, 2));
      console.log('🔧 TOOL CALLS DEBUG: Tool calls present:', data.choices?.[0]?.message?.tool_calls);
      console.log('🔧 MESSAGE CONTENT DEBUG: Message content:', data.choices?.[0]?.message?.content);
      return data;

    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }
}

export default ApiService.getInstance();