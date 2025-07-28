import { useState, useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';
import ApiService, { ConversationMessage } from '../services/apiService';

export function useConversation() {
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const chatScrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: Date.now()
    };
    setConversationHistory(prev => [...prev, message]);
    console.log('🔍 CONV DEBUG: Added user message:', content);
    scrollToBottom();
    return message.id;
  }, [scrollToBottom]);

  const addAiMessage = useCallback((content: string) => {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: content.trim(),
      timestamp: Date.now()
    };
    setConversationHistory(prev => [...prev, message]);
    console.log('🔍 CONV DEBUG: Added AI message:', content);
    scrollToBottom();
    return message.id;
  }, [scrollToBottom]);

  const handleSendTextMessage = useCallback(async (
    isImageInputEnabled: boolean,
    onQuestionReceived?: (question: string) => void
  ) => {
    const message = textInput.trim();
    if (!message || isApiLoading) return;

    setTextInput('');
    addUserMessage(message);

    try {
      setIsApiLoading(true);
      const response = await ApiService.callOpenRouterAPI(message, isImageInputEnabled);
      
      // Check if response is a tool call
      try {
        const parsedToolCall = JSON.parse(response);
        if (parsedToolCall.toolCall && parsedToolCall.toolCall.name === 'ask_question') {
          const question = parsedToolCall.toolCall.parameters.question;
          addAiMessage(question);
          if (onQuestionReceived) {
            onQuestionReceived(question);
          }
          return;
        }
      } catch (error) {
        // Not a tool call, handle as regular response
      }

      addAiMessage(response);
    } catch (error) {
      console.error('Error sending text message:', error);
      addAiMessage('Error processing your message.');
    } finally {
      setIsApiLoading(false);
    }
  }, [textInput, isApiLoading, addUserMessage, addAiMessage]);

  const handleQuestionResponse = useCallback(async (
    response: 'yes' | 'no' | 'dont-know',
    isImageInputEnabled: boolean,
    onQuestionReceived?: (question: string) => void
  ) => {
    const responseText = response === 'yes' ? 'Yes' : response === 'no' ? 'No' : "I can't tell";
    addUserMessage(responseText);

    try {
      setIsApiLoading(true);
      const aiResponse = await ApiService.callOpenRouterAPI(responseText, isImageInputEnabled);

      // Check if response is another tool call
      try {
        const parsedToolCall = JSON.parse(aiResponse);
        if (parsedToolCall.toolCall && parsedToolCall.toolCall.name === 'ask_question') {
          const question = parsedToolCall.toolCall.parameters.question;
          addAiMessage(question);
          if (onQuestionReceived) {
            onQuestionReceived(question);
          }
          return;
        }
      } catch (error) {
        // Not a tool call, handle as regular response
      }

      addAiMessage(aiResponse);
    } catch (error) {
      console.error('Error processing question response:', error);
      addAiMessage('Error processing your response.');
    } finally {
      setIsApiLoading(false);
    }
  }, [addUserMessage, addAiMessage]);

  return {
    conversationHistory,
    isApiLoading,
    textInput,
    setTextInput,
    chatScrollViewRef,
    addUserMessage,
    addAiMessage,
    handleSendTextMessage,
    handleQuestionResponse,
  };
}