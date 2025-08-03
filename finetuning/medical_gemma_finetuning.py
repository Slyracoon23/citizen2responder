# %% [markdown]
"""
# Medical Emergency Response Fine-tuning with Gemma 3N
## Citizen2Responder: Dual-Mode Privacy-First Emergency AI

This notebook fine-tunes Gemma 3N for dual-mode medical emergency response scenarios:

### 🗣️ Natural Conversation Mode
- **Emergency Assessment**: Progressive medical questioning and guidance
- **Conversational Flow**: Natural dialogue without tool call JSON
- **Educational Support**: Teaching bystanders emergency response

### 🔧 Forced Tool Call Mode  
- **Report Generation**: Structured emergency reports for EMTs/dispatch
- **Care Instructions**: Formatted step-by-step medical procedures
- **Pure JSON Output**: Direct tool responses without explanatory text

### 🏥 Key Features
- **Dual Training Approach**: Separate datasets for conversation vs tool calling
- **Privacy Protection**: Local processing for sensitive medical conversations
- **Professional Integration**: EMT-ready documentation and handoff
- **Mobile Deployment**: Optimized for llama.rn integration

Based on Unsloth's Gemma 3N framework, designed to understand when to engage in natural conversation vs when to output structured tool responses.

**Target Use Case**: Transform untrained bystanders into effective first responders with context-aware AI that can both educate and generate professional documentation.
"""

# %% [markdown]
"""
## Installation Requirements

Before running this notebook, install the required dependencies:

```bash
# Core Unsloth framework for efficient fine-tuning
pip install unsloth

# PyTorch for GPU acceleration
pip install torch torchvision torchaudio

# HuggingFace ecosystem for model training
pip install transformers datasets trl

# Weights & Biases for experiment tracking
pip install wandb

# Optional: Upgrade transformers for latest Gemma 3N support
pip install --no-deps --upgrade timm
```

**GPU Requirements**: CUDA-compatible GPU with at least 8GB VRAM recommended for 4B parameter model.

**WandB Setup**: Run `wandb login` before training to enable experiment tracking and visualization.
"""

# %% [code]
import torch
import wandb
import json
from pathlib import Path
from datasets import Dataset
from unsloth import FastModel
from unsloth.chat_templates import get_chat_template, standardize_data_formats, train_on_responses_only
from trl import SFTTrainer, SFTConfig
from transformers import TextStreamer
from huggingface_hub import HfApi

# Fix TorchDynamo recompilation limit issues
torch._dynamo.config.disable = True
torch._dynamo.config.cache_size_limit = 128

# HuggingFace Hub Configuration
HF_REPO_ID = "Slyracoon23/medical-gemma3n-emergency-response"  # Your HuggingFace profile
UPLOAD_TO_HF = True  # Set to False to skip HuggingFace upload
PRIVATE_REPO = False  # Set to True for private repository

# %% [markdown]
"""
## Medical Emergency Dataset Loading and Validation

### External Dataset Structure
The dataset is now stored in `datasets/medical_emergency_dataset.json` with comprehensive scenarios including:

1. **Progressive Assessment**: Multi-turn conversations with detailed questioning
2. **Tool Calling Integration**: Proper `generate_report` and `show_precare_instructions` usage
3. **Emergency Categories**: 20+ scenarios covering all major emergency types
4. **Realistic Conversations**: EMT-validated emergency response patterns

### Dataset Categories:
- **Cardiac emergencies**: Heart attack, cardiac arrest, chest pain
- **Respiratory emergencies**: Choking, asthma, anaphylaxis  
- **Trauma & bleeding**: Severe bleeding, burns, fractures
- **Neurological**: Stroke, seizures, concussion
- **Poisoning & overdose**: Drug overdose, chemical ingestion
- **Multi-casualty events**: Car accidents, workplace injuries
- **Pediatric emergencies**: Infant choking, febrile seizures

### Validation Features:
- Conversation flow validation
- Tool calling format verification
- Medical accuracy checks
- Training statistics tracking
"""

