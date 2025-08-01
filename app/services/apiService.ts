
import { SYSTEM_PROMPT, ALL_TOOLS, API_CONFIG, JSON_TOOL_SYSTEM_PROMPT, supportsNativeToolCalling, getModelForContext } from './apiToolSchemas';
import localModelService from './localModelService';

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

  async initializeLocalModel(): Promise<void> {
    try {
      console.log('🔧 API SERVICE: Initializing local model...');
      await localModelService.initializeModel();
      console.log('🔧 API SERVICE: Local model initialized successfully');
    } catch (error) {
      console.error('🔧 API SERVICE: Failed to initialize local model:', error);
      throw error;
    }
  }

  async releaseLocalModel(): Promise<void> {
    try {
      console.log('🔧 API SERVICE: Releasing local model...');
      await localModelService.releaseModel();
      console.log('🔧 API SERVICE: Local model released successfully');
    } catch (error) {
      console.error('🔧 API SERVICE: Failed to release local model:', error);
    }
  }

  get isLocalModelReady(): boolean {
    return localModelService.isModelReady;
  }

  get isLocalModelInitializing(): boolean {
    return localModelService.isModelInitializing;
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
    // For text-only requests, use local model
    if (!isImageInputEnabled) {
      try {
        console.log('🔧 API SERVICE: Routing text-only request to local model');
        return await localModelService.callLocalModel(conversationHistory, currentMessage);
      } catch (error) {
        console.error('🔧 API SERVICE: Local model failed, falling back to OpenRouter:', error);
        // Fall through to OpenRouter as backup
      }
    }

    // Use OpenRouter for vision requests or as fallback
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

      console.log(`🔧 API SERVICE: Using OpenRouter for ${isImageInputEnabled ? 'vision' : 'fallback'} request`);

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
      console.log('🔧 OPENROUTER API DEBUG: Full response:', JSON.stringify(data, null, 2));
      console.log('🔧 TOOL CALLS DEBUG: Tool calls present:', data.choices?.[0]?.message?.tool_calls);
      console.log('🔧 MESSAGE CONTENT DEBUG: Message content:', data.choices?.[0]?.message?.content);
      return data;

    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }

  async callOpenRouterAPIWithForcedTool(conversationHistory: ConversationMessage[], toolName: string, promptMessage: string = 'Generate based on our conversation', isImageInputEnabled: boolean = false): Promise<any> {
    // For text-only forced tool calls, try local model first
    if (!isImageInputEnabled) {
      try {
        console.log('🔧 API SERVICE: Routing forced tool call to local model');
        return await localModelService.callLocalModelWithForcedTool(conversationHistory, toolName, promptMessage);
      } catch (error) {
        console.error('🔧 API SERVICE: Local model forced tool failed, falling back to OpenRouter:', error);
        // Fall through to OpenRouter as backup
      }
    }

    // Use OpenRouter for vision requests or as fallback
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API key not found');
      }

      const model = getModelForContext(isImageInputEnabled);
      const supportsTools = supportsNativeToolCalling(model);
      
      console.log(`🔧 API SERVICE: Using OpenRouter for ${isImageInputEnabled ? 'vision' : 'fallback'} forced tool call`);

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