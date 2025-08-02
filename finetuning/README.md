# Medical Emergency Response Fine-tuning

Fine-tune Gemma 3N for medical emergency response and tool calling, optimized for the Citizen2Responder app.

## Overview

This script fine-tunes Gemma 3N (4B) on comprehensive medical emergency scenarios including:
- Progressive emergency assessment with multi-turn conversations
- Tool calling for report generation and care instructions
- Structured medical questioning and triage
- Professional EMT handoff preparation
- Realistic emergency response patterns

## Requirements

```bash
# Install Unsloth and dependencies
pip install unsloth
pip install torch torchvision torchaudio
pip install transformers datasets trl
pip install wandb  # For experiment tracking
```

## Usage

### Basic Training
```bash
python medical_gemma_finetuning.py
```

### What It Does
1. **Loads External Dataset** - 20+ comprehensive medical scenarios from JSON file
2. **Validates Dataset** - Checks conversation structure, tool calling, and medical accuracy
3. **Trains Gemma 3N-E4B** - 4B parameter model optimized for mobile deployment
4. **Tracks with WandB** - Comprehensive experiment tracking and visualization
5. **Saves Multiple Formats**:
   - LoRA adapters for continued training
   - Merged model for inference
   - GGUF format for mobile deployment (llama.rn compatible)

## Dataset Structure

### External JSON Dataset (`datasets/medical_emergency_dataset.json`)
- **20+ Emergency Scenarios** with progressive assessment patterns
- **Multi-turn Conversations** averaging 7+ turns per scenario
- **Assessment Questions** averaging 5+ questions per emergency
- **Tool Calling Integration** for `generate_report` and `show_precare_instructions`

### Medical Categories Covered:
- **Cardiac emergencies**: Heart attack, cardiac arrest, chest pain, AED usage
- **Respiratory emergencies**: Choking, asthma, anaphylaxis
- **Trauma & bleeding**: Severe bleeding, burns, fractures, head injuries
- **Neurological**: Stroke, seizures, concussion assessment
- **Poisoning & overdose**: Drug overdose, chemical ingestion
- **Multi-casualty events**: Car accidents, workplace injuries, triage
- **Pediatric emergencies**: Infant choking, febrile seizures

### Conversation Flow Examples:
- Initial user emergency description
- Progressive AI questioning for assessment
- Multiple rounds of information gathering
- Final tool calling for appropriate response
- Realistic emergency response dialogue

## Output Models

### For Mobile Deployment (llama.rn)
- `medical_gemma_mobile/` - GGUF Q8_0 format
- Compatible with relay-responder-app's existing architecture
- Maintains privacy-first local processing

### For Cloud Deployment
- `medical_gemma_merged/` - Full merged model
- `medical_gemma_lora/` - LoRA adapters only

## Integration with Relay-Responder-App

1. Replace existing model in `models/` directory with `medical_gemma_mobile.gguf`
2. Update model path in llama.rn configuration
3. Maintain existing hybrid architecture (local/cloud routing)

## Training Configuration

- **Base Model**: unsloth/gemma-3n-E4B-it (4B parameters)
- **Method**: LoRA fine-tuning (r=16, alpha=16)
- **Steps**: 200 training steps
- **Learning Rate**: 1e-4 (conservative for medical accuracy)
- **Memory**: 4-bit quantization for efficient training

## Medical Accuracy Note

This model provides emergency guidance but should not replace professional medical training. Always encourage users to call 911 for serious emergencies and defer to professional medical personnel.

## Emergency Tool Calling

The model is trained to trigger two key tools:
- `generate_report` - Creates structured emergency reports for 911/EMT handoff
- `show_precare_instructions` - Provides step-by-step emergency care guidance

Tool calls are formatted as JSON within the model response for parsing by the app's existing tool calling system.