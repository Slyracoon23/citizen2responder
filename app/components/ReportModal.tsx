import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as SMS from 'expo-sms';
import { videoCallStyles } from '../styles/videoCallStyles';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';

interface ReportData {
  report_id: string;
  summary: string;
  details: {
    caller_name?: string;
    phone_number?: string;
    incident_type: string;
    description: string;
    location: {
      address: string;
      latitude?: number;
      longitude?: number;
    };
    injuries_reported: boolean;
    number_of_people_involved: number;
    is_active_threat: boolean;
    timestamp: string;
  };
}

interface ReportModalProps {
  visible: boolean;
  report: ReportData | null;
  onClose: () => void;
  onSendToEmergency: () => void;
  evidenceImageUri?: string;
}

export default function ReportModal({ visible, report, onClose, onSendToEmergency, evidenceImageUri }: ReportModalProps) {
  if (!report) return null;

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const handleSendSMS = async () => {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert('SMS Not Available', 'SMS messaging is not available on this device.');
        return;
      }

      const smsBody = `EMERGENCY REPORT
ID: ${report.report_id}
Type: ${report.details.incident_type}
Location: ${report.details.location.address}
Description: ${report.details.description}
Injuries: ${report.details.injuries_reported ? 'YES' : 'NO'}
People Involved: ${report.details.number_of_people_involved}
Active Threat: ${report.details.is_active_threat ? 'YES' : 'NO'}
Time: ${formatTimestamp(report.details.timestamp)}`;

      const smsOptions: SMS.SMSOptions = {
        recipients: ['911'],
        body: smsBody,
      };

      if (evidenceImageUri) {
        smsOptions.attachments = [
          {
            uri: evidenceImageUri,
            mimeType: 'image/jpeg',
            filename: `evidence_${report.report_id}.jpg`,
          }
        ];
      }

      const result = await SMS.sendSMSAsync(smsOptions.recipients, smsOptions.body, smsOptions);
      
      if (result.result === 'sent') {
        onSendToEmergency();
        Alert.alert('Success', 'Emergency report sent successfully.');
      } else if (result.result === 'cancelled') {
        Alert.alert('Cancelled', 'Message sending was cancelled.');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert('Error', 'Failed to send emergency report. Please try again.');
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
            <MaterialIcons name="report" size={24} color="#ff4444" />
            <Text style={videoCallStyles.reportTitle}>Emergency Report</Text>
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
              <Text style={videoCallStyles.reportSectionTitle}>Report ID</Text>
              <Text style={videoCallStyles.reportText}>{report.report_id}</Text>
            </View>

            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>Summary</Text>
              <Text style={videoCallStyles.reportText}>{report.summary}</Text>
            </View>

            <View style={videoCallStyles.reportImagePlaceholder}>
              <MaterialIcons name="image" size={48} color="#666" />
              <Text style={videoCallStyles.reportImagePlaceholderText}>
                Evidence Photo/Video{'\n'}(Captured during incident)
              </Text>
            </View>

            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>Incident Type</Text>
              <Text style={videoCallStyles.reportText}>{report.details.incident_type}</Text>
            </View>

            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>Location</Text>
              <Text style={videoCallStyles.reportText}>{report.details.location.address}</Text>
              {report.details.location.latitude && report.details.location.longitude && (
                <Text style={videoCallStyles.reportSubText}>
                  GPS: {report.details.location.latitude.toFixed(6)}, {report.details.location.longitude.toFixed(6)}
                </Text>
              )}
            </View>

            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>Description</Text>
              <Text style={videoCallStyles.reportText}>{report.details.description}</Text>
            </View>

            <View style={videoCallStyles.reportRow}>
              <View style={videoCallStyles.reportHalfSection}>
                <Text style={videoCallStyles.reportSectionTitle}>Injuries</Text>
                <Text style={[videoCallStyles.reportText, report.details.injuries_reported && videoCallStyles.reportWarning]}>
                  {report.details.injuries_reported ? 'YES' : 'NO'}
                </Text>
              </View>
              <View style={videoCallStyles.reportHalfSection}>
                <Text style={videoCallStyles.reportSectionTitle}>People Involved</Text>
                <Text style={videoCallStyles.reportText}>{report.details.number_of_people_involved}</Text>
              </View>
            </View>

            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>Active Threat</Text>
              <Text style={[videoCallStyles.reportText, report.details.is_active_threat && videoCallStyles.reportDanger]}>
                {report.details.is_active_threat ? 'YES' : 'NO'}
              </Text>
            </View>

            {report.details.caller_name && (
              <View style={videoCallStyles.reportSection}>
                <Text style={videoCallStyles.reportSectionTitle}>Caller</Text>
                <Text style={videoCallStyles.reportText}>{report.details.caller_name}</Text>
                {report.details.phone_number && (
                  <Text style={videoCallStyles.reportSubText}>{report.details.phone_number}</Text>
                )}
              </View>
            )}

            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>Timestamp</Text>
              <Text style={videoCallStyles.reportText}>{formatTimestamp(report.details.timestamp)}</Text>
            </View>
          </ScrollView>

          <View style={videoCallStyles.reportActions}>
            <TouchableOpacity
              style={[videoCallStyles.reportButton, videoCallStyles.reportCancelButton]}
              onPress={onClose}
            >
              <MaterialIcons name="cancel" size={20} color="#666" />
              <Text style={videoCallStyles.reportCancelButtonText}>Cancel Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[videoCallStyles.reportButton, videoCallStyles.reportSendButton]}
              onPress={handleSendSMS}
            >
              <MaterialIcons name="send" size={20} color="white" />
              <Text style={videoCallStyles.reportSendButtonText}>Send to 911</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}