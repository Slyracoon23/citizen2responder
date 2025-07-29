import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { videoCallStyles } from '../styles/videoCallStyles';

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
    switch (priority) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9F0A';
      case 'low':
        return '#34C759';
      default:
        return '#34C759';
    }
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
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: getPriorityColor(preCareData.priority),
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                    marginTop: 2
                  }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 12,
                      fontWeight: '600'
                    }}>
                      {index + 1}
                    </Text>
                  </View>
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
              style={[
                videoCallStyles.reportButton, 
                videoCallStyles.reportSendButton,
                { backgroundColor: getPriorityColor(preCareData.priority) }
              ]}
              onPress={onClose}
            >
              <MaterialIcons name="check" size={20} color="white" />
              <Text style={videoCallStyles.reportSendButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}