<div align="center">
  <img src="assets/images/logo-transparent-with-white-text-and-full-icon.png" alt="Citizen2 Responder Logo" width="400"/>
  
  # Relay Responder App
  
  *A cutting-edge emergency response and medical assistance application that combines AI-powered real-time video communication with intelligent assessment tools. Built with React Native and Expo, featuring cloud-based AI processing for optimal performance and reliability.*
</div>

## 🚨 Overview

The Relay Responder App is designed to assist emergency responders, medical professionals, and individuals during critical situations. It provides AI-guided assessments, automated report generation, and real-time care instructions through an intuitive video calling interface.

## 🎥 App Preview

<div align="center">
  <a href="https://youtube.com/shorts/sZiRVKiMAcw?feature=share">
    <img src="assets/images/access-image.PNG" alt="Watch App Preview on YouTube" width="300"/>
  </a>
  
  **[📺 Watch Demo Video](https://youtube.com/shorts/sZiRVKiMAcw?feature=share)**
  
  *See the app in action - AI-powered emergency response tools, real-time assessment, and care instructions*
</div>

## 📱 Try the App

<div align="center">
  <img src="assets/images/qr-code.png" alt="QR Code for Expo Live Demo" width="200"/>
  
  *Scan the QR code with Expo Go or use the link below*
</div>

**[🚀 Live Demo on Expo](https://expo.dev/preview/update?message=add+precare&updateRuntimeVersion=1.0.0&createdAt=2025-07-31T15%3A20%3A58.533Z&slug=exp&projectId=bb716e6f-12c3-4027-8469-842404ef30f5&group=a46ec03a-d9bc-40c8-affe-95b4aab85a12)**

Experience the app instantly using the Expo Go app on your mobile device. Scan the QR code or open the link above to test all features including the AI assessment tools, emergency reporting, and care instructions.

### Key Capabilities

- **AI-Powered Emergency Assessment** - Intelligent questioning and situation analysis
- **Automated Report Generation** - Comprehensive emergency documentation
- **Real-time Care Instructions** - AI-generated medical guidance and protocols
- **Vision Analysis** - Image and video analysis for medical situations
- **Cloud AI Processing** - Advanced AI models via OpenRouter for reliable performance
- **Professional Communication** - Video calling optimized for emergency scenarios

## 🧠 AI Technology

### Cloud AI Processing
- **Text Model**: Gemma-3n (google/gemma-3n-e4b-it) via OpenRouter
- **Vision Model**: Gemini Flash 1.5 8B (google/gemini-flash-1.5-8b) via OpenRouter
- **Framework**: OpenRouter API for cloud-based inference
- **Benefits**: Advanced model capabilities, no local storage requirements, always up-to-date
- **Use Cases**: Text conversations, assessments, report generation, vision analysis

### Smart Model Routing
The app intelligently selects models based on task requirements:
- **Text-only interactions** → Gemma-3n model for optimal performance
- **Vision/image analysis** → Gemini Flash model for multimodal capabilities
- **Automatic optimization** → Model selection based on input type and context

> **📝 Model Selection Note**: We use Gemma-3n exclusively for text processing due to limitations in local model frameworks for mobile devices. While Gemma-3n supports multimodal capabilities, current mobile AI frameworks do not support vision and audio processing locally. Therefore, we route these tasks to specialized cloud models (Gemini Flash) to ensure full functionality and optimal user experience.

## 🎛️ Core Features

### Emergency Response Toggles

The app features four primary access modes accessible through intuitive toggle controls:

#### ASSESS Mode
- **Purpose**: Guided emergency assessment
- **Function**: AI-driven questioning to evaluate situations
- **Icon**: Quiz/Question mark
- **Usage**: Activate to receive structured assessment questions

<div align="center">
  <img src="assets/images/access-image.PNG" alt="Assess Mode Interface" width="300"/>
  <p><em>Assess Mode - Initial emergency assessment with toggle controls</em></p>
</div>

#### REPORT Mode  
- **Purpose**: Automated emergency report generation
- **Function**: Creates comprehensive incident documentation
- **Icon**: Assignment/Document
- **Usage**: Generate detailed reports based on conversation history

<div align="center">
  <img src="assets/images/report-image.PNG" alt="Report Mode Interface" width="300"/>
  <p><em>Report Mode - Emergency report generation with incident details</em></p>
</div>

#### CARE Mode
- **Purpose**: Real-time care instructions
- **Function**: Provides immediate medical guidance and protocols
- **Icon**: Hospital/Medical cross
- **Usage**: Access emergency care instructions and procedures

<div align="center">
  <img src="assets/images/care-image.PNG" alt="Care Mode Interface" width="300"/>
  <p><em>Care Mode - Pre-care instructions with step-by-step guidance</em></p>
</div>

#### VISION Mode
- **Purpose**: Visual analysis capabilities
- **Function**: AI-powered image and video analysis
- **Icon**: Eye/Vision
- **Usage**: Enable camera input for visual assessment

### Additional Controls
- **Camera Toggle**: Video feed control with permission management
- **Voice Toggle**: Audio recording and transcription
- **Keyboard Input**: Text-based communication option
- **Transcription**: Real-time speech-to-text conversion

## 🛠️ Technology Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development and deployment platform
- **TypeScript** - Type-safe development

### AI & ML
- **OpenRouter** - Cloud AI API gateway and model access
- **Gemma-3n** - Advanced language model for text processing
- **Gemini Flash 1.5 8B** - Multimodal model for vision tasks

## 📱 Setup Instructions

### Prerequisites
- Node.js 18+ 
- Expo CLI
- iOS Simulator or Android Emulator
- Physical device for optimal performance

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd relay-responder-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with required API keys:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```
   
   **API Key Setup:**
   - Sign up at [OpenRouter](https://openrouter.ai/) to get your API key
   - Add credits to your OpenRouter account for model usage
   - Replace `your_openrouter_api_key_here` with your actual API key

### Development

1. **Start development server**
   ```bash
   npm start
   ```

2. **Run on device**
   ```bash
   # iOS
   npm run ios
   
   # Android  
   npm run android
   ```

## 📋 Development Scripts

```bash
npm start              # Standard Expo start
npm run android        # Run on Android device/emulator
npm run ios            # Run on iOS device/simulator
npm run web            # Run on web browser
npm run lint           # Code linting
npm run reset-project  # Reset project configuration
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**⚠️ Emergency Disclaimer**: This application is designed to assist in emergency situations but should not replace professional medical advice or emergency services. Always contact appropriate emergency services (911, etc.) for immediate medical emergencies.