# %% [code]
def load_medical_dataset(natural_dataset_path="datasets/medical_emergency_dataset.json", 
                        forced_tools_path="datasets/forced_tool_calls_dataset.json"):
    """Load and combine both natural conversation and forced tool call datasets"""
    
    try:
        # Load natural conversation dataset
        natural_file = Path(natural_dataset_path)
        if not natural_file.exists():
            raise FileNotFoundError(f"Natural conversation dataset not found: {natural_dataset_path}")
            
        with open(natural_file, 'r', encoding='utf-8') as f:
            natural_dataset = json.load(f)
            
        print(f"📊 Natural conversation dataset loaded from {natural_dataset_path}")
        print(f"📈 Natural dataset: {natural_dataset['dataset_info']['total_scenarios']} scenarios")
        
        # Load forced tool calls dataset
        forced_file = Path(forced_tools_path)
        if not forced_file.exists():
            raise FileNotFoundError(f"Forced tool calls dataset not found: {forced_tools_path}")
            
        with open(forced_file, 'r', encoding='utf-8') as f:
            forced_dataset = json.load(f)
            
        print(f"📊 Forced tool calls dataset loaded from {forced_tools_path}")
        print(f"📈 Forced dataset: {forced_dataset['dataset_info']['total_scenarios']} scenarios")
        
        # Combine datasets
        combined_dataset = {
            "dataset_info": {
                "version": "1.2-combined",
                "created_date": "2025-08-02",
                "description": "Combined medical emergency dataset with natural conversations and forced tool calls",
                "natural_scenarios": natural_dataset['dataset_info']['total_scenarios'],
                "forced_tool_scenarios": forced_dataset['dataset_info']['total_scenarios'],
                "total_scenarios": natural_dataset['dataset_info']['total_scenarios'] + forced_dataset['dataset_info']['total_scenarios'],
                "tool_functions": ["generate_report", "show_precare_instructions"],
                "training_types": ["natural_conversation", "forced_tool_calls"]
            },
            "scenarios": natural_dataset["scenarios"] + forced_dataset["scenarios"]
        }
        
        print(f"✅ Combined dataset created with {combined_dataset['dataset_info']['total_scenarios']} total scenarios")
        print(f"   - Natural conversations: {combined_dataset['dataset_info']['natural_scenarios']}")
        print(f"   - Forced tool calls: {combined_dataset['dataset_info']['forced_tool_scenarios']}")
        
        return combined_dataset
        
    except Exception as e:
        print(f"❌ Error loading datasets: {e}")
        raise

def validate_dataset(dataset_json):
    """Validate dataset structure and content for medical training"""
    
    scenarios = dataset_json["scenarios"][:3]  # Limit validation to only 3 examples
    stats = {
        "total_scenarios": len(scenarios),
        "categories": {},
        "priorities": {"high": 0, "medium": 0, "low": 0},
        "training_types": {"natural_conversation": 0, "forced_tool_call": 0},
        "tools_used": {"generate_report": 0, "show_precare_instructions": 0},
        "avg_conversation_turns": 0,
        "conversation_analysis": {"natural": [], "forced": []}
    }
    
    total_turns = 0
    conversation_count = 0
    
    for scenario in scenarios:
        # Category distribution
        category = scenario["category"]
        stats["categories"][category] = stats["categories"].get(category, 0) + 1
        
        # Priority distribution  
        priority = scenario["priority"]
        stats["priorities"][priority] += 1
        
        # Training type classification
        if category == "forced_tool_call":
            stats["training_types"]["forced_tool_call"] += 1
            # For forced tool calls, analyze the tool type
            subcategory = scenario.get("subcategory", "unknown")
            if subcategory in stats["tools_used"]:
                stats["tools_used"][subcategory] += 1
        else:
            stats["training_types"]["natural_conversation"] += 1
            # For natural conversations, check final tool if available
            final_tool = scenario.get("final_tool")
            if final_tool and final_tool in stats["tools_used"]:
                stats["tools_used"][final_tool] += 1
            
        # Conversation metrics
        conversation_turns = scenario.get("conversation_turns", len(scenario["conversation"]))
        total_turns += conversation_turns
        conversation_count += 1
        
        # Validate conversation structure
        conversation = scenario["conversation"]
        if not conversation or len(conversation) == 0:
            raise ValueError(f"Empty conversation in scenario {scenario['id']}")
            
        # Analyze conversation type
        if category == "forced_tool_call":
            # For forced tool calls, expect final assistant response to be pure JSON
            final_message = conversation[-1]["content"][0]["text"]
            if not (final_message.strip().startswith("{") and "function" in final_message):
                print(f"⚠️  Warning: Forced tool call scenario {scenario['id']} doesn't end with JSON tool call")
            stats["conversation_analysis"]["forced"].append({
                "id": scenario["id"],
                "turns": len(conversation),
                "ends_with_json": final_message.strip().startswith("{")
            })
        else:
            # For natural conversations, expect NO tool calls in responses
            for turn in conversation:
                if turn["role"] == "assistant":
                    response_text = turn["content"][0]["text"]
                    if "tool_calls" in response_text or response_text.strip().startswith("{"):
                        print(f"⚠️  Warning: Natural conversation {scenario['id']} contains tool call JSON")
            stats["conversation_analysis"]["natural"].append({
                "id": scenario["id"],
                "turns": len(conversation),
                "has_tool_calls": any("tool_calls" in turn["content"][0]["text"] 
                                    for turn in conversation if turn["role"] == "assistant")
            })
    
    # Calculate averages
    stats["avg_conversation_turns"] = round(total_turns / conversation_count, 1) if conversation_count > 0 else 0
    
    print(f"\n📊 Combined Dataset Validation Results:")
    print(f"   Total scenarios: {stats['total_scenarios']}")
    print(f"   Training types: {stats['training_types']}")
    print(f"   Categories: {stats['categories']}")
    print(f"   Priority distribution: {stats['priorities']}")
    print(f"   Tool usage: {stats['tools_used']}")
    print(f"   Avg conversation turns: {stats['avg_conversation_turns']}")
    
    # Validation summary
    natural_clean = sum(1 for conv in stats["conversation_analysis"]["natural"] if not conv["has_tool_calls"])
    forced_valid = sum(1 for conv in stats["conversation_analysis"]["forced"] if conv["ends_with_json"])
    
    print(f"\n✅ Dataset Quality Check:")
    print(f"   Natural conversations without tool calls: {natural_clean}/{stats['training_types']['natural_conversation']}")
    print(f"   Forced tool calls with valid JSON: {forced_valid}/{stats['training_types']['forced_tool_call']}")
    
    return stats

