
import { SYSTEM_PROMPT, ALL_TOOLS, API_CONFIG, JSON_TOOL_SYSTEM_PROMPT, supportsNativeToolCalling, getModelForContext } from './apiToolSchemas';

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

  private convertConversationToMessages(conversationHistory: ConversationMessage[], currentMessage: string, currentMessageContent?: any[], useJsonToolPrompt: boolean = false): any[] {
    const systemMessage = {
      role: 'system',
      content: useJsonToolPrompt ? JSON_TOOL_SYSTEM_PROMPT : SYSTEM_PROMPT
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

  async callOpenRouterAPI(conversationHistory: ConversationMessage[], currentMessage: string, isImageInputEnabled: boolean = false): Promise<any> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API key not found');
      }

      const model = getModelForContext(isImageInputEnabled);
      const supportsTools = supportsNativeToolCalling(model);
      const messages = this.convertConversationToMessages(conversationHistory, currentMessage, undefined, !supportsTools);

      const requestBody: any = {
        model: model,
        messages: messages,
        max_tokens: API_CONFIG.maxTokens,
        temperature: API_CONFIG.temperature,
      };

      // Only add tools parameter for models that support it
      if (supportsTools) {
        requestBody.tools = ALL_TOOLS;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Relay Responder App',
        },
        body: JSON.stringify(requestBody),
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

  async callOpenRouterAPIWithForcedTool(conversationHistory: ConversationMessage[], toolName: string, promptMessage: string = 'Generate based on our conversation', isImageInputEnabled: boolean = false): Promise<any> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API key not found');
      }

      const model = getModelForContext(isImageInputEnabled);
      const supportsTools = supportsNativeToolCalling(model);
      
      if (!supportsTools) {
        // For models without native tool calling, enhance the prompt to force tool usage
        const enhancedPrompt = `${promptMessage}\n\nYou MUST respond with a ${toolName} tool call. Use the JSON format specified in your instructions.`;
        const messages = this.convertConversationToMessages(conversationHistory, enhancedPrompt, undefined, true);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'Relay Responder App',
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: API_CONFIG.maxTokens,
            temperature: API_CONFIG.temperature,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        console.log('🔧 OPENROUTER FORCED TOOL API DEBUG (No Tool Support): Full response:', JSON.stringify(data, null, 2));
        console.log('🔧 FORCED MESSAGE CONTENT DEBUG: Message content:', data.choices?.[0]?.message?.content);
        return data;
      }

      // Original implementation for models with native tool calling
      const messages = this.convertConversationToMessages(conversationHistory, promptMessage);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Relay Responder App',
        },
        body: JSON.stringify({
          model: model,
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

  async callOpenRouterVisionAPI(conversationHistory: ConversationMessage[], frames: string[], currentMessage: string, isImageInputEnabled: boolean = true): Promise<any> {
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

      const model = getModelForContext(isImageInputEnabled);
      const supportsTools = supportsNativeToolCalling(model);
      const messages = this.convertConversationToMessages(conversationHistory, currentMessage, messageContent, !supportsTools);

      const requestBody: any = {
        model: model,
        messages: messages,
        max_tokens: API_CONFIG.visionMaxTokens,
        temperature: API_CONFIG.temperature,
      };

      // Only add tools parameter for models that support it
      if (supportsTools) {
        requestBody.tools = ALL_TOOLS;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Relay Responder App',
        },
        body: JSON.stringify(requestBody),
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