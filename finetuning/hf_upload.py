#!/usr/bin/env python3
"""
HuggingFace Hub Upload Module
Citizen2Responder: Medical Emergency AI

This module handles uploading fine-tuned models to HuggingFace Hub
with proper model cards and repository management.
"""

import os
import sys
import argparse
from pathlib import Path
from typing import Optional, List, Dict, Tuple
from transformers import AutoModelForCausalLM, AutoTokenizer


# Default configuration
DEFAULT_HF_REPO_ID = "Slyracoon23/medical-gemma3n-emergency-response"
DEFAULT_PRIVATE_REPO = False


def create_model_card(repo_id: str) -> str:
    """
    Generate model card content for HuggingFace repository.
    
    Args:
        repo_id: HuggingFace repository ID
        
    Returns:
        Model card content as string
    """
    return f"""---
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

model = AutoModelForCausalLM.from_pretrained("{repo_id}")
tokenizer = AutoTokenizer.from_pretrained("{repo_id}")

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
  url={{https://huggingface.co/{repo_id}}}
}}
```
"""


def upload_to_huggingface(
    model,
    tokenizer,
    repo_id: str = DEFAULT_HF_REPO_ID,
    private: bool = DEFAULT_PRIVATE_REPO,
    save_method: str = "merged_16bit",
    temp_dir: str = "medical_gemma_hf_upload"
):
    """
    Upload fine-tuned model to HuggingFace Hub.
    
    Args:
        model: Fine-tuned Unsloth model
        tokenizer: Associated tokenizer
        repo_id: HuggingFace repository ID
        private: Whether to create private repository
        save_method: Model saving method (merged_16bit, merged_4bit, etc.)
        temp_dir: Temporary directory for model preparation
    """
    print(f"\n=== Uploading to HuggingFace Hub ===")
    print(f"Repository: {repo_id}")
    print(f"Private: {private}")
    print(f"Save method: {save_method}")
    
    try:
        # Create merged model for upload
        print("Preparing merged model for HuggingFace upload...")
        temp_path = Path(temp_dir)
        temp_path.mkdir(exist_ok=True)
        
        model.save_pretrained_merged(temp_dir, tokenizer, save_method=save_method)
        
        # Create and save model card
        model_card_content = create_model_card(repo_id)
        model_card_path = temp_path / "README.md"
        
        with open(model_card_path, "w", encoding="utf-8") as f:
            f.write(model_card_content)
        
        print(f"Model card created: {model_card_path}")
        
        # Upload to HuggingFace Hub
        print(f"Uploading model to {repo_id}...")
        model.push_to_hub_merged(
            repo_id=repo_id,
            tokenizer=tokenizer,
            save_method=save_method,
            token=True,  # Uses HF_TOKEN environment variable
            private=private,
            commit_message="Add fine-tuned medical emergency response model"
        )
        
        print(f"✅ Model successfully uploaded to https://huggingface.co/{repo_id}")
        
        # Clean up temporary directory
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
        print(f"🧹 Cleaned up temporary directory: {temp_dir}")
        
        return f"https://huggingface.co/{repo_id}"
        
    except Exception as e:
        print(f"❌ Failed to upload to HuggingFace: {str(e)}")
        print("💡 Troubleshooting tips:")
        print("   - Ensure you're logged in: `huggingface-cli login`")
        print("   - Or set HF_TOKEN environment variable")
        print("   - Check repository name and permissions")
        print("   - Verify internet connection")
        raise


def retry_upload_from_saved_model(
    model_path: str = "medical_gemma_merged",
    repo_id: str = DEFAULT_HF_REPO_ID,
    private: bool = DEFAULT_PRIVATE_REPO
):
    """
    Retry uploading a previously saved model to HuggingFace Hub.
    
    Args:
        model_path: Path to saved merged model
        repo_id: HuggingFace repository ID
        private: Whether repository should be private
        
    Returns:
        Boolean indicating success
    """
    print(f"\n=== Retrying Upload from Saved Model ===")
    print(f"Model path: {model_path}")
    print(f"Repository: {repo_id}")
    
    model_path = Path(model_path)
    
    if not model_path.exists():
        print(f"❌ Model path not found: {model_path}")
        return False
    
    try:
        # Load the saved merged model
        print("Loading saved model...")
        model = AutoModelForCausalLM.from_pretrained(str(model_path))
        tokenizer = AutoTokenizer.from_pretrained(str(model_path))
        
        # Create model card if it doesn't exist
        readme_path = model_path / "README.md"
        if not readme_path.exists():
            print("Creating model card...")
            model_card_content = create_model_card(repo_id)
            with open(readme_path, "w", encoding="utf-8") as f:
                f.write(model_card_content)
        
        # Upload to HuggingFace
        print(f"Uploading to {repo_id}...")
        model.push_to_hub(repo_id, token=True, private=private)
        tokenizer.push_to_hub(repo_id, token=True, private=private)
        
        print(f"✅ Successfully uploaded model to https://huggingface.co/{repo_id}")
        return True
        
    except Exception as e:
        print(f"❌ Retry upload failed: {str(e)}")
        print("💡 Check your authentication and network connection")
        return False


