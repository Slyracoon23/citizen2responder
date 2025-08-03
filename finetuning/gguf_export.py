#!/usr/bin/env python3
"""
GGUF Model Export for Mobile Deployment
Citizen2Responder: Medical Emergency AI

This module handles the conversion of fine-tuned models to GGUF format
for mobile deployment via llama.rn integration.
"""

import wandb
import sys
import argparse
from pathlib import Path
from typing import Dict


def export_gguf_model(
    model,
    tokenizer,
    output_dir: str = "medical_gemma_mobile",
    quantization_type: str = "q8_0",
    log_to_wandb: bool = True,
    wandb_model_name: str = "medical-gemma3n-mobile-gguf"
):
    """
    Export fine-tuned model to GGUF format for mobile deployment.
    
    Args:
        model: Fine-tuned Unsloth model
        tokenizer: Associated tokenizer
        output_dir: Directory to save GGUF model
        quantization_type: GGUF quantization level (q8_0, bf16, f16, f32)
        log_to_wandb: Whether to log model to WandB
        wandb_model_name: Name for WandB model artifact
    """
    print(f"\n=== Exporting GGUF Model for Mobile Deployment ===")
    print(f"Output directory: {output_dir}")
    print(f"Quantization: {quantization_type}")
    
    try:
        # Create output directory if it doesn't exist
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        # Export to GGUF format
        print("Converting model to GGUF format...")
        model.save_pretrained_gguf(
            output_dir,
            quantization_type=quantization_type,
        )
        
        # Also save tokenizer for completeness
        tokenizer.save_pretrained(output_dir)
        
        print(f"✅ GGUF model exported to '{output_dir}'")
        print(f"📱 Ready for llama.rn mobile deployment")
        
        # Log to WandB if requested
        if log_to_wandb:
            try:
                wandb.log_model(
                    path=output_dir,
                    name=wandb_model_name,
                    aliases=["latest", "mobile-deployment", quantization_type]
                )
                print(f"📊 Model logged to WandB as '{wandb_model_name}'")
            except Exception as wandb_error:
                print(f"⚠️  WandB logging failed: {wandb_error}")
                print("Model export completed successfully despite WandB issue")
        
        return output_dir
        
    except Exception as e:
        print(f"❌ GGUF export failed: {str(e)}")
        raise


def export_multiple_quantizations(
    model,
    tokenizer,
    base_output_dir: str = "medical_gemma_mobile",
    quantizations: list = None,
    log_to_wandb: bool = True
):
    """
    Export model in multiple GGUF quantization formats.
    
    Args:
        model: Fine-tuned Unsloth model
        tokenizer: Associated tokenizer
        base_output_dir: Base directory for exports
        quantizations: List of quantization types to export
        log_to_wandb: Whether to log models to WandB
    """
    if quantizations is None:
        quantizations = ["q8_0", "bf16", "f16"]
    
    print(f"\n=== Exporting Multiple GGUF Quantizations ===")
    print(f"Quantizations: {quantizations}")
    
    exported_models = {}
    
    for quant in quantizations:
        try:
            output_dir = f"{base_output_dir}_{quant}"
            wandb_name = f"medical-gemma3n-mobile-{quant}"
            
            result_dir = export_gguf_model(
                model=model,
                tokenizer=tokenizer,
                output_dir=output_dir,
                quantization_type=quant,
                log_to_wandb=log_to_wandb,
                wandb_model_name=wandb_name
            )
            
            exported_models[quant] = result_dir
            
        except Exception as e:
            print(f"❌ Failed to export {quant}: {str(e)}")
            exported_models[quant] = None
    
    # Summary
    successful_exports = {k: v for k, v in exported_models.items() if v is not None}
    print(f"\n📊 Export Summary:")
    print(f"✅ Successful: {len(successful_exports)}/{len(quantizations)}")
    for quant, path in successful_exports.items():
        print(f"   - {quant}: {path}")
    
    failed_exports = [k for k, v in exported_models.items() if v is None]
    if failed_exports:
        print(f"❌ Failed: {failed_exports}")
    
    return exported_models


def get_model_size_info(model_dir: str) -> Dict:
    """
    Get size information for exported GGUF model.
    
    Args:
        model_dir: Directory containing GGUF model
        
    Returns:
        Dict with size information
    """
    model_path = Path(model_dir)
    
    if not model_path.exists():
        return {"error": f"Model directory not found: {model_dir}"}
    
    # Find all GGUF files
    gguf_files = list(model_path.glob("*.gguf"))
    
    if not gguf_files:
        return {"error": f"No GGUF files found in {model_dir}"}
    
    size_info = {
        "model_directory": str(model_path),
        "gguf_files": [],
        "total_size_mb": 0
    }
    
    for gguf_file in gguf_files:
        file_size_mb = gguf_file.stat().st_size / (1024 * 1024)
        size_info["gguf_files"].append({
            "filename": gguf_file.name,
            "size_mb": round(file_size_mb, 2)
        })
        size_info["total_size_mb"] += file_size_mb
    
    size_info["total_size_mb"] = round(size_info["total_size_mb"], 2)
    
    return size_info