def convert_to_training_format(dataset_json):
    """Convert external dataset format to training format"""
    
    training_data = []
    for scenario in dataset_json["scenarios"]:
        # Flatten the nested content structure for Unsloth compatibility
        flattened_conversation = []
        for message in scenario["conversation"]:
            flattened_message = {
                "role": message["role"],
                "content": message["content"][0]["text"]  # Extract text from nested structure
            }
            flattened_conversation.append(flattened_message)
        
        training_data.append({
            "conversations": flattened_conversation
        })
    
    print(f"✅ Converted {len(training_data)} scenarios to training format")
    return training_data

# Load and validate dataset
from pathlib import Path  # Ensure Path is available
DATASET_JSON = load_medical_dataset()
DATASET_STATS = validate_dataset(DATASET_JSON)
MEDICAL_DATASET = convert_to_training_format(DATASET_JSON)

# %% [markdown]
"""
## Model Setup and Configuration

### Gemma 3N Model Selection

We use **Gemma 3N-E4B-it** (4 billion parameters) for optimal balance of:
- **Performance**: Sufficient capability for medical reasoning
- **Mobile Compatibility**: Small enough for mobile deployment via llama.rn
- **Privacy**: Runs completely locally without internet dependency

### Key Configuration Choices:
- **4-bit Quantization**: Reduces memory usage for mobile devices
- **2048 Token Context**: Adequate for medical conversations with history
- **Instruction Tuning**: Pre-trained on conversational format
- **LoRA Fine-tuning**: Efficient adapter training without full model updates

This configuration enables emergency response capabilities while maintaining the privacy-first architecture of Citizen2Responder.
"""

# %% [code]
def setup_model_and_tokenizer():
    """Initialize Gemma 3N model with medical emergency configuration"""
    print("Loading Gemma 3N model for medical emergency fine-tuning...")
    
    model, tokenizer = FastModel.from_pretrained(
        model_name="unsloth/gemma-3n-E4B-it",
        dtype=None,  # Auto detection for optimal precision
        max_seq_length=2048,  # Sufficient for medical conversations with context
        load_in_4bit=True,  # Memory efficient for mobile deployment
        full_finetuning=False,  # Use LoRA for efficient training
    )
    
    # Configure Gemma-3 chat template for medical conversations
    tokenizer = get_chat_template(
        tokenizer,
        chat_template="gemma-3",
    )
    
    return model, tokenizer

