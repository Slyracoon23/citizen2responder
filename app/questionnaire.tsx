import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Linking, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

type QuestionnaireStep = 'describe' | 'photo' | 'followup' | 'report';

interface FollowUpQuestion {
  id: string;
  question: string;
  subQuestions?: string[];
}

export default function QuestionnaireScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<QuestionnaireStep>('describe');
  const [description, setDescription] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const suggestions = ['Accident', 'Fall', 'Fire', 'Medical', 'Violence', 'Other'];

  const followUpQuestions: FollowUpQuestion[] = [
    {
      id: 'conscious',
      question: 'Is the person conscious?',
      subQuestions: ['Are they breathing?', 'Is there severe bleeding?']
    },
    {
      id: 'breathing',
      question: 'Are they breathing normally?',
    },
    {
      id: 'bleeding',
      question: 'Is there severe bleeding?',
    }
  ];

  const handleSuggestionPress = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
    setDescription(suggestion);
  };

  const handleBack = () => {
    if (currentStep === 'describe') {
      router.back();
    } else if (currentStep === 'photo') {
      setCurrentStep('describe');
    } else if (currentStep === 'followup') {
      setCurrentStep('photo');
    } else if (currentStep === 'report') {
      setCurrentStep('followup');
    }
  };

  const handleNext = () => {
    if (currentStep === 'describe') {
      setCurrentStep('photo');
    } else if (currentStep === 'photo') {
      setCurrentStep('followup');
    } else if (currentStep === 'followup') {
      if (currentQuestionIndex < followUpQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setCurrentStep('report');
      }
    }
  };

  const handleAnswerQuestion = (answer: boolean) => {
    const currentQuestion = followUpQuestions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
    
    // Auto-advance to next question or final step
    setTimeout(() => {
      handleNext();
    }, 500);
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      'This will call emergency services (911). Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call 911', 
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:911');
          }
        }
      ]
    );
  };

  const handleRelayReport = () => {
    Alert.alert(
      'Report Sent',
      'Your report has been relayed to emergency services. They will respond based on the information provided.',
      [{ text: 'OK' }]
    );
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedMedia(result.assets[0].uri);
    }
  };

  const handleChooseFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedMedia(result.assets[0].uri);
    }
  };

  const renderDescribeStep = () => (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ThemedText style={styles.backButtonText}>←</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ThemedText style={styles.title}>Describe what happened</ThemedText>
        
        <TextInput
          style={styles.textInput}
          placeholder="Briefly describe the incident..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.suggestionsContainer}>
          <ThemedText style={styles.suggestionsTitle}>Suggestions</ThemedText>
          <View style={styles.suggestionsGrid}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={[
                  styles.suggestionChip,
                  selectedSuggestion === suggestion && styles.selectedChip
                ]}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <ThemedText style={[
                  styles.suggestionText,
                  selectedSuggestion === suggestion && styles.selectedChipText
                ]}>
                  {suggestion}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.nextButton, (!description.trim()) && styles.disabledButton]}
          onPress={handleNext}
          disabled={!description.trim()}
        >
          <ThemedText style={styles.nextButtonText}>NEXT</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  const renderPhotoStep = () => (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ThemedText style={styles.backButtonText}>←</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ThemedText style={styles.title}>
          Take a photo or video of any injuries, hazards, or the patient&apos;s location
        </ThemedText>

        {/* Camera Preview Area */}
        <View style={styles.cameraContainer}>
          {capturedMedia ? (
            <Image source={{ uri: capturedMedia }} style={styles.previewImage} />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <ThemedText style={styles.cameraPlaceholderText}>
                📷 No photo taken yet
              </ThemedText>
            </View>
          )}
        </View>

        {/* Camera Controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.galleryButton} onPress={handleChooseFromLibrary}>
            <View style={styles.galleryThumbnail}>
              <ThemedText style={styles.galleryIcon}>📁</ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
            <View style={styles.captureButtonInner}>
              <View style={styles.captureButtonCenter} />
            </View>
          </TouchableOpacity>

          <View style={styles.placeholderButton} />
        </View>

        <TouchableOpacity 
          style={[styles.nextButton, !capturedMedia && styles.disabledButton]}
          onPress={handleNext}
          disabled={!capturedMedia}
        >
          <ThemedText style={styles.nextButtonText}>NEXT</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  const renderFollowUpStep = () => {
    const currentQuestion = followUpQuestions[currentQuestionIndex];
    const totalQuestions = followUpQuestions.length;
    
    return (
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ThemedText style={styles.backButtonText}>←</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ThemedText style={styles.title}>
            {currentQuestion.question}
          </ThemedText>

          {/* Sub-questions if they exist */}
          {currentQuestion.subQuestions && (
            <View style={styles.subQuestionsContainer}>
              {currentQuestion.subQuestions.map((subQuestion, index) => (
                <ThemedText key={index} style={styles.subQuestion}>
                  {subQuestion}
                </ThemedText>
              ))}
            </View>
          )}

          {/* Yes/No Buttons */}
          <View style={styles.answerButtonsContainer}>
            <TouchableOpacity 
              style={[styles.answerButton, styles.yesButton]}
              onPress={() => handleAnswerQuestion(true)}
            >
              <ThemedText style={styles.yesButtonText}>YES</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.answerButton, styles.noButton]}
              onPress={() => handleAnswerQuestion(false)}
            >
              <ThemedText style={styles.noButtonText}>NO</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <ThemedText style={styles.progressText}>
              {currentQuestionIndex + 1} / {totalQuestions}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  };

  const renderReportStep = () => (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ThemedText style={styles.backButtonText}>←</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Incident Report</ThemedText>
        
        {/* Report Summary */}
        <View style={styles.reportSection}>
          <ThemedText style={styles.reportSectionTitle}>Description</ThemedText>
          <View style={styles.reportCard}>
            <ThemedText style={styles.reportText}>{description}</ThemedText>
          </View>
        </View>

        {/* Photo Section */}
        {capturedMedia && (
          <View style={styles.reportSection}>
            <ThemedText style={styles.reportSectionTitle}>Photo Evidence</ThemedText>
            <View style={styles.reportPhotoContainer}>
              <Image source={{ uri: capturedMedia }} style={styles.reportPhoto} />
            </View>
          </View>
        )}

        {/* Assessment Results */}
        <View style={styles.reportSection}>
          <ThemedText style={styles.reportSectionTitle}>Assessment</ThemedText>
          <View style={styles.reportCard}>
            {followUpQuestions.map((question) => (
              <View key={question.id} style={styles.assessmentItem}>
                <ThemedText style={styles.assessmentQuestion}>
                  {question.question}
                </ThemedText>
                <View style={[
                  styles.assessmentAnswer,
                  answers[question.id] ? styles.yesAnswer : styles.noAnswer
                ]}>
                  <ThemedText style={[
                    styles.assessmentAnswerText,
                    answers[question.id] ? styles.yesAnswerText : styles.noAnswerText
                  ]}>
                    {answers[question.id] ? 'YES' : 'NO'}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Emergency Actions */}
        <View style={styles.emergencyActionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.emergencyButton]}
            onPress={handleEmergencyCall}
          >
            <ThemedText style={styles.emergencyButtonText}>
              🚨 CALL EMERGENCY
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.relayButton]}
            onPress={handleRelayReport}
          >
            <ThemedText style={styles.relayButtonText}>
              📡 RELAY REPORT
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );

  // Render the appropriate step
  if (currentStep === 'describe') {
    return renderDescribeStep();
  } else if (currentStep === 'photo') {
    return renderPhotoStep();
  } else if (currentStep === 'followup') {
    return renderFollowUpStep();
  } else if (currentStep === 'report') {
    return renderReportStep();
  }

  // Fallback
  return renderDescribeStep();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    lineHeight: 36,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
    minHeight: 120,
    marginBottom: 40,
  },
  suggestionsContainer: {
    marginBottom: 60,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  suggestionChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedChip: {
    backgroundColor: '#4A7CB8',
    borderColor: '#4A7CB8',
  },
  suggestionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  selectedChipText: {
    color: 'white',
  },
  // Photo Step Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 30,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  cameraPlaceholderText: {
    fontSize: 18,
    color: '#666',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryIcon: {
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E0E0E0',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonCenter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF4444',
  },
  placeholderButton: {
    width: 50,
    height: 50,
  },
  // Follow-up Questions Styles
  subQuestionsContainer: {
    marginBottom: 60,
  },
  subQuestion: {
    fontSize: 18,
    color: '#666',
    marginBottom: 12,
    lineHeight: 24,
  },
  answerButtonsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    marginBottom: 60,
  },
  answerButton: {
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  yesButton: {
    backgroundColor: '#4A7CB8',
  },
  noButton: {
    backgroundColor: '#E0E0E0',
  },
  yesButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  noButtonText: {
    color: '#666',
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  progressText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  // Report Screen Styles
  reportSection: {
    marginBottom: 30,
  },
  reportSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  reportCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reportText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  reportPhotoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  reportPhoto: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  assessmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  assessmentQuestion: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  assessmentAnswer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  yesAnswer: {
    backgroundColor: '#4A7CB8',
  },
  noAnswer: {
    backgroundColor: '#E0E0E0',
  },
  assessmentAnswerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  yesAnswerText: {
    color: 'white',
  },
  noAnswerText: {
    color: '#666',
  },
  emergencyActionsContainer: {
    marginTop: 20,
    marginBottom: 40,
    gap: 16,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyButton: {
    backgroundColor: '#D93636',
  },
  relayButton: {
    backgroundColor: '#4A7CB8',
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  relayButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#4A7CB8',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 