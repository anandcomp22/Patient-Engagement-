import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# Base model
MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
base_model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME, torch_dtype=torch.float16, device_map="auto"
)

# Paths to fine-tuned LoRA models
lora_paths = [
    r"C:\Users\HP\Patient-Engagement-\backend\lora_finetuned_model",
    r"C:\Users\HP\Patient-Engagement-\backend\second_lora_finetuned_model",
    r"C:\Users\HP\Patient-Engagement-\backend\third_lora_finetuned_model"
]

# Load all LoRA adapters onto the base model
lora_models = [PeftModel.from_pretrained(base_model, path) for path in lora_paths]

# Merge all LoRA adapters properly
for lora_model in lora_models:
    base_model = lora_model.merge_and_unload()  # Merge and remove LoRA layers

# Save the fully merged model
merged_model_path = "./merged_lora_model"
base_model.save_pretrained(merged_model_path)
tokenizer.save_pretrained(merged_model_path)

print(f"Merging complete! Model saved in {merged_model_path}")
