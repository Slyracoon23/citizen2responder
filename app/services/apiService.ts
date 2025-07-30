
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
      content: 'You are a helpful emergency response AI assistant. Keep all responses to 1-2 sentences maximum. Be concise, direct, and focus only on the most important information. Avoid long explanations or lists.\n\nTHE APP HAS THREE MODES:\n- ASSESS MODE: User wants to evaluate an emergency situation through guided questions\n- REPORT MODE: User wants to generate an emergency report for 911 services\n- CARE MODE: User needs immediate care instructions for medical emergencies\n\nASSESSMENT MODE BEHAVIOR:\nWhen in assessment mode, provide helpful context and end your response with a direct question to gather more information. Focus on:\n1. First question: Basic situation assessment (What is happening? Is anyone injured?)\n2. Follow-up questions: Location, severity, immediate dangers\n3. Progressive questioning: Move from general to specific based on responses\n4. Always end assessment responses with a clear question using "?" to trigger the question UI\n\nQUESTIONING GUIDELINES:\n- End responses with direct questions when you need more information\n- Use clear, simple questions that can be answered with Yes/No/Don\'t Know when possible\n- Questions ending with "?" will automatically activate the question interface\n- Provide brief context before asking the question\n\nTOOL USAGE GUIDELINES:\n\n1. SHOW_PRECARE_INSTRUCTIONS TOOL: When the user describes a medical emergency or asks for immediate help, use this tool to provide step-by-step care guidance. Set priority based on urgency:\n   - HIGH priority: Life-threatening (choking, cardiac arrest, severe bleeding, overdose)\n   - MEDIUM priority: Serious but stable (chest pain, head injury, burns, fractures)\n   - LOW priority: Minor injuries (cuts, sprains, minor burns)\n\n   Examples:\n   - "My friend is having chest pain" → title: "Chest Pain Emergency Care", priority: "medium"\n   - "Someone is choking" → title: "Choking Response", priority: "high"\n   - "Person fell and hit their head" → title: "Head Injury Care", priority: "medium"\n   - "Someone is bleeding heavily" → title: "Severe Bleeding Control", priority: "high"\n   - "Sprained ankle" → title: "Sprain Care", priority: "low"\n\n2. GENERATE_REPORT TOOL: For testing purposes, when appropriate, generate an emergency report using realistic fake details to demonstrate the report functionality.\n\nAlways prioritize immediate safety and encourage calling 911 for serious emergencies.'
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
          model: 'google/gemini-flash-1.5-8b',
          messages: messages,
          tools: [
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
            },
            {
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
                    }
                  },
                  required: ['title', 'instructions', 'priority']
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

  async callOpenRouterAPIWithForcedTool(conversationHistory: ConversationMessage[], toolName: string, promptMessage: string = 'Generate based on our conversation'): Promise<any> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API key not found');
      }

      const messages = this.convertConversationToMessages(conversationHistory, promptMessage);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Relay Responder App',
        },
        body: JSON.stringify({
          model: 'google/gemini-flash-1.5-8b',
          messages: messages,
          tools: [
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
            },
            {
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
                    }
                  },
                  required: ['title', 'instructions', 'priority']
                }
              }
            }
          ],
          tool_choice: {
            type: 'function',
            function: {
              name: toolName
            }
          },
          max_tokens: 5000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('🔧 OPENROUTER FORCED TOOL API DEBUG: Full response:', JSON.stringify(data, null, 2));
      console.log('🔧 FORCED TOOL CALLS DEBUG: Tool calls present:', data.choices?.[0]?.message?.tool_calls);
      console.log('🔧 FORCED MESSAGE CONTENT DEBUG: Message content:', data.choices?.[0]?.message?.content);
      return data;

    } catch (error) {
      console.error('OpenRouter Forced Tool API error:', error);
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
          model: 'google/gemini-flash-1.5-8b',
          messages: messages,
          tools: [
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
            },
            {
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
                    }
                  },
                  required: ['title', 'instructions', 'priority']
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