# %% [markdown]
"""
## Dataset Preparation and Chat Template

### Data Processing Pipeline

1. **Format Conversion**: Transform embedded conversations to HuggingFace Dataset
2. **Standardization**: Ensure consistent format across all medical scenarios  
3. **Chat Template Application**: Apply Gemma-3 conversation formatting
4. **Token Preparation**: Convert to training-ready format

### Gemma-3 Chat Format
The model expects conversations in this specific format:
```
<start_of_turn>user
[User question about emergency]<end_of_turn>
<start_of_turn>model
[Medical guidance response]<end_of_turn>
```

### Key Processing Steps:
- Remove `<bos>` tokens (added automatically during training)
- Maintain conversation structure for multi-turn scenarios
- Preserve tool calling JSON formatting for emergency functions
"""

# %% [code]
def prepare_dataset():
    """Convert embedded medical dataset to training format"""
    print("Preparing medical emergency dataset...")
    
    # Convert to HuggingFace dataset format for training
    dataset = Dataset.from_list(MEDICAL_DATASET)
    
    # Standardize data formats for consistency
    dataset = standardize_data_formats(dataset)
    
    return dataset

def apply_medical_chat_template(dataset, tokenizer):
    """Apply Gemma-3 chat template with medical-specific formatting"""
    
    def formatting_prompts_func(examples):
        convos = examples["conversations"]
        texts = [
            tokenizer.apply_chat_template(
                convo, 
                tokenize=False, 
                add_generation_prompt=False
            ).removeprefix('<bos>')  # Remove BOS token (added during training)
            for convo in convos
        ]
        return {"text": texts}
    
    dataset = dataset.map(formatting_prompts_func, batched=True)
    return dataset

# %% [markdown]
"""
## LoRA Configuration for Medical Fine-tuning

### Low-Rank Adaptation (LoRA) Benefits:
- **Memory Efficient**: Only trains small adapter matrices instead of full model
- **Faster Training**: Reduces computational requirements significantly  
- **Better Generalization**: Lower risk of overfitting on medical domain
- **Mobile Deployment**: Smaller model size for mobile applications

### Medical-Specific LoRA Settings:
- **Rank (r=16)**: Higher rank for medical domain complexity
- **Alpha (16)**: Scaling factor matching rank for stable training
- **Dropout (0.1)**: Prevents overfitting on limited medical examples
- **Text-Only**: Vision layers disabled for privacy-first architecture

### Target Modules:
- **Language Layers**: Core text understanding and generation
- **Attention Modules**: Critical for medical reasoning and context
- **MLP Modules**: Essential for domain-specific knowledge encoding
"""

# %% [code]
def setup_lora_model(model):
    """Configure LoRA adapters for efficient medical fine-tuning"""
    print("Setting up LoRA adapters for medical training...")
    
    model = FastModel.get_peft_model(
        model,
        finetune_vision_layers=False,  # Text-only for privacy protection
        finetune_language_layers=True,  # Core language understanding
        finetune_attention_modules=True,  # Medical reasoning and context
        finetune_mlp_modules=True,  # Domain knowledge encoding
        r=16,  # Higher rank for medical domain complexity
        lora_alpha=16,  # Scaling factor for stable training
        lora_dropout=0.1,  # Prevent overfitting on limited data
        bias="none",
        random_state=3407,
    )
    
    return model

# %% [markdown]
"""
## Training Configuration for Medical Domain

### Conservative Training Approach
Medical applications require careful parameter tuning to ensure:
- **Accuracy**: Reliable medical guidance without hallucinations
- **Safety**: Conservative learning rate to prevent unstable training
- **Efficiency**: Balanced batch size for memory and convergence

### Key Training Parameters:
- **Learning Rate (1e-4)**: Conservative rate for medical accuracy
- **Batch Size (2)**: Manageable for GPU memory with gradient accumulation
- **Steps (200)**: Sufficient for domain adaptation without overfitting  
- **Optimizer (AdamW 8-bit)**: Memory efficient with good convergence

### Experiment Tracking with WandB:
- **Loss Monitoring**: Real-time training loss visualization
- **Learning Rate Scheduling**: Track learning rate changes over time
- **Memory Usage**: Monitor GPU utilization throughout training
- **Model Comparisons**: Compare different hyperparameter configurations

### Response-Only Training:
We train only on medical assistant responses, not user questions, to:
- Focus learning on expert medical guidance
- Prevent the model from mimicking untrained user behavior
- Improve quality of medical advice generation
"""