def convert_saved_model_to_gguf(
    model_path: str = "medical_gemma_merged",
    output_dir: str = "medical_gemma_mobile",
    quantization_type: str = "q8_0",
    log_to_wandb: bool = False
) -> bool:
    """
    Convert a saved model to GGUF format.
    
    Args:
        model_path: Path to saved merged model
        output_dir: Directory to save GGUF model
        quantization_type: GGUF quantization level
        log_to_wandb: Whether to log to WandB
        
    Returns:
        Boolean indicating success
    """
    print(f"\n=== Converting Saved Model to GGUF ===")
    print(f"Input model: {model_path}")
    print(f"Output directory: {output_dir}")
    print(f"Quantization: {quantization_type}")
    
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
        # Load the model using Unsloth
        from unsloth import FastModel
        
        print("Loading saved model...")
        model, tokenizer = FastModel.from_pretrained(
            model_name=str(model_path),
            dtype=None,
            max_seq_length=2048,
            load_in_4bit=False,  # Load full precision for better GGUF conversion
        )
        
        # Use the existing export_gguf_model function which works correctly
        result_dir = export_gguf_model(
            model=model,
            tokenizer=tokenizer,
            output_dir=output_dir,
            quantization_type=quantization_type,
            log_to_wandb=log_to_wandb,
            wandb_model_name=f"medical-gemma3n-mobile-{quantization_type}"
        )
        
        print(f"✅ Successfully converted model to GGUF: {result_dir}")
        return True
        
    except Exception as e:
        print(f"❌ Conversion failed: {str(e)}")
        print("💡 Make sure you have Unsloth installed and the model was saved properly")
        return False


def discover_models_for_conversion(base_dir: str = ".") -> Dict[str, Dict]:
    """
    Discover models available for GGUF conversion.
    
    Args:
        base_dir: Base directory to search for models
        
    Returns:
        Dictionary of available models
    """
    base_path = Path(base_dir)
    models = {}
    
    # Look for different model types
    model_patterns = {
        "merged": "medical_gemma_merged",
        "lora": "medical_gemma_lora",
        "checkpoint": "medical_gemma_output/checkpoint-200"
    }
    
    for model_type, pattern in model_patterns.items():
        model_path = base_path / pattern
        if model_path.exists():
            # Check if it has the required files for conversion
            has_config = (model_path / "config.json").exists()
            has_tokenizer = (model_path / "tokenizer.json").exists()
            
            # Calculate size
            total_size = 0
            safetensors_files = list(model_path.glob("*.safetensors"))
            for file in safetensors_files:
                total_size += file.stat().st_size
            
            models[model_type] = {
                "path": str(model_path),
                "has_config": has_config,
                "has_tokenizer": has_tokenizer,
                "convertible": has_config and has_tokenizer,
                "size_gb": round(total_size / (1024**3), 2),
                "safetensors_files": len(safetensors_files)
            }
    
    return models


def display_conversion_options(models: Dict[str, Dict]) -> None:
    """
    Display available models for GGUF conversion.
    
    Args:
        models: Dictionary of available models
    """
    if not models:
        print("❌ No models found for conversion")
        return
    
    print("\n🔄 Available Models for GGUF Conversion:")
    print("=" * 60)
    
    for i, (model_type, info) in enumerate(models.items(), 1):
        status = "✅ Ready" if info["convertible"] else "❌ Missing files"
        print(f"{i}. {model_type.upper()} - {status}")
        print(f"   Path: {info['path']}")
        print(f"   Size: {info['size_gb']:.1f} GB")
        print(f"   Files: {info['safetensors_files']} safetensors files")
        
        if not info["convertible"]:
            missing = []
            if not info["has_config"]: missing.append("config.json")
            if not info["has_tokenizer"]: missing.append("tokenizer.json")
            print(f"   Missing: {', '.join(missing)}")
        print()


