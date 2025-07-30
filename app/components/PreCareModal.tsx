import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { videoCallStyles } from '../styles/videoCallStyles';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';

interface PreCareData {
  title: string;
  instructions: string[];
  priority: 'low' | 'medium' | 'high';
}

interface PreCareModalProps {
  visible: boolean;
  preCareData: PreCareData | null;
  onClose: () => void;
}

export default function PreCareModal({ visible, preCareData, onClose }: PreCareModalProps) {
  if (!preCareData) return null;

  const getPriorityColor = (priority: string) => {
    return colors.success;
  };

  const getPriorityGradient = (priority: string) => {
    return colors.gradients.secondary;
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'HIGH PRIORITY';
      case 'medium':
        return 'MEDIUM PRIORITY';
      case 'low':
        return 'LOW PRIORITY';
      default:
        return 'PRIORITY';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={videoCallStyles.reportModalOverlay}>
        <View style={videoCallStyles.reportModalContainer}>
          <View style={videoCallStyles.reportHeader}>
            <MaterialIcons name="local-hospital" size={24} color={getPriorityColor(preCareData.priority)} />
            <Text style={videoCallStyles.reportTitle}>Pre-Care Instructions</Text>
            <TouchableOpacity onPress={onClose} style={videoCallStyles.reportCloseButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={videoCallStyles.reportContent}
            contentContainerStyle={videoCallStyles.reportContentContainer}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>{preCareData.title}</Text>
              <View style={[
                videoCallStyles.reportImagePlaceholder, 
                { 
                  backgroundColor: `${getPriorityColor(preCareData.priority)}20`,
                  borderColor: getPriorityColor(preCareData.priority),
                  borderWidth: 1,
                  marginBottom: 16,
                  paddingVertical: 8
                }
              ]}>
                <Text style={[
                  videoCallStyles.reportImagePlaceholderText,
                  { 
                    color: getPriorityColor(preCareData.priority),
                    fontSize: 12,
                    fontWeight: '600'
                  }
                ]}>
                  {getPriorityText(preCareData.priority)}
                </Text>
              </View>
            </View>

            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>Instructions</Text>
              {preCareData.instructions.map((instruction, index) => (
                <View key={index} style={{
                  flexDirection: 'row',
                  marginBottom: 12,
                  paddingLeft: 8
                }}>
                  <LinearGradient
                    colors={getPriorityGradient(preCareData.priority)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: spacing.md,
                      marginTop: 2,
                      shadowColor: getPriorityColor(preCareData.priority),
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Text style={{
                      color: colors.text.primary,
                      fontSize: fontSize.sm,
                      fontWeight: fontWeight.bold
                    }}>
                      {index + 1}
                    </Text>
                  </LinearGradient>
                  <Text style={[
                    videoCallStyles.reportText,
                    { 
                      flex: 1,
                      lineHeight: 20
                    }
                  ]}>
                    {instruction}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={videoCallStyles.reportActions}>
            <TouchableOpacity
              style={[videoCallStyles.reportButton, { overflow: 'hidden' }]}
              onPress={onClose}
            >
              <LinearGradient
                colors={getPriorityGradient(preCareData.priority)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  gap: spacing.xs,
                }}
              >
                <MaterialIcons name="check" size={20} color={colors.text.primary} />
                <Text style={[
                  videoCallStyles.reportSendButtonText,
                  { fontWeight: fontWeight.semibold }
                ]}>
                  Got It
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}