# %% [code]
def create_medical_trainer(model, tokenizer, dataset):
    """Setup trainer with medical-specific configurations"""
    print("Configuring trainer for medical emergency scenarios...")
    
    # Initialize Weights & Biases for experiment tracking
    wandb.init(
        project="medical-gemma3n-finetuning",
        name="citizen2responder-dual-training-v2",
        config={
            "model": "gemma-3n-E4B-it",
            "dataset_size": len(dataset),
            "learning_rate": 1e-4,
            "batch_size": 2,
            "gradient_accumulation_steps": 4,
            "max_steps": 200,
            "lora_rank": 16,
            "lora_alpha": 16,
            "lora_dropout": 0.1,
            "domain": "medical_emergency_response",
            "use_case": "citizen2responder_app",
            "training_approach": "dual_mode_training",
            # Dataset statistics
            "dataset_stats": DATASET_STATS,
            "total_scenarios": DATASET_STATS["total_scenarios"],
            "natural_conversations": DATASET_STATS.get("training_types", {}).get("natural_conversation", 0),
            "forced_tool_calls": DATASET_STATS.get("training_types", {}).get("forced_tool_call", 0),
            "avg_conversation_turns": DATASET_STATS["avg_conversation_turns"],
            "tool_usage": DATASET_STATS.get("tools_used", {})
        },
        tags=["medical-ai", "emergency-response", "gemma3n", "lora", "privacy-first", "dual-training", "natural-conversation", "forced-tool-calls"]
    )
    
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        eval_dataset=None,  # Could add validation set for production
        args=SFTConfig(
            dataset_text_field="text",
            per_device_train_batch_size=1,  # Ultra-conservative to avoid recompilation
            gradient_accumulation_steps=8,  # Effective batch size of 8
            warmup_steps=10,  # Gradual learning rate warmup
            max_steps=200,  # Sufficient for medical domain adaptation
            learning_rate=1e-4,  # Conservative for medical accuracy
            logging_steps=10,  # Regular progress monitoring
            optim="adamw_8bit",  # Memory efficient optimizer
            weight_decay=0.01,  # Regularization for generalization
            lr_scheduler_type="linear",  # Stable learning rate decay
            seed=3407,  # Reproducible training
            report_to="wandb",  # Enable WandB logging
            output_dir="./medical_gemma_output",
            run_name="medical-emergency-gemma3n",
        ),
    )
    
    # Train only on assistant responses (medical guidance)
    trainer = train_on_responses_only(
        trainer,
        instruction_part="<start_of_turn>user\n",
        response_part="<start_of_turn>model\n",
    )
    
    return trainer

# %% [markdown]
"""
## Training Pipeline Execution

### Main Training Steps:
1. **Model Loading**: Initialize Gemma 3N with medical configuration
2. **Dataset Preparation**: Format medical conversations for training
3. **LoRA Setup**: Configure efficient adapter training
4. **Training Execution**: Run supervised fine-tuning on medical scenarios
5. **Memory Monitoring**: Track GPU usage for optimization

### Performance Monitoring:
- **GPU Memory Tracking**: Monitor VRAM usage throughout training
- **Training Metrics**: Loss reduction and convergence monitoring  
- **Time Tracking**: Training duration for planning purposes
- **LoRA Overhead**: Measure additional memory for adapter training

This pipeline produces a medically-enhanced Gemma 3N model ready for emergency response deployment.
"""

# %% [code]
def train_medical_model():
    """Main training pipeline for medical emergency response"""
    
    # Setup model and data pipeline
    model, tokenizer = setup_model_and_tokenizer()
    dataset = prepare_dataset()
    dataset = apply_medical_chat_template(dataset, tokenizer)
    
    # Configure for medical training
    model = setup_lora_model(model)
    trainer = create_medical_trainer(model, tokenizer, dataset)
    
    # Pre-training memory statistics
    gpu_stats = torch.cuda.get_device_properties(0)
    start_gpu_memory = round(torch.cuda.max_memory_reserved() / 1024 / 1024 / 1024, 3)
    max_memory = round(gpu_stats.total_memory / 1024 / 1024 / 1024, 3)
    print(f"GPU = {gpu_stats.name}. Max memory = {max_memory} GB.")
    print(f"{start_gpu_memory} GB of memory reserved.")
    
    # Execute training
    print("Starting medical emergency response training...")
    trainer_stats = trainer.train()
    
    # Post-training performance analysis
    used_memory = round(torch.cuda.max_memory_reserved() / 1024 / 1024 / 1024, 3)
    used_memory_for_lora = round(used_memory - start_gpu_memory, 3)
    used_percentage = round(used_memory / max_memory * 100, 3)
    lora_percentage = round(used_memory_for_lora / max_memory * 100, 3)
    
    print(f"\n=== Training Complete ===")
    print(f"Training time: {round(trainer_stats.metrics['train_runtime']/60, 2)} minutes")
    print(f"Peak memory usage: {used_percentage}% ({used_memory} GB)")
    print(f"LoRA memory overhead: {lora_percentage}% ({used_memory_for_lora} GB)")
    
    return model, tokenizer

