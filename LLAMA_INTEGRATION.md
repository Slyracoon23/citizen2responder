# llama.rn Integration Documentation

## Overview
Successfully integrated llama.rn to replace OpenRouter for text-only model inference, enabling local AI processing with the Gemma 3n model while maintaining cloud fallback.

## Architecture Changes

### 1. Service Layer
- **LocalModelService** (`app/services/localModelService.ts`): New service handling llama.rn integration
- **ApiService** (`app/services/apiService.ts`): Updated to route text/vision calls intelligently
  - Text-only calls → Local model (with OpenRouter fallback)
  - Vision calls → OpenRouter (Gemini Flash 1.5 8B)

### 2. Model Configuration
- **Model**: `gemma-3n-E2B-it-Q4_K_M.gguf` (already available in models folder)
- **Configuration**: Optimized for mobile with 32k context, GPU acceleration
- **Tool Calling**: Maintains existing JSON-based tool calling system

### 3. UI Integration
- **Initialization Banner**: Shows local model loading status
- **Error Handling**: Displays fallback messages when local model fails
- **Processing Indicators**: Distinguishes between local and cloud AI processing

## Key Features

### Smart Routing
```typescript
// Text-only requests use local model
if (!isImageInputEnabled) {
  return await localModelService.callLocalModel(conversationHistory, currentMessage);
}
// Vision requests use OpenRouter
```

### Fallback Mechanism
- Local model initialization failure → Uses OpenRouter as backup
- Individual request failures → Automatic fallback to cloud
- Graceful error handling with user notifications

### Resource Management
- Model initialization on app startup
- Automatic cleanup on app unmount
- Memory-efficient inference with streaming

## Build Configuration

### Package Dependencies
- Added `llama.rn: ^0.6.5`
- Updated app.json for local build requirements
- Enhanced scripts for development workflow

### Build Scripts
```json
{
  "start:dev": "expo start --dev-client",
  "android:dev": "expo run:android --variant debug",
  "ios:dev": "expo run:ios --configuration Debug",
  "build:android": "eas build --platform android",
  "build:ios": "eas build --platform ios",
  "prebuild": "expo prebuild --clean"
}
```

## Usage Instructions

### Development
1. **Install dependencies**: `npm install`
2. **Prebuild**: `npm run prebuild` (first time only)
3. **Start dev server**: `npm run start:dev`
4. **Run on device**: `npm run ios:dev` or `npm run android:dev`

### Production
1. **Build**: `npm run build:ios` or `npm run build:android`
2. **Deploy**: Standard EAS deployment process

## Benefits Achieved

### Performance
- **Reduced Latency**: Local inference eliminates network round-trips
- **Offline Capability**: Text conversations work without internet
- **Cost Reduction**: Eliminates OpenRouter costs for text-only operations

### Privacy
- **Local Processing**: Conversations stay on device for text interactions
- **Data Security**: Reduced external API dependency

### Reliability
- **Fallback System**: Automatic cloud backup when local model fails
- **Seamless Experience**: Users experience continuous AI assistance

## Technical Details

### Model Format
- **Type**: GGUF (GPT-Generated Unified Format)
- **Quantization**: Q4_K_M (4-bit quantization, medium quality)
- **Size**: Optimized for mobile deployment

### Tool Calling Integration
- Maintains existing JSON-based tool calling system
- Compatible with `generate_report` and `show_precare_instructions`
- Preserves conversation flow and UI interactions

### Error Handling
- Graceful degradation to cloud services
- User-friendly error messages
- Comprehensive logging for debugging

## Future Enhancements

### Potential Improvements
1. **Model Caching**: Pre-load model on app installation
2. **Model Updates**: Dynamic model downloading and updating
3. **Performance Monitoring**: Track local vs cloud usage metrics
4. **Model Selection**: Allow users to choose between different local models

### Considerations
- **Storage**: Monitor device storage usage
- **Battery**: Optimize for battery efficiency
- **Thermal**: Monitor device temperature during inference