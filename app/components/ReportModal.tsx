import React, { useState, memo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SMS from 'expo-sms';
import { videoCallStyles } from '../styles/videoCallStyles';
import ImageGallery from './ImageGallery';
import { ReportData } from '../types/report';

interface ReportModalProps {
  visible: boolean;
  report: ReportData | null;
  onClose: () => void;
  onSendToEmergency: () => void;
  evidenceImageUri?: string;
}

const ReportModal = memo(function ReportModal({ visible, report, onClose, onSendToEmergency, evidenceImageUri }: ReportModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Ensure all required fields exist with safe defaults - handle null report case
  const safeReport = report ? {
    report_id: report.report_id || 'N/A',
    summary: report.summary || 'N/A',
    details: {
      caller_name: report.details?.caller_name || null,
      phone_number: report.details?.phone_number || null,
      incident_type: report.details?.incident_type || 'N/A',
      description: report.details?.description || 'N/A',
      location: {
        address: report.details?.location?.address || 'N/A',
        latitude: report.details?.location?.latitude || null,
        longitude: report.details?.location?.longitude || null,
      },
      injuries_reported: Boolean(report.details?.injuries_reported),
      number_of_people_involved: Number(report.details?.number_of_people_involved) || 0,
      is_active_threat: Boolean(report.details?.is_active_threat),
      timestamp: report.details?.timestamp || new Date().toISOString(),
      evidence_images: report.details?.evidence_images || [],
    }
  } : null;

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const handleSendSMS = useCallback(async () => {
    if (!safeReport) return;
    
    try {
      const isAvailable = await SMS.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert('SMS Not Available', 'SMS messaging is not available on this device.');
        return;
      }

      const smsBody = `EMERGENCY REPORT
ID: ${safeReport.report_id}
Type: ${safeReport.details.incident_type}
Location: ${safeReport.details.location.address}${safeReport.details.location.latitude && safeReport.details.location.longitude ? `
GPS Location: ${safeReport.details.location.latitude.toFixed(6)}, ${safeReport.details.location.longitude.toFixed(6)}` : ''}
Description: ${safeReport.details.description}
Injuries: ${safeReport.details.injuries_reported ? 'YES' : 'NO'}
People Involved: ${safeReport.details.number_of_people_involved}
Active Threat: ${safeReport.details.is_active_threat ? 'YES' : 'NO'}
Time: ${formatTimestamp(safeReport.details.timestamp)}`;

      // Use selected image or fallback to evidenceImageUri
      const selectedImageUri = safeReport.details.evidence_images && safeReport.details.evidence_images.length > 0 
        ? safeReport.details.evidence_images[selectedImageIndex]
        : evidenceImageUri;

      const smsOptions: SMS.SMSOptions = {};
        
      if (selectedImageUri) {
        smsOptions.attachments = [
          {
            uri: selectedImageUri,
            mimeType: 'image/jpeg',
            filename: `evidence_${safeReport.report_id}.jpg`,
          }
        ];
      }

      const result = await SMS.sendSMSAsync(['911'], smsBody, smsOptions);
      
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
  }, [safeReport, selectedImageIndex, evidenceImageUri, onSendToEmergency]);

  // Handle null report case without breaking hook rules
  if (!safeReport) {
    return null;
  }

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
              <Text style={videoCallStyles.reportText}>{safeReport.report_id}</Text>
            </View>

            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>Summary</Text>
              <Text style={videoCallStyles.reportText}>{safeReport.summary}</Text>
            </View>

            <ImageGallery
              images={safeReport.details.evidence_images}
              selectedIndex={selectedImageIndex}
              onImageSelect={(imageUri, index) => setSelectedImageIndex(index)}
              showThumbnails={true}
              showCounter={true}
            />

            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>Incident Type</Text>
              <Text style={videoCallStyles.reportText}>{safeReport.details.incident_type}</Text>
            </View>

            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>Location</Text>
              <Text style={videoCallStyles.reportText}>{safeReport.details.location.address}</Text>
              {safeReport.details.location.latitude && safeReport.details.location.longitude && 
               safeReport.details.location.latitude !== 0 && safeReport.details.location.longitude !== 0 && (
                <Text style={videoCallStyles.reportSubText}>
                  GPS: {safeReport.details.location.latitude.toFixed(6)}, {safeReport.details.location.longitude.toFixed(6)}
                </Text>
              )}
            </View>

            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>Description</Text>
              <Text style={videoCallStyles.reportText}>{safeReport.details.description}</Text>
            </View>

            <View style={videoCallStyles.reportRow}>
              <View style={videoCallStyles.reportHalfSection}>
                <Text style={videoCallStyles.reportSectionTitle}>Injuries</Text>
                <Text style={[videoCallStyles.reportText, safeReport.details.injuries_reported && videoCallStyles.reportWarning]}>
                  {safeReport.details.injuries_reported ? 'YES' : 'NO'}
                </Text>
              </View>
              <View style={videoCallStyles.reportHalfSection}>
                <Text style={videoCallStyles.reportSectionTitle}>People Involved</Text>
                <Text style={videoCallStyles.reportText}>{String(safeReport.details.number_of_people_involved)}</Text>
              </View>
            </View>

            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>Active Threat</Text>
              <Text style={[videoCallStyles.reportText, safeReport.details.is_active_threat && videoCallStyles.reportDanger]}>
                {safeReport.details.is_active_threat ? 'YES' : 'NO'}
              </Text>
            </View>

            {safeReport.details.caller_name && (
              <View style={videoCallStyles.reportSection}>
                <Text style={videoCallStyles.reportSectionTitle}>Caller</Text>
                <Text style={videoCallStyles.reportText}>{safeReport.details.caller_name}</Text>
                {safeReport.details.phone_number && (
                  <Text style={videoCallStyles.reportSubText}>{safeReport.details.phone_number}</Text>
                )}
              </View>
            )}

            <View style={videoCallStyles.reportSection}>
              <Text style={videoCallStyles.reportSectionTitle}>Timestamp</Text>
              <Text style={videoCallStyles.reportText}>{formatTimestamp(safeReport.details.timestamp)}</Text>
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
});

export default ReportModal;