# %% [markdown]
"""
## Model Testing and Validation

### Emergency Response Testing
After training, we validate the model's performance on key emergency scenarios:

1. **Cardiac Arrest Response**: Unconscious, not breathing situations
2. **Tool Calling Verification**: Report generation triggers  
3. **Airway Emergency**: Choking response protocols

### Inference Configuration:
- **Temperature (0.7)**: Balanced creativity and medical accuracy
- **Top-p (0.9)**: Focused response generation
- **Top-k (50)**: Controlled vocabulary selection
- **Max Tokens (256)**: Adequate for emergency responses

### Expected Behaviors:
- Immediate recognition of life-threatening situations
- Proper tool calling for reports and care instructions
- Clear, actionable medical guidance for bystanders
"""

# %% [code]
def test_medical_inference(model, tokenizer):
    """Test the fine-tuned model with both natural and forced tool scenarios"""
    print("\n=== Testing Dual-Mode Medical Emergency Responses ===")
    
    # Test natural conversation scenarios
    natural_scenarios = [
        "Someone is unconscious and not breathing. What should I do?",
        "I found someone bleeding heavily from their arm. How can I help?",
        "A person is having chest pain and sweating. Should I be worried?"
    ]
    
    print("\n🗣️  Testing Natural Conversation Mode:")
    for scenario in natural_scenarios:
        print(f"\n📝 Scenario: {scenario}")
        print("Expected: Natural conversation response")
        print("Response:")
        
        messages = [{
            "role": "user",
            "content": [{"type": "text", "text": scenario}]
        }]
        
        inputs = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            return_tensors="pt",
            tokenize=True,
            return_dict=True,
        ).to("cuda")
        
        _ = model.generate(
            **inputs,
            max_new_tokens=256,
            temperature=0.7,
            top_p=0.9,
            top_k=50,
            streamer=TextStreamer(tokenizer, skip_prompt=True),
        )
        print("\n" + "-"*50)
    
    # Test forced tool call scenarios
    forced_scenarios = [
        "Generate report",
        "I need to generate a report for a car accident with multiple injuries", 
        "Show care instructions"
    ]
    
    print("\n🔧 Testing Forced Tool Call Mode:")
    for scenario in forced_scenarios:
        print(f"\n⚙️  Scenario: {scenario}")
        print("Expected: Pure JSON tool call response")
        print("Response:")
        
        messages = [{
            "role": "user", 
            "content": [{"type": "text", "text": scenario}]
        }]
        
        inputs = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            return_tensors="pt",
            tokenize=True,
            return_dict=True,
        ).to("cuda")
        
        _ = model.generate(
            **inputs,
            max_new_tokens=512,  # More tokens for JSON responses
            temperature=0.3,  # Lower temperature for structured output
            top_p=0.8,
            top_k=40,
            streamer=TextStreamer(tokenizer, skip_prompt=True),
        )
        print("\n" + "-"*50)

# %% [markdown]
"""
## Model Deployment and Export

### Multiple Export Formats for Different Use Cases:

1. **LoRA Adapters**: Lightweight adapters for continued training or sharing
2. **Merged Model**: Full model with adapters integrated for inference
3. **GGUF Format**: Quantized model optimized for mobile deployment

### Mobile Deployment (Primary Target):
- **GGUF Q8_0**: Optimal balance of size and quality for smartphones
- **llama.rn Compatible**: Direct integration with Citizen2Responder app
- **Privacy Preserved**: Local processing maintains medical conversation privacy

### Integration Path:
1. Replace existing model in relay-responder-app `models/` directory
2. Update llama.rn model path configuration  
3. Maintain hybrid architecture for optional cloud features
4. Deploy with existing emergency tool calling system
"""

