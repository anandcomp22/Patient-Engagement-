import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from peft import LoraConfig, get_peft_model
from datasets import load_dataset
from trl import SFTTrainer

# Load model and tokenizer
MODEL_NAME =  "TinyLlama/TinyLlama-1.1B-Chat-v1.0" 
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(
    "TinyLlama/TinyLlama-1.1B-Chat-v1.0", torch_dtype=torch.float16, device_map="auto"
)
# Force CPU usage

# Load dataset
dataset = load_dataset("json", data_files="training_data.json", split="train")

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
    per_device_train_batch_size=1,
    gradient_accumulation_steps=4,
    num_train_epochs=3,
    save_steps=500,
    save_total_limit=2,
    logging_dir="./logs",
    logging_steps=10,
)

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    processing_class=tokenizer,
    args=training_args,
   
)

trainer.train()

# Save the fine-tuned model
model.save_pretrained("./lora_finetuned_model")
tokenizer.save_pretrained("./lora_finetuned_model")

print("Training complete! Model saved in ./lora_finetuned_model")
