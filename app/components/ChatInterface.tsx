import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ConversationMessage } from '../services/apiService';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';

interface ChatInterfaceProps {
  isTranscriptionEnabled: boolean;
  conversationHistory: ConversationMessage[];
  chatScrollViewRef: React.RefObject<ScrollView>;
  isLoading: boolean;
}

interface ChatInputProps {
  textInput: string;
  setTextInput: (text: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

export default function ChatInterface({
  isTranscriptionEnabled,
  conversationHistory,
  chatScrollViewRef,
  isLoading
}: ChatInterfaceProps) {
  if (!isTranscriptionEnabled) return null;

  return (
    <View style={styles.chatOverlay}>
      <LinearGradient
        colors={colors.gradients.darkGlass}
        style={styles.chatBackground}
      >
        {/* Conversation History */}
        {conversationHistory.length > 0 ? (
        <ScrollView
          ref={chatScrollViewRef}
          style={styles.chatScrollContainer}
          contentContainerStyle={styles.chatContentContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => chatScrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {conversationHistory.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.type === 'user' ? styles.userMessageContainer : styles.aiMessageContainer
              ]}
            >
              <View
                style={[
                  styles.chatBubble,
                  message.type === 'user' ? styles.userBubble : styles.aiBubble
                ]}
              >
                <Text
                  style={[
                    styles.chatText,
                    message.type === 'user' ? styles.userText : styles.aiText
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        /* Welcome message when no conversation history */
        <View style={styles.welcomeContainer}>
          <View style={[styles.chatBubble, styles.welcomeBubble]}>
            <Text style={styles.welcomeText}>
              Type a message to get started!
            </Text>
          </View>
        </View>
      )}
      </LinearGradient>
    </View>
  );
}

export function ChatInput({
  textInput,
  setTextInput,
  onSendMessage,
  isLoading
}: ChatInputProps) {
  return (
    <View style={styles.chatInputOverlay}>
      <LinearGradient
        colors={colors.gradients.darkGlass}
        style={styles.inputBackground}
      >
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor={colors.text.tertiary}
            value={textInput}
            onChangeText={setTextInput}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!textInput.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={onSendMessage}
            disabled={!textInput.trim() || isLoading}
          >
            {isLoading ? (
              <MaterialIcons name="hourglass-empty" size={20} color="#fff" />
            ) : (
              <MaterialIcons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  chatOverlay: {
    flex: 1,
    flexDirection: 'column',
  },
  chatBackground: {
    flex: 1,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    margin: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
  chatScrollContainer: {
    flex: 1,
  },
  chatContentContainer: {
    paddingVertical: 10,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 3,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  userBubble: {
    backgroundColor: colors.primary,
    maxWidth: '80%',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.glass.dark,
    maxWidth: '80%',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
  userText: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  aiText: {
    color: colors.text.secondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeBubble: {
    backgroundColor: colors.glass.dark,
    alignSelf: 'center',
  },
  welcomeText: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  chatBubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  chatText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize.lg,
    maxHeight: 80,
    minHeight: 20,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.text.quaternary,
  },
  
  // Chat Input styles
  chatInputOverlay: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputBackground: {
    borderRadius: borderRadius.large,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
});