def upload_lora_adapters(
    lora_path: str = "medical_gemma_lora",
    repo_id: Optional[str] = None,
    private: bool = DEFAULT_PRIVATE_REPO
):
    """
    Upload LoRA adapters to HuggingFace Hub.
    
    Args:
        lora_path: Path to LoRA adapter files
        repo_id: HuggingFace repository ID (will append -lora if not specified)
        private: Whether repository should be private
        
    Returns:
        Repository URL if successful
    """
    if repo_id is None:
        repo_id = f"{DEFAULT_HF_REPO_ID}-lora"
    
    print(f"\n=== Uploading LoRA Adapters ===")
    print(f"LoRA path: {lora_path}")
    print(f"Repository: {repo_id}")
    
    lora_path = Path(lora_path)
    
    if not lora_path.exists():
        print(f"❌ LoRA path not found: {lora_path}")
        return None
    
    try:
        # Load LoRA adapters
        print("Loading LoRA adapters...")
        from transformers import AutoModelForCausalLM, AutoTokenizer
        
        # Note: This loads the base model with LoRA adapters
        model = AutoModelForCausalLM.from_pretrained(str(lora_path))
        tokenizer = AutoTokenizer.from_pretrained(str(lora_path))
        
        # Create specialized model card for LoRA
        lora_model_card = f"""---
language:
- en
license: apache-2.0
base_model: unsloth/gemma-3n-E4B-it
tags:
- medical
- emergency-response
- lora
- adapters
- fine-tuned
- gemma3n
- citizen2responder
---

# Medical Emergency Response - LoRA Adapters

These are LoRA (Low-Rank Adaptation) adapters for the Medical Emergency Response AI model.
Use these adapters with the base Gemma 3N model for efficient fine-tuning or inference.

## Base Model
- unsloth/gemma-3n-E4B-it

## Usage

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# Load base model
base_model = AutoModelForCausalLM.from_pretrained("unsloth/gemma-3n-E4B-it")
tokenizer = AutoTokenizer.from_pretrained("unsloth/gemma-3n-E4B-it")

# Load LoRA adapters
model = PeftModel.from_pretrained(base_model, "{repo_id}")
```

## Full Model
For a merged model ready for inference, see: {DEFAULT_HF_REPO_ID}
"""
        
        # Save model card
        readme_path = lora_path / "README.md"
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(lora_model_card)
        
        # Upload adapters
        model.push_to_hub(repo_id, token=True, private=private)
        tokenizer.push_to_hub(repo_id, token=True, private=private)
        
        print(f"✅ LoRA adapters uploaded to https://huggingface.co/{repo_id}")
        return f"https://huggingface.co/{repo_id}"
        
    except Exception as e:
        print(f"❌ LoRA upload failed: {str(e)}")
        return None


def check_hf_auth() -> bool:
    """
    Check if HuggingFace authentication is properly configured.
    
    Returns:
        Boolean indicating if authentication is available
    """
    try:
        from huggingface_hub import HfApi
        
        # Check for token in environment variable
        hf_token = os.getenv("HF_TOKEN")
        if hf_token:
            print("✅ HF_TOKEN environment variable found")
            return True
        
        # Try to get user info (requires authentication)
        api = HfApi()
        user_info = api.whoami()
        print(f"✅ Authenticated as: {user_info.get('name', 'Unknown')}")
        return True
        
    except Exception as e:
        print(f"❌ HuggingFace authentication not configured: {str(e)}")
        print("💡 Please run: huggingface-cli login")
        print("💡 Or set HF_TOKEN environment variable")
        return False


