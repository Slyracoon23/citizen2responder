
import { SYSTEM_PROMPT, ALL_TOOLS, API_CONFIG } from './apiToolSchemas';

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
      content: SYSTEM_PROMPT
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
          model: API_CONFIG.model,
          messages: messages,
          tools: ALL_TOOLS,
          max_tokens: API_CONFIG.maxTokens,
          temperature: API_CONFIG.temperature,
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
          model: API_CONFIG.model,
          messages: messages,
          tools: ALL_TOOLS,
          tool_choice: {
            type: 'function',
            function: {
              name: toolName
            }
          },
          max_tokens: API_CONFIG.maxTokens,
          temperature: API_CONFIG.temperature,
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
          model: API_CONFIG.model,
          messages: messages,
          tools: ALL_TOOLS,
          max_tokens: API_CONFIG.visionMaxTokens,
          temperature: API_CONFIG.temperature,
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