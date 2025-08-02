<div align="center">
  <img src="assets/images/logo-transparent-with-white-text-and-full-icon.png" alt="Citizen2 Responder Logo" width="400"/>
  
  # Relay Responder App: Technical Writeup
  ## Transforming Emergency Response with Gemma 3n

  *Privacy-focused, offline-capable emergency medical assistance powered by local AI*
</div>

---

## Executive Summary

**The Problem**: In emergency situations, bystanders and first responders on scene often lack the structured guidance needed to effectively assess, document, and care for patients until professional EMTs arrive. These critical first minutes can determine outcomes, yet untrained personnel struggle to play their crucial role in the first response chain.

**Our Solution**: A hybrid AI emergency response app that uses Gemma 3n for privacy-protected local processing while maintaining advanced capabilities through intelligent cloud routing. Built by a programmer-EMT brother team with authentic emergency response experience.

**Impact**: Professional-grade assessment tools ready for real-world emergency deployment with privacy-first architecture and offline capabilities.

## 🎥 Live Demo

<div align="center">
  <a href="https://youtube.com/shorts/sZiRVKiMAcw?feature=share">
    <img src="assets/images/access-image.PNG" alt="Watch App Preview on YouTube" width="300"/>
  </a>
  
  **[📺 Watch Demo Video](https://youtube.com/shorts/sZiRVKiMAcw?feature=share)** | **[🚀 Try Live App](https://expo.dev/preview/update?message=add+precare&updateRuntimeVersion=1.0.0&createdAt=2025-07-31T15%3A20%3A58.533Z&slug=exp&projectId=bb716e6f-12c3-4027-8469-842404ef30f5&group=a46ec03a-d9bc-40c8-affe-95b4aab85a12)**
</div>

---

## The Story Behind the Build

When Google announced the Gemma 3n Impact Challenge, we flew to The Villages, Florida with a unique advantage: **Earl Potters** (a San Francisco programmer) and **Clint Potters** (a Certified EMT). Clint's front-line emergency response experience had revealed a critical gap: the precious minutes before EMTs arrive, when bystanders and first responders on scene could save lives but lack the structured guidance to be truly effective.

"Since Clint was an EMT and the competition had a track for crisis and response, I was immediately inspired," says Earl. "Clint showed me how often people on scene want to help but don't know how to properly assess, document, or provide care until professionals arrive." We realized Gemma 3n's on-device capabilities were perfect for empowering these critical first responders in the chain.

Our development was driven by real scenarios Clint had encountered: untrained bystanders who could have made a difference with proper guidance, the need for structured triage when multiple patients are involved, and bridging the communication gap between scene responders and incoming professional EMTs.

---

## Gemma 3n Innovation: Smart Hybrid Architecture

### The Core Innovation: Privacy-First Intelligent Routing

<div align="center">
  <img src="assets/images/technical-architecture.png" alt="Relay Responder Hybrid AI Architecture" width="800"/>
  <p><em>Hybrid AI Architecture: Privacy-First Smart Routing with Emergency Response Modes</em></p>
</div>

**Smart Routing Logic**: The app intelligently routes text-only requests to local Gemma-3n for privacy protection, while routing vision-enabled requests to cloud services when needed. This hybrid approach ensures medical conversations remain private while enabling advanced visual assessment capabilities.

**Why This Matters**: 
- **Medical conversations never leave the device** → HIPAA-compliant privacy
- **Seamless capability expansion** → Cloud vision when needed, local privacy when essential
- **Critical for emergency scenarios** → Reliable operation when connectivity is poor

### Emergency-Optimized Gemma 3n Implementation

#### Local Model Configuration
**Optimized for Emergency Response**: Gemma-3n runs with memory locking enabled for stable performance, extended context windows (32,768 tokens) to maintain conversation history throughout emergency scenarios, full GPU acceleration for mobile devices, and balanced temperature settings (0.7) to provide creative yet reliable medical guidance.

#### Custom Emergency Prompting
**Specialized Medical Assistant**: The system prompt configures Gemma-3n as a medical emergency assistant with strict rules for structured responses. The model never combines text with JSON outputs, ensuring clean function calling for emergency tools, and focuses on precise, actionable assessment questions that guide scene responders effectively.

**Innovation**: Custom prompt engineering transforms Gemma 3n into a specialized emergency response tool with structured assessment capabilities.

---

## Architecture Overview: Four Emergency Modes

Our app features four AI-powered modes optimized for different emergency scenarios:

<div align="center">
  <img src="assets/images/access-image.PNG" alt="Assess Mode" width="250"/>
  <img src="assets/images/report-image.PNG" alt="Report Mode" width="250"/>
  <img src="assets/images/care-image.PNG" alt="Care Mode" width="250"/>
</div>

### ASSESS Mode
- **Empowers bystanders** with structured medical assessment questions
- **Transforms untrained responders** into effective first-line assessors
- **Privacy-protected** - sensitive patient information never transmitted

### REPORT Mode  
- **Bridges communication gap** between scene responders and incoming EMTs
- **Professional documentation** that EMTs can immediately use upon arrival
- **Seamless handoff** from civilian first responders to professional care

### CARE Mode
- **Guides life-saving interventions** that bystanders can safely perform
- **Context-aware instructions** based on assessment results
- **Empowers immediate action** while waiting for professional help

### VISION Mode
- **Visual assessment support** for scene responders
- **Medical image interpretation** to help identify critical conditions
- **Enhanced situational awareness** for more effective first response

---

## Technical Challenges & Solutions

### Challenge 1: Framework Limitations
**Problem**: llama.rn doesn't support Gemma 3n's multimodal capabilities
**Solution**: Intelligent routing system that maximizes local processing while enabling advanced features

#### llama.rn Framework Implementation

The solution leverages llama.rn, a React Native binding for llama.cpp, which brings the optimized C++ inference engine directly to mobile devices. This enables Gemma-3n to run completely locally on smartphones without internet dependency—critical for emergency scenarios where connectivity may be unreliable. While Gemma-3n supports multimodal capabilities, llama.rn doesn't yet support vision processing—a limitation of the mobile framework binding, not the underlying model. The hybrid architecture works around this by routing text-based conversations to local llama.rn for privacy and directing vision tasks to cloud services, providing emergency responders with full AI capabilities while maintaining on-device processing for sensitive conversations.

### Challenge 2: Emergency Response Requirements
**Problem**: Generic AI assistants aren't optimized for medical emergencies
**Solution**: Custom emergency tool calling system that transforms bystanders into structured first responders

#### Emergency Tool Calling System

##### Two Core Emergency Tools

**1. Report Generation (`generate_report`)**
- Transforms conversation history into professional 911-ready documentation
- Includes caller information, incident details, GPS coordinates, and evidence images
- Provides seamless handoff information when EMTs arrive on scene

**2. Care Instructions (`show_precare_instructions`)**
- Delivers step-by-step emergency care guidance for bystanders
- Priority-based categorization (high/medium/low) based on life-threatening urgency
- Enables safe, effective interventions while waiting for professional help

##### Hybrid Tool Calling Architecture

**For Cloud Models**: Native tool calling with structured function definitions ensures reliable emergency response triggers.

**For Local Gemma-3n**: Since Gemma-3n doesn't support native tool calling, the system uses intelligent JSON parsing to extract emergency tools from natural language responses. Custom validation ensures only emergency-specific tools (`generate_report`, `show_precare_instructions`) are executed, maintaining safety and reliability.

**Smart Validation System**: The `isValidToolCallJson` function verifies that extracted tools match emergency response patterns, preventing invalid or unsafe tool execution during critical situations.

##### Structured Emergency Responses

Each tool call triggers specific UI modes that transform the app interface:
- **Care instructions** display as prioritized, step-by-step guidance  
- **Generated reports** format professionally for immediate EMT review

This tool calling system bridges the gap between untrained bystanders and professional emergency responders, creating an effective first response chain.

### Challenge 3: Professional Emergency Communication
**Problem**: Scene responders need to communicate critical information directly to 911 dispatch and incoming EMTs
**Solution**: Direct SMS integration to 911 services with structured emergency reports

<div align="center">
  <img src="assets/images/sms-911.PNG" alt="911 SMS Integration" width="300"/>
  <p><em>Direct 911 SMS Integration: Professional emergency reports sent directly to dispatch</em></p>
</div>

**Professional Communication Bridge**: Generated reports include structured emergency information (incident type, GPS coordinates, injury details, evidence images) formatted for immediate dispatch and EMT use. This creates a direct communication channel from scene responders to professional emergency services, ensuring critical information reaches the right people instantly.

---

## Real-World Impact & Deployment

### Emergency Scenarios Addressed
1. **Bystander-Witnessed Emergency**: Transforms untrained witnesses into effective first responders with structured assessment guidance
2. **Mass Casualty Event**: Enables multiple scene responders to conduct coordinated triage and documentation until EMTs arrive
3. **Remote Emergency Response**: Empowers first responders in areas with delayed professional response times
4. **Workplace/School Emergency**: Helps designated first responders bridge the gap with professional-grade assessment and care guidance

### Professional Integration Ready
- **EMS-validated workflows** through Clint Potters' emergency response experience
- **Standardized documentation** for professional emergency services
- **Open-source architecture** for widespread adoption
- **HIPAA-compliant potential** through local processing design

---

## Technical Validation

### Code Architecture Quality
- **React Native + Expo**: Cross-platform emergency response tool
- **llama.rn integration**: Efficient Gemma-3n mobile deployment
- **Hybrid routing service**: Smart local/cloud processing decisions
- **Emergency-specific UI**: Four-mode interface optimized for crisis scenarios

### Live Proof of Concept
- **GitHub Repository**: [Complete source code](https://github.com/Slyracoon23/citizen2responder)
- **Live Demo**: [Expo preview](https://expo.dev/preview/update?message=add+precare&updateRuntimeVersion=1.0.0&createdAt=2025-07-31T15%3A20%3A58.533Z&slug=exp&projectId=bb716e6f-12c3-4027-8469-842404ef30f5&group=a46ec03a-d9bc-40c8-affe-95b4aab85a12)
- **Video Demo**: [YouTube demonstration](https://youtube.com/shorts/sZiRVKiMAcw?feature=share)

---

## Conclusion: Beyond the Hackathon

The Relay Responder App demonstrates Gemma 3n's transformative potential for privacy-critical, life-saving applications. By combining authentic emergency response experience with cutting-edge local AI capabilities, we've created a solution that addresses real gaps in emergency communication.

**Key Achievements**:
- **Privacy-preserving emergency AI** through local Gemma-3n processing
- **Professional-grade tools** validated by front-line emergency experience  
- **Innovative hybrid architecture** maximizing both privacy and capability
- **Real-world deployment readiness** for actual emergency response scenarios

This isn't just a technical demonstration—it's a platform for transforming emergency response when privacy, reliability, and human expertise matter most.

---

**Technical Contact**: Available for implementation discussion through GitHub repository.