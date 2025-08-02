# %% [markdown]
"""
# Medical Emergency Response Fine-tuning with Gemma 3N
## Citizen2Responder: Privacy-First Emergency AI

This notebook fine-tunes Gemma 3N for medical emergency response scenarios, including:
- **Emergency Assessment**: Structured medical questioning for bystanders
- **Tool Calling**: Report generation and care instruction triggers  
- **Professional Integration**: EMT-ready documentation and handoff
- **Privacy Protection**: Local processing for sensitive medical conversations

Based on Unsloth's Gemma 3N framework, optimized for mobile deployment via llama.rn integration.

**Target Use Case**: Transform untrained bystanders into effective first responders with AI-guided assessment and care.
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
from datasets import Dataset
from unsloth import FastModel
from unsloth.chat_templates import get_chat_template, standardize_data_formats, train_on_responses_only
from trl import SFTTrainer, SFTConfig
from transformers import TextStreamer

# %% [markdown]
"""
## Medical Emergency Dataset

This embedded dataset contains 12 realistic emergency scenarios designed to train Gemma 3N for:

1. **Assessment Scenarios**: Guide bystanders through structured medical evaluation
2. **Tool Calling Examples**: Demonstrate when to trigger `generate_report` and `show_precare_instructions`
3. **Emergency Priorities**: Teach triage and life-threatening vs. non-critical situations
4. **Professional Communication**: Prepare structured handoffs to EMT/EMS services

**Dataset Categories**:
- Cardiac emergencies (heart attack, cardiac arrest)
- Trauma response (bleeding, fractures, head injuries)
- Airway management (choking, breathing difficulties)
- Multi-casualty triage protocols
- Shock recognition and treatment