def discover_available_models(base_dir: str = ".") -> Dict[str, Dict]:
    """
    Discover available trained models in the finetuning directory.
    
    Args:
        base_dir: Base directory to search for models
        
    Returns:
        Dictionary of available models with their information
    """
    base_path = Path(base_dir)
    models = {}
    
    # Check for different model types
    model_patterns = {
        "merged": "medical_gemma_merged",
        "lora": "medical_gemma_lora", 
        "hf_prepared": "medical_gemma_hf_upload",
        "checkpoint": "medical_gemma_output/checkpoint-200"
    }
    
    for model_type, pattern in model_patterns.items():
        model_path = base_path / pattern
        if model_path.exists():
            # Get basic info about the model
            info = {
                "path": str(model_path),
                "type": model_type,
                "exists": True,
                "files": [],
                "size_mb": 0
            }
            
            # List important files
            important_files = [
                "config.json", "tokenizer.json", "README.md",
                "adapter_config.json", "adapter_model.safetensors"
            ]
            
            for file_name in important_files:
                file_path = model_path / file_name
                if file_path.exists():
                    file_size = file_path.stat().st_size / (1024 * 1024)  # MB
                    info["files"].append({
                        "name": file_name,
                        "size_mb": round(file_size, 2)
                    })
                    info["size_mb"] += file_size
            
            # Check for model files (safetensors)
            model_files = list(model_path.glob("*.safetensors"))
            for model_file in model_files:
                file_size = model_file.stat().st_size / (1024 * 1024)  # MB
                info["files"].append({
                    "name": model_file.name,
                    "size_mb": round(file_size, 2)
                })
                info["size_mb"] += file_size
            
            info["size_mb"] = round(info["size_mb"], 2)
            models[model_type] = info
    
    return models


def upload_existing_merged_model(
    model_path: str = "medical_gemma_merged",
    repo_id: str = DEFAULT_HF_REPO_ID,
    private: bool = DEFAULT_PRIVATE_REPO
) -> bool:
    """
    Upload an existing merged model to HuggingFace Hub.
    
    Args:
        model_path: Path to the merged model directory
        repo_id: HuggingFace repository ID
        private: Whether repository should be private
        
    Returns:
        Boolean indicating success
    """
    print(f"\n=== Uploading Existing Merged Model ===")
    print(f"Model path: {model_path}")
    print(f"Repository: {repo_id}")
    
    model_path = Path(model_path)
    
    if not model_path.exists():
        print(f"❌ Model path not found: {model_path}")
        return False
    
    # Check for required files
    required_files = ["config.json", "tokenizer.json"]
    missing_files = []
    
    for req_file in required_files:
        if not (model_path / req_file).exists():
            missing_files.append(req_file)
    
    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        return False
    
    try:
        # Load the merged model
        print("Loading merged model...")
        model = AutoModelForCausalLM.from_pretrained(str(model_path))
        tokenizer = AutoTokenizer.from_pretrained(str(model_path))
        
        # Create model card if it doesn't exist
        readme_path = model_path / "README.md"
        if not readme_path.exists():
            print("Creating model card...")
            model_card_content = create_model_card(repo_id)
            with open(readme_path, "w", encoding="utf-8") as f:
                f.write(model_card_content)
        
        # Upload to HuggingFace
        print(f"Uploading merged model to {repo_id}...")
        model.push_to_hub(repo_id, token=True, private=private)
        tokenizer.push_to_hub(repo_id, token=True, private=private)
        
        print(f"✅ Successfully uploaded merged model to https://huggingface.co/{repo_id}")
        return True
        
    except Exception as e:
        print(f"❌ Upload failed: {str(e)}")
        return False


def upload_existing_lora_adapters(
    lora_path: str = "medical_gemma_lora",
    repo_id: Optional[str] = None,
    private: bool = DEFAULT_PRIVATE_REPO
) -> bool:
    """
    Upload existing LoRA adapters to HuggingFace Hub.
    
    Args:
        lora_path: Path to LoRA adapter files
        repo_id: HuggingFace repository ID (will append -lora if not specified)
        private: Whether repository should be private
        
    Returns:
        Boolean indicating success
    """
    if repo_id is None:
        repo_id = f"{DEFAULT_HF_REPO_ID}-lora"
    
    print(f"\n=== Uploading Existing LoRA Adapters ===")
    print(f"LoRA path: {lora_path}")
    print(f"Repository: {repo_id}")
    
    lora_path = Path(lora_path)
    
    if not lora_path.exists():
        print(f"❌ LoRA path not found: {lora_path}")
        return False
    
    # Check for adapter files
    adapter_config = lora_path / "adapter_config.json"
    adapter_model = lora_path / "adapter_model.safetensors"
    
    if not adapter_config.exists() or not adapter_model.exists():
        print(f"❌ Missing LoRA adapter files")
        print(f"   - adapter_config.json: {'✅' if adapter_config.exists() else '❌'}")
        print(f"   - adapter_model.safetensors: {'✅' if adapter_model.exists() else '❌'}")
        return False
    
    try:
        # Use the upload_lora_adapters function we already have
        result = upload_lora_adapters(str(lora_path), repo_id, private)
        return result is not None
        
    except Exception as e:
        print(f"❌ LoRA upload failed: {str(e)}")
        return False


