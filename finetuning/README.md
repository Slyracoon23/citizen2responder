# Medical Emergency Response Fine-tuning

Fine-tune Gemma 3N for medical emergency response and tool calling, optimized for the Citizen2Responder app.

## Overview

This script fine-tunes Gemma 3N (4B) on medical emergency scenarios including:
- Emergency assessment guidance
- Tool calling for report generation and care instructions
- Structured medical questioning
- Professional EMT handoff preparation

## Requirements

```bash
# Install Unsloth and dependencies
pip install unsloth
pip install torch torchvision torchaudio
pip install transformers datasets trl
```

## Usage

### Basic Training
```bash
python medical_gemma_finetuning.py
```

### What It Does
1. **Loads Gemma 3N-E4B** - 4B parameter model optimized for mobile deployment
2. **Trains on Medical Dataset** - 12 embedded emergency scenarios with tool calling
3. **Saves Multiple Formats**:
   - LoRA adapters for continued training
   - Merged model for inference
   - GGUF format for mobile deployment (llama.rn compatible)

## Dataset

Embedded medical scenarios include:
- Unconscious patient assessment
- Bleeding control procedures
- Cardiac emergency response
- Multi-casualty triage
- Tool calling examples (`generate_report`, `show_precare_instructions`)

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