Each conversation follows the Gemma 3N chat format with realistic user questions and expert-level medical responses.
"""

# %% [code]
MEDICAL_DATASET = [
    {
        "conversations": [
            {
                "role": "user", 
                "content": [{"type": "text", "text": "Someone collapsed and is not responding. What should I assess first?"}]
            },
            {
                "role": "assistant", 
                "content": [{"type": "text", "text": "First, ensure scene safety. Then check responsiveness by tapping shoulders and shouting 'Are you okay?' Check for normal breathing by looking at the chest for 10 seconds. If no response and no normal breathing, begin CPR immediately. Call 911 if not already done. I'll help you generate a report for emergency services."}]
            }
        ]
    },
    {
        "conversations": [
            {
                "role": "user", 
                "content": [{"type": "text", "text": "I need to call 911 about a car accident with injuries. Can you help me prepare what to say?"}]
            },
            {
                "role": "assistant", 
                "content": [{"type": "text", "text": "I'll help you generate a structured emergency report. Tell me: 1) Your exact location or nearest intersection, 2) Number of vehicles involved, 3) Number of people injured, 4) Are any victims unconscious or not breathing, 5) Any visible serious injuries like bleeding or broken bones? Based on your answers, I'll create a comprehensive report for 911 dispatch."}]
            }
        ]
    },
    {
        "conversations": [
            {
                "role": "user", 
                "content": [{"type": "text", "text": "There's a person with severe bleeding from their arm. What care should I provide?"}]
            },
            {
                "role": "assistant", 
                "content": [{"type": "text", "text": "For severe arm bleeding: 1) Apply direct pressure with clean cloth or bandage, 2) Elevate the arm above heart level if possible, 3) Do NOT remove embedded objects, 4) If bleeding soaks through, add more layers without removing the first, 5) Apply pressure to pressure points if bleeding continues. I can show you detailed precare instructions to guide you through this step-by-step."}]
            }
        ]
    },
    {
        "conversations": [
            {
                "role": "user", 
                "content": [{"type": "text", "text": "Multiple people injured in workplace accident. How do I prioritize who to help first?"}]
            },
            {
                "role": "assistant", 
                "content": [{"type": "text", "text": "Use START triage protocol: 1) First help those who can walk (minor injuries), 2) Check breathing - if not breathing and airway is clear, position for rescue breathing, 3) Check circulation - control severe bleeding first, 4) Assess mental status - unconscious patients need immediate attention. Priority: Not breathing > Severe bleeding > Unconscious > Walking wounded. I'll help you generate individual reports for each patient to streamline EMT handoff."}]
            }
        ]
    },
    {
        "conversations": [
            {
                "role": "user", 
                "content": [{"type": "text", "text": "Person is choking and can't cough or speak. What do I do?"}]
            },
            {
                "role": "assistant", 
                "content": [{"type": "text", "text": "This is a severe airway obstruction - act immediately! For conscious adult: 1) Stand behind them, 2) Place hands below ribcage, thumb side against stomach, 3) Give 5 quick upward thrusts, 4) Check mouth for object, 5) Repeat until object clears or person becomes unconscious. If they become unconscious, begin CPR. I can provide detailed precare instructions to guide you through the exact hand positioning and technique."}]
            }
        ]
    },
    {
        "conversations": [
            {
                "role": "user", 
                "content": [{"type": "text", "text": "Elderly person fell and can't move their leg. Hip looks deformed. What should I assess?"}]
            },
            {
                "role": "assistant", 
                "content": [{"type": "text", "text": "Suspected hip fracture - do NOT move the patient. Assess: 1) Consciousness level and vital signs, 2) Pain level (1-10 scale), 3) Circulation below injury (check pulse at ankle, skin color), 4) Any other injuries from the fall, 5) Medical history if patient can communicate. Keep them warm and comfortable, stabilize the leg with pillows. This requires immediate transport - I'll help generate a priority emergency report for EMS."}]
            }
        ]
    },
    {
        "conversations": [
            {
                "role": "user", 
                "content": [{"type": "text", "text": "Person having chest pain, sweating, nausea. They think it's heartburn."}]
            },
            {
                "role": "assistant", 
                "content": [{"type": "text", "text": "These are classic heart attack symptoms - treat as cardiac emergency! 1) Call 911 immediately, 2) Have them sit or lie down comfortably, 3) Loosen tight clothing, 4) Ask if they take heart medication (nitroglycerin), 5) Give aspirin if no allergies and they can swallow, 6) Monitor breathing and pulse, 7) Be ready for CPR if they become unconscious. Do NOT let them drive themselves. I'll generate an emergency cardiac report for dispatch."}]
            }
        ]
    },
    {
        "conversations": [
            {
                "role": "user", 
                "content": [{"type": "text", "text": "Generate a report for EMS about a motorcycle accident with head injury"}]
            },
            {
                "role": "assistant", 
                "content": [{"type": "text", "text": "I need more details to generate a comprehensive EMS report. Please provide: 1) Exact location and time of accident, 2) Patient's consciousness level (awake, responsive to voice, unresponsive), 3) Any observed head trauma (bleeding, deformity, fluid from ears/nose), 4) Vital signs if obtainable (breathing rate, pulse), 5) Mechanism of injury (speed, helmet use, what they hit), 6) Other injuries noted, 7) Your contact information. Once I have these details, I'll create a structured report for emergency services.\n\n{\"tool_calls\": [{\"name\": \"generate_report\", \"parameters\": {\"incident_type\": \"motorcycle_accident_head_injury\", \"priority\": \"high\"}}]}"}]
            }
        ]
    },
    {
        "conversations": [
            {
                "role": "user", 
                "content": [{"type": "text", "text": "Show me how to control bleeding on someone's leg"}]
            },
            {
                "role": "assistant", 
                "content": [{"type": "text", "text": "I'll provide step-by-step bleeding control instructions for a leg wound:\n\n{\"tool_calls\": [{\"name\": \"show_precare_instructions\", \"parameters\": {\"care_type\": \"bleeding_control_leg\", \"priority\": \"high\", \"steps\": [\"Ensure scene safety and use universal precautions (gloves if available)\", \"Apply direct pressure with clean cloth or bandage directly on wound\", \"Elevate leg above heart level if no fracture suspected\", \"If bleeding soaks through, add more layers without removing first bandage\", \"Apply pressure to femoral artery pressure point if bleeding continues\", \"Secure bandage with tape or wrap, check circulation below wound\", \"Monitor patient for signs of shock (pale, rapid pulse, weakness)\", \"Document time bleeding was controlled for EMS report\"]}}]}"}]
            }
        ]
    },
    {
        "conversations": [
            {
                "role": "user", 
                "content": [{"type": "text", "text": "Need care instructions for someone having a seizure"}]
            },
            {
                "role": "assistant", 
                "content": [{"type": "text", "text": "I'll provide seizure care instructions to keep the person safe:\n\n{\"tool_calls\": [{\"name\": \"show_precare_instructions\", \"parameters\": {\"care_type\": \"seizure_management\", \"priority\": \"medium\", \"steps\": [\"Do NOT restrain the person or put anything in their mouth\", \"Clear area of hard or sharp objects to prevent injury\", \"Place something soft under their head if possible\", \"Turn person on their side to keep airway clear if they vomit\", \"Time the seizure - note start and end times\", \"Stay with person and speak calmly when seizure ends\", \"Call 911 if: seizure lasts over 5 minutes, person doesn't wake up, multiple seizures occur, or person is injured\", \"After seizure, keep person comfortable and monitor breathing\"]}}]}"}]
            }
        ]
    },
    {
        "conversations": [
            {
                "role": "user", 
                "content": [{"type": "text", "text": "What's the difference between a heart attack and cardiac arrest?"}]
            },
            {
                "role": "assistant", 
                "content": [{"type": "text", "text": "Important distinction for emergency response:\n\n**Heart Attack (Myocardial Infarction):**\n- Heart muscle not getting oxygen due to blocked artery\n- Person usually conscious and breathing\n- Symptoms: chest pain, sweating, nausea, shortness of breath\n- Treatment: Call 911, aspirin if no allergies, position of comfort\n\n**Cardiac Arrest:**\n- Heart stops beating effectively\n- Person unconscious, not breathing normally\n- No pulse, may appear dead\n- Treatment: Immediate CPR and AED, call 911\n\nHeart attack can lead to cardiac arrest. Both are true emergencies requiring immediate EMS response."}]
            }
        ]
    },
    {
        "conversations": [
            {
                "role": "user", 
                "content": [{"type": "text", "text": "How do I check if someone is in shock?"}]
            },
            {
                "role": "assistant", 
                "content": [{"type": "text", "text": "Signs of shock to assess:\n\n**Physical Signs:**\n- Rapid, weak pulse (over 100 bpm)\n- Rapid, shallow breathing\n- Pale, cool, clammy skin\n- Weakness or fatigue\n- Dizziness or confusion\n- Decreased alertness\n\n**Assessment Steps:**\n1. Check skin color and temperature\n2. Feel pulse at wrist - note rate and strength\n3. Observe breathing pattern\n4. Ask simple questions to check mental status\n5. Look for anxiety or restlessness\n\n**Treatment:**\n- Elevate legs 8-12 inches (unless spinal injury suspected)\n- Keep warm with blanket\n- Monitor closely\n- Call 911 - shock can be life-threatening"}]
            }
        ]
    }
]

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
        name="citizen2responder-emergency-ai",
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
            "use_case": "citizen2responder_app"
        },
        tags=["medical-ai", "emergency-response", "gemma3n", "lora", "privacy-first"]
    )
    
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        eval_dataset=None,  # Could add validation set for production
        args=SFTConfig(
            dataset_text_field="text",
            per_device_train_batch_size=2,  # Conservative for GPU memory
            gradient_accumulation_steps=4,  # Effective batch size of 8
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
    """Test the fine-tuned model with medical scenarios"""
    print("\n=== Testing Medical Emergency Responses ===")
    
    test_scenarios = [
        "Someone is unconscious and not breathing. What should I do?",
        "I need to generate a report for a car accident with multiple injuries",
        "Show me how to help someone who is choking"
    ]
    
    for scenario in test_scenarios:
        print(f"\n🚨 Scenario: {scenario}")
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
            temperature=0.7,  # Balanced for medical accuracy
            top_p=0.9,  # Focused response generation
            top_k=50,  # Controlled vocabulary
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