def display_available_models(models: Dict[str, Dict]) -> None:
    """
    Display available models in a formatted table.
    
    Args:
        models: Dictionary of available models
    """
    if not models:
        print("❌ No trained models found in current directory")
        return
    
    print("\n📊 Available Models:")
    print("=" * 80)
    
    for i, (model_type, info) in enumerate(models.items(), 1):
        status = "✅ Ready" if info["exists"] else "❌ Missing"
        print(f"{i}. {model_type.upper()} - {status}")
        print(f"   Path: {info['path']}")
        print(f"   Size: {info['size_mb']:.1f} MB")
        print(f"   Files: {len(info['files'])} files")
        
        # Show key files
        key_files = [f for f in info['files'] if f['name'] in ['config.json', 'adapter_config.json', 'README.md']]
        if key_files:
            print(f"   Key files: {', '.join(f['name'] for f in key_files)}")
        print()


def interactive_model_selection(models: Dict[str, Dict]) -> Optional[Tuple[str, Dict]]:
    """
    Interactive model selection for upload.
    
    Args:
        models: Dictionary of available models
        
    Returns:
        Tuple of (model_type, model_info) or None if cancelled
    """
    if not models:
        return None
    
    display_available_models(models)
    
    model_list = list(models.items())
    
    while True:
        try:
            choice = input(f"\nSelect model to upload (1-{len(model_list)}, or 'q' to quit): ").strip().lower()
            
            if choice == 'q' or choice == 'quit':
                return None
            
            choice_idx = int(choice) - 1
            if 0 <= choice_idx < len(model_list):
                return model_list[choice_idx]
            else:
                print(f"❌ Invalid selection. Please choose 1-{len(model_list)}")
                
        except ValueError:
            print("❌ Invalid input. Please enter a number or 'q' to quit")
        except KeyboardInterrupt:
            print("\n👋 Upload cancelled")
            return None


def main():
    """
    Main execution function for interactive model upload.
    """
    parser = argparse.ArgumentParser(
        description="Upload trained medical Gemma models to HuggingFace Hub",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  python hf_upload.py                    # Interactive mode
  python hf_upload.py --merged          # Upload merged model
  python hf_upload.py --lora            # Upload LoRA adapters
  python hf_upload.py --repo custom-repo # Custom repository name
"""
    )
    
    parser.add_argument("--merged", action="store_true", help="Upload merged model")
    parser.add_argument("--lora", action="store_true", help="Upload LoRA adapters")
    parser.add_argument("--repo", type=str, help="Custom HuggingFace repository ID")
    parser.add_argument("--private", action="store_true", help="Create private repository")
    parser.add_argument("--path", type=str, default=".", help="Base path to search for models")
    
    args = parser.parse_args()
    
    print("🤗 HuggingFace Model Upload Tool")
    print("=" * 40)
    
    # Check authentication first
    print("\n🔐 Checking HuggingFace authentication...")
    if not check_hf_auth():
        print("❌ Authentication failed. Please run: huggingface-cli login")
        return 1
    
    # Discover available models
    print(f"\n🔍 Scanning for models in: {args.path}")
    models = discover_available_models(args.path)
    
    if not models:
        print("❌ No trained models found. Please run training first.")
        return 1
    
    # Determine repository settings
    repo_id = args.repo or DEFAULT_HF_REPO_ID
    private = args.private or DEFAULT_PRIVATE_REPO
    
    print(f"\n📤 Upload settings:")
    print(f"   Repository: {repo_id}")
    print(f"   Private: {private}")
    
    success = False
    
    # Handle command line arguments
    if args.merged:
        if "merged" in models:
            success = upload_existing_merged_model(
                models["merged"]["path"], repo_id, private
            )
        else:
            print("❌ Merged model not found")
    
    elif args.lora:
        if "lora" in models:
            lora_repo = f"{repo_id}-lora" if args.repo else None
            success = upload_existing_lora_adapters(
                models["lora"]["path"], lora_repo, private
            )
        else:
            print("❌ LoRA adapters not found")
    
    else:
        # Interactive mode
        print("\n🎯 Interactive Model Upload")
        selected = interactive_model_selection(models)
        
        if selected is None:
            print("👋 Upload cancelled")
            return 0
        
        model_type, model_info = selected
        
        # Confirm upload
        confirm = input(f"\n📤 Upload {model_type} model to {repo_id}? (y/N): ").strip().lower()
        if confirm not in ['y', 'yes']:
            print("👋 Upload cancelled")
            return 0
        
        # Upload based on model type
        if model_type == "merged":
            success = upload_existing_merged_model(model_info["path"], repo_id, private)
        elif model_type == "lora":
            lora_repo = f"{repo_id}-lora"
            success = upload_existing_lora_adapters(model_info["path"], lora_repo, private)
        elif model_type == "hf_prepared":
            success = retry_upload_from_saved_model(model_info["path"], repo_id, private)
        else:
            print(f"❌ Upload not supported for model type: {model_type}")
    
    if success:
        print("\n🎉 Upload completed successfully!")
        return 0
    else:
        print("\n❌ Upload failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())