#!/usr/bin/env python3
"""
Script to clean the medical dataset by removing tool call JSON from assistant responses.
This creates natural conversation training data without tool calls.
"""

import json
import re
from pathlib import Path

def clean_assistant_response(text):
    """Remove tool call JSON from assistant response text."""
    # Remove everything from the first occurrence of {"tool_calls": onwards
    tool_call_pattern = r'\n\n\{"tool_calls".*$'
    cleaned_text = re.sub(tool_call_pattern, '', text, flags=re.DOTALL)
    
    # Also handle cases where tool call might start without double newlines
    tool_call_pattern2 = r'\{"tool_calls".*$'
    cleaned_text = re.sub(tool_call_pattern2, '', cleaned_text, flags=re.DOTALL)
    
    return cleaned_text.strip()

def clean_dataset():
    """Clean the medical dataset by removing tool calls from assistant responses."""
    
    # Load the original dataset
    input_file = Path("datasets/medical_emergency_dataset.json")
    output_file = Path("datasets/medical_emergency_dataset_cleaned.json")
    
    print(f"Loading dataset from {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Update dataset info
    data["dataset_info"]["description"] = "Natural conversation medical emergency dataset without tool calls - for conversational training"
    data["dataset_info"]["version"] = "1.1-cleaned"
    data["dataset_info"]["note"] = "Assistant responses have tool call JSON removed, keeping only natural conversation text"
    
    scenarios_processed = 0
    responses_cleaned = 0
    
    # Process each scenario
    for scenario in data["scenarios"]:
        scenarios_processed += 1
        
        # Process each conversation turn
        for message in scenario["conversation"]:
            if message["role"] == "assistant":
                original_text = message["content"][0]["text"]
                cleaned_text = clean_assistant_response(original_text)
                
                if cleaned_text != original_text:
                    message["content"][0]["text"] = cleaned_text
                    responses_cleaned += 1
                    print(f"Cleaned response in scenario {scenario['id']}")
    
    # Write cleaned dataset
    print(f"\nWriting cleaned dataset to {output_file}...")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Dataset cleaning complete!")
    print(f"   Scenarios processed: {scenarios_processed}")
    print(f"   Assistant responses cleaned: {responses_cleaned}")
    print(f"   Output saved to: {output_file}")

if __name__ == "__main__":
    clean_dataset()