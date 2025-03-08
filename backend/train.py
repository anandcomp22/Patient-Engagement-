import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, DataCollatorForSeq2Seq
from peft import LoraConfig, get_peft_model, PeftModel
from datasets import load_dataset
from trl import SFTTrainer

# Check for GPU availability
device = "cuda" if torch.cuda.is_available() else "cpu"

# Model path (fine-tuned model)
MODEL_NAME = r"C:\Users\HP\Patient-Engagement-\backend\lora_finetuned_model"

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

# Load base model
base_model = AutoModelForCausalLM.from_pretrained(
    "TinyLlama/TinyLlama-1.1B-Chat-v1.0", 
    torch_dtype=torch.float16, 
    device_map="auto"
)

# Load previously fine-tuned LoRA model
model = PeftModel.from_pretrained(base_model, MODEL_NAME)

# Load dataset
dataset = load_dataset("json", data_files="finetune_dataset.json", split="train")

# Function to tokenize data properly
def tokenize_function(example):
    inputs = f"Condition: {example['prompt']}\nResponse: {example['response']}"
    
    # Tokenize with padding and truncation
    tokenized = tokenizer(inputs, padding="longest", truncation=True, return_tensors="pt")

    # Ensure labels exist (copy input_ids)
    tokenized["labels"] = tokenized["input_ids"].clone()

    # Replace padding token (0) with -100 to ignore loss on them
    tokenized["labels"][tokenized["labels"] == tokenizer.pad_token_id] = -100

    return tokenized

# Tokenize dataset and remove old columns
dataset = dataset.map(tokenize_function, batched=True, remove_columns=dataset.column_names)

# LoRA configuration (same as before)
lora_config = LoraConfig(
    r=16, lora_alpha=32, lora_dropout=0.05, target_modules=["q_proj", "v_proj"], bias="none"
)
model = get_peft_model(model, lora_config)

# Training arguments (Fix: `remove_unused_columns=False`)
training_args = TrainingArguments(
    output_dir=MODEL_NAME,  
    per_device_train_batch_size=1,  
    gradient_accumulation_steps=8,
    num_train_epochs=3,
    save_steps=500,
    save_total_limit=2,
    logging_dir="./logs",
    logging_steps=10,
    fp16=True,  # Mixed-precision training
    remove_unused_columns=False,  # Prevents dropping labels
)

# Data collator to handle padding correctly
data_collator = DataCollatorForSeq2Seq(tokenizer, model=model, label_pad_token_id=-100)

# Initialize Trainer
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    tokenizer=tokenizer,  
    args=training_args,
    data_collator=data_collator,  
)

# Resume fine-tuning
trainer.train()

# Save the updated fine-tuned model
model.save_pretrained(MODEL_NAME)
tokenizer.save_pretrained(MODEL_NAME)

print("Fine-tuning complete! Model saved in", MODEL_NAME)
