
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

  async callOpenRouterAPI(text: string): Promise<any> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API key not found');
      }

      const messageContent = [
        {
          type: 'text',
          text: text
        }
      ];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Relay Responder App',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful emergency response AI assistant. Keep all responses to 1-2 sentences maximum. Be concise, direct, and focus only on the most important information. Avoid long explanations or lists.\n\nIMPORTANT: If you need to ask the user a question, do not reply with a text message. Instead, use the set_question tool to display the question in the UI. Use this tool whenever you need more information from the user to provide better assistance.'
            },
            {
              role: 'user',
              content: messageContent
            }
          ],
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
      console.log('🔧 OPENROUTER TEXT API DEBUG: Full response:', JSON.stringify(data, null, 2));
      console.log('🔧 TOOL CALLS DEBUG: Tool calls present:', data.choices?.[0]?.message?.tool_calls);
      console.log('🔧 MESSAGE CONTENT DEBUG: Message content:', data.choices?.[0]?.message?.content);
      return data;

    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }

  async callOpenRouterVisionAPI(frames: string[], text: string = 'Analyze the following sequence of images and provide a concise, one-sentence summary of the situation.'): Promise<any> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API key not found');
      }

      const messageContent = [
        {
          type: 'text',
          text: 'Analyze the following sequence of images and provide a concise, one-sentence summary of the situation.'
        },
        ...frames.map(frame => ({
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${frame}`
          }
        }))
      ];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Relay Responder App',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful emergency response AI assistant. Keep all responses to 1-2 sentences maximum. Be concise, direct, and focus only on the most important information. Avoid long explanations or lists.\n\nIMPORTANT: If you need to ask the user a question, do not reply with a text message. Instead, use the set_question tool to display the question in the UI. Use this tool whenever you need more information from the user to provide better assistance.'
            },
            {
              role: 'user',
              content: messageContent
            }
          ],
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