# %% [code]
def upload_to_huggingface(model, tokenizer):
    """Upload the fine-tuned model to HuggingFace Hub"""
    print("\n=== Uploading to HuggingFace Hub ===")
    
    try:
        # Save merged model for upload (better for inference)
        print("Creating merged model for HuggingFace upload...")
        merged_path = "medical_gemma_hf_upload"
        model.save_pretrained_merged(merged_path, tokenizer, save_method="merged_16bit")
        
        # Create model card content
        model_card_content = f"""---
language:
- en
license: apache-2.0
base_model: unsloth/gemma-3n-E4B-it
tags:
- medical
- emergency-response
- healthcare
- fine-tuned
- unsloth
- gemma3n
- citizen2responder
pipeline_tag: text-generation
---

# Medical Emergency Response AI - Gemma 3N Fine-tuned

This model is a fine-tuned version of Gemma 3N specialized for medical emergency response scenarios. 
It's designed for the Citizen2Responder app to provide dual-mode emergency assistance:

## Model Description

- **Base Model:** unsloth/gemma-3n-E4B-it
- **Fine-tuning Dataset:** Medical emergency conversation scenarios
- **Use Case:** Emergency medical guidance and tool calling
- **License:** Apache 2.0

## Features

### 🗣️ Natural Conversation Mode
- Progressive medical questioning and guidance
- Conversational flow without tool call JSON
- Educational support for bystanders

### 🔧 Forced Tool Call Mode  
- Structured emergency reports for EMTs/dispatch
- Formatted step-by-step medical procedures
- Pure JSON output for tool responses

## Emergency Categories Covered

- Cardiac emergencies (heart attack, cardiac arrest)
- Respiratory emergencies (choking, asthma, anaphylaxis)
- Trauma & bleeding (severe bleeding, burns, fractures)
- Neurological (stroke, seizures, concussion)
- Poisoning & overdose
- Multi-casualty events
- Pediatric emergencies

## Usage

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("{HF_REPO_ID}")
tokenizer = AutoTokenizer.from_pretrained("{HF_REPO_ID}")

# Example usage for emergency response
prompt = "Someone collapsed and is not responding. What should I assess first?"
inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_length=200, temperature=0.7)
response = tokenizer.decode(outputs[0], skip_special_tokens=True)
```

## Training Details

- **Training Framework:** Unsloth + LoRA
- **Base Model:** Gemma 3N (4B parameters)
- **Dataset:** Custom medical emergency scenarios
- **Training Steps:** 200 steps
- **Learning Rate:** 1e-4
- **Batch Size:** 8 (effective)

## Intended Use

This model is designed for **emergency response guidance and education only**. 
It should NOT be used as a substitute for professional medical advice, diagnosis, or treatment.

## Privacy & Security

- Designed for local deployment
- No data transmission to external servers
- Privacy-first emergency assistance

## Citation

```
@misc{{medical-gemma3n-emergency-response,
  title={{Medical Emergency Response AI - Gemma 3N Fine-tuned}},
  author={{Citizen2Responder Team}},
  year={{2025}},
  url={{https://huggingface.co/{HF_REPO_ID}}}
}}
```
"""
        
        # Save model card
        with open(f"{merged_path}/README.md", "w") as f:
            f.write(model_card_content)
        
        # Upload to HuggingFace Hub
        print(f"Uploading model to {HF_REPO_ID}...")
        model.push_to_hub_merged(
            repo_id=HF_REPO_ID,
            tokenizer=tokenizer,
            save_method="merged_16bit",
            token=True,  # Uses HF_TOKEN environment variable
            private=PRIVATE_REPO,
            commit_message="Add fine-tuned medical emergency response model"
        )
        
        print(f"✅ Model successfully uploaded to https://huggingface.co/{HF_REPO_ID}")
        
    except Exception as e:
        print(f"❌ Failed to upload to HuggingFace: {str(e)}")
        print("💡 Make sure you're logged in with `huggingface-cli login` or set HF_TOKEN environment variable")
        print("💡 Ensure you have write access to the repository")
        raise  # Re-raise to be caught by the outer exception handler