def interactive_gguf_conversion() -> bool:
    """
    Interactive GGUF conversion process.
    
    Returns:
        Boolean indicating if conversion was performed
    """
    print("🔄 GGUF Model Conversion Tool")
    print("=" * 40)
    
    # Discover available models
    models = discover_models_for_conversion()
    
    if not models:
        print("❌ No models found. Please train a model first.")
        return False
    
    # Show convertible models
    convertible_models = {k: v for k, v in models.items() if v["convertible"]}
    
    if not convertible_models:
        print("❌ No convertible models found.")
        display_conversion_options(models)
        return False
    
    display_conversion_options(convertible_models)
    
    # Select model
    model_list = list(convertible_models.items())
    
    while True:
        try:
            choice = input(f"\nSelect model to convert (1-{len(model_list)}, or 'q' to quit): ").strip().lower()
            
            if choice in ['q', 'quit']:
                return False
            
            choice_idx = int(choice) - 1
            if 0 <= choice_idx < len(model_list):
                model_type, model_info = model_list[choice_idx]
                break
            else:
                print(f"❌ Invalid selection. Please choose 1-{len(model_list)}")
                
        except ValueError:
            print("❌ Invalid input. Please enter a number or 'q' to quit")
        except KeyboardInterrupt:
            print("\n👋 Conversion cancelled")
            return False
    
    # Select quantization
    quantizations = ["q8_0", "bf16", "f16", "f32"]
    print(f"\n📏 Available Quantizations:")
    for i, quant in enumerate(quantizations, 1):
        descriptions = {
            "q8_0": "8-bit quantized (~50% size reduction, good quality)",
            "bf16": "BFloat16 (~50% size reduction, high quality)", 
            "f16": "Float16 (~50% size reduction, high quality)",
            "f32": "Float32 (full precision, largest size)"
        }
        print(f"{i}. {quant} - {descriptions[quant]}")
    
    while True:
        try:
            quant_choice = input(f"Select quantization (1-{len(quantizations)}, or 'all'): ").strip().lower()
            
            if quant_choice == 'all':
                selected_quants = quantizations
                break
            else:
                quant_idx = int(quant_choice) - 1
                if 0 <= quant_idx < len(quantizations):
                    selected_quants = [quantizations[quant_idx]]
                    break
                else:
                    print(f"❌ Invalid selection. Please choose 1-{len(quantizations)} or 'all'")
                    
        except ValueError:
            print("❌ Invalid input. Please enter a number or 'all'")
        except KeyboardInterrupt:
            print("\n👋 Conversion cancelled")
            return False
    
    # Confirm conversion
    model_path = model_info["path"]
    print(f"\n🔄 Ready to convert:")
    print(f"   Model: {model_type} ({model_path})")
    print(f"   Quantizations: {', '.join(selected_quants)}")
    print(f"   Estimated time: 2-5 minutes per quantization")
    
    confirm = input("\nProceed with conversion? (y/N): ").strip().lower()
    if confirm not in ['y', 'yes']:
        print("👋 Conversion cancelled")
        return False
    
    # Perform conversion
    success_count = 0
    
    for quant in selected_quants:
        output_dir = f"medical_gemma_mobile_{quant}"
        
        print(f"\n🔄 Converting to {quant}...")
        success = convert_saved_model_to_gguf(
            model_path=model_path,
            output_dir=output_dir,
            quantization_type=quant,
            log_to_wandb=False
        )
        
        if success:
            success_count += 1
            # Show size info
            size_info = get_model_size_info(output_dir)
            if "error" not in size_info:
                print(f"   📊 Output size: {size_info['total_size_mb']:.1f} MB")
    
    print(f"\n📊 Conversion Summary:")
    print(f"✅ Successful: {success_count}/{len(selected_quants)} quantizations")
    
    if success_count > 0:
        print(f"\n🎉 GGUF models ready for mobile deployment!")
        print(f"📱 Compatible with llama.rn integration")
    
    return success_count > 0


def main():
    """
    Main execution function for GGUF conversion.
    """
    parser = argparse.ArgumentParser(
        description="Convert trained medical Gemma models to GGUF format",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  python gguf_export.py                           # Interactive mode
  python gguf_export.py --model medical_gemma_merged  # Convert specific model
  python gguf_export.py --quantization Q4_0       # Specific quantization
  python gguf_export.py --all-quantizations       # Export all quantizations
"""
    )
    
    parser.add_argument("--model", type=str, help="Path to model directory to convert")
    parser.add_argument("--output", type=str, help="Output directory for GGUF model")
    parser.add_argument("--quantization", type=str, choices=["q8_0", "bf16", "f16", "f32"], 
                       default="q8_0", help="Quantization type")
    parser.add_argument("--all-quantizations", action="store_true", 
                       help="Export all quantization types")
    parser.add_argument("--wandb", action="store_true", help="Log to WandB")
    
    args = parser.parse_args()
    
    if args.model:
        # Command line mode
        output_dir = args.output or f"medical_gemma_mobile_{args.quantization}"
        
        if args.all_quantizations:
            # Load model once and export all quantizations
            try:
                from unsloth import FastModel
                print(f"Loading model: {args.model}")
                model, tokenizer = FastModel.from_pretrained(
                    model_name=args.model,
                    dtype=None,
                    max_seq_length=2048,
                    load_in_4bit=False,
                )
                
                export_multiple_quantizations(
                    model=model,
                    tokenizer=tokenizer,
                    base_output_dir="medical_gemma_mobile",
                    log_to_wandb=args.wandb
                )
                
            except Exception as e:
                print(f"❌ Failed to load model: {e}")
                return 1
        else:
            # Single quantization
            success = convert_saved_model_to_gguf(
                model_path=args.model,
                output_dir=output_dir,
                quantization_type=args.quantization,
                log_to_wandb=args.wandb
            )
            
            if not success:
                return 1
    
    else:
        # Interactive mode
        success = interactive_gguf_conversion()
        if not success:
            return 1
    
    print("\n🎉 GGUF conversion completed successfully!")
    return 0


if __name__ == "__main__":
    sys.exit(main())