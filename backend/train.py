import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from peft import LoraConfig, get_peft_model
from datasets import load_dataset
from trl import SFTTrainer

# Check for GPU availability
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load model and tokenizer
MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME, 
    torch_dtype=torch.float16,  # Use float16 for GPU
    device_map="auto"  # Automatically assign to GPU if available
)

# Load dataset
dataset = load_dataset("json", data_files="1000_rows.json", split="train")

# Format dataset
def format_dataset(example):
    return {"text": f"Condition: {example['prompt']}\nResponse: {example['response']}"}

dataset = dataset.map(format_dataset)

# LoRA configuration
lora_config = LoraConfig(
    r=16, lora_alpha=32, lora_dropout=0.05, target_modules=["q_proj", "v_proj"], bias="none"
)
model = get_peft_model(model, lora_config)

# Training arguments
training_args = TrainingArguments(
    output_dir="./results",
    per_device_train_batch_size=2,  # Increase if GPU memory allows
    gradient_accumulation_steps=4,
    num_train_epochs=3,
    save_steps=500,
    save_total_limit=2,
    logging_dir="./logs",
    logging_steps=10,
    label_names=["labels"],
    fp16=True,  # Enable mixed-precision training for GPU speedup
)

# Fix SFTTrainer parameter
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    processing_class=tokenizer,
    args=training_args,
)

# Start training
trainer.train()

# Save fine-tuned model
model.save_pretrained("./lora_finetuned_model")
tokenizer.save_pretrained("./lora_finetuned_model")

print("Training complete! Model saved in ./lora_finetuned_model")