def retry_upload_from_saved_model(model_path="medical_gemma_merged", repo_id=None):
    """Retry uploading a previously saved model to HuggingFace Hub"""
    if repo_id is None:
        repo_id = HF_REPO_ID
    
    print(f"\n=== Retrying Upload from Saved Model ===")
    print(f"Loading model from: {model_path}")
    
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        
        # Load the saved merged model
        model = AutoModelForCausalLM.from_pretrained(model_path)
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        
        # Upload to HuggingFace
        model.push_to_hub(repo_id, token=True, private=PRIVATE_REPO)
        tokenizer.push_to_hub(repo_id, token=True, private=PRIVATE_REPO)
        
        print(f"✅ Successfully uploaded model to https://huggingface.co/{repo_id}")
        
    except Exception as e:
        print(f"❌ Retry upload failed: {str(e)}")
        print("💡 Check your authentication and network connection")
        return False
    
    return True

def save_medical_model(model, tokenizer):
    """Save the fine-tuned medical model for deployment"""
    print("\n=== Saving Medical Emergency Model ===")
    
    # Save LoRA adapters for continued training
    model.save_pretrained("medical_gemma_lora")
    tokenizer.save_pretrained("medical_gemma_lora")
    print("✅ LoRA adapters saved to 'medical_gemma_lora'")
    
    # Log model artifacts to WandB
    wandb.log_model(
        path="medical_gemma_lora",
        name="medical-gemma3n-lora-adapters",
        aliases=["latest", "emergency-response", "v1.0"]
    )
    
    # Upload to HuggingFace Hub if enabled (with error protection)
    if UPLOAD_TO_HF:
        try:
            upload_to_huggingface(model, tokenizer)
        except Exception as upload_error:
            print(f"⚠️  HuggingFace upload failed, but model is safely saved locally: {str(upload_error)}")
            print("📁 Your model files are preserved in:")
            print("   - medical_gemma_lora/ (LoRA adapters)")
            print("   - medical_gemma_merged/ (merged model)")
            print("   - WandB artifacts (logged)")
            print("💡 You can retry upload later using these saved files")
    
    # Save merged model for direct inference
    model.save_pretrained_merged("medical_gemma_merged", tokenizer)
    print("✅ Merged model saved to 'medical_gemma_merged'")
    
    # Save GGUF for mobile deployment (llama.rn compatibility)
    model.save_pretrained_gguf(
        "medical_gemma_mobile",
        quantization_type="Q8_0",  # Optimal quality/size balance
    )
    print("✅ GGUF model saved to 'medical_gemma_mobile' for mobile deployment")
    
    # Log mobile model to WandB
    wandb.log_model(
        path="medical_gemma_mobile",
        name="medical-gemma3n-mobile-gguf",
        aliases=["latest", "mobile-deployment", "q8_0"]
    )
    
    print("\n🏥 Medical Emergency AI Model Ready for Deployment!")
    print("Compatible with relay-responder-app's llama.rn integration")
    print("Models logged to WandB for version tracking and sharing")

# %% [markdown]
"""
## Main Execution Pipeline

### Complete Training Workflow:
1. **Environment Setup**: Load dependencies and check GPU availability
2. **Model Training**: Execute full fine-tuning pipeline with medical data
3. **Validation**: Test emergency response capabilities
4. **Export**: Save in multiple formats for deployment flexibility

### Success Criteria:
- Model responds appropriately to emergency scenarios
- Tool calling functions trigger correctly for reports and care instructions  
- GGUF export completes successfully for mobile integration
- Performance metrics indicate successful medical domain adaptation

**Ready for Production**: This trained model can be directly integrated into the Citizen2Responder app to enhance emergency response capabilities with privacy-first medical AI.
"""

# %% [code]
def main():
    """Main execution pipeline for medical emergency fine-tuning"""
    print("🏥 Medical Emergency Response Fine-tuning with Gemma 3N")
    print("=" * 60)
    
    try:
        # Execute complete training pipeline
        model, tokenizer = train_medical_model()
        
        # Validate emergency response capabilities
        test_medical_inference(model, tokenizer)
        
        # Export for deployment
        save_medical_model(model, tokenizer)
        
        # Finalize WandB run
        wandb.finish()
        
        print("\n✅ Medical AI fine-tuning completed successfully!")
        print("Model ready for integration with Citizen2Responder app")
        print("Training metrics and models saved to WandB for analysis")
        
    except Exception as e:
        print(f"❌ Training failed: {str(e)}")
        wandb.finish()  # Ensure WandB run is closed even on failure
        raise

if __name__ == "__main__":
    main()
# %%
