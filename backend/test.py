import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# Define model path
MODEL_PATH = r"C:\Users\HP\Patient-Engagement-\backend\lora_finetuned_model"

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

# Load base model
base_model = AutoModelForCausalLM.from_pretrained("TinyLlama/TinyLlama-1.1B-Chat-v1.0", torch_dtype=torch.float16)

# Load fine-tuned LoRA model
model = PeftModel.from_pretrained(base_model, MODEL_PATH)
model.to("cuda" if torch.cuda.is_available() else "cpu")

model.eval()  # Set model to evaluation mode

def generate_response(prompt, max_length=50):
    input_ids = tokenizer(prompt, return_tensors="pt").input_ids.to(model.device)

    with torch.no_grad():
        output = model.generate(input_ids, max_length=max_length, pad_token_id=tokenizer.eos_token_id)

    response = tokenizer.decode(output[0], skip_special_tokens=True)

    # Extract ID, Medicine Name, and Rating
    med_id, med_name, rating = "", "", ""
    response_lines = response.split("\n")

    for line in response_lines:
        if "ID:" in line:
            med_id = line.split(":")[-1].strip()  # Extract ID
        elif "Drug Name:" in line:
            med_name = line.split(":")[-1].strip()  # Extract Medicine Name
        elif "Rating:" in line:
            rating = line.split(":")[-1].strip()  # Extract Rating
    
    # Ensure correct format
    if med_id and med_name and rating:
        return f"{med_id} {med_name} {rating}"
    
    return response  # Return full response if extraction fails




# Example test prompt
test_prompt = "Condition:  adhd"
response = generate_response(test_prompt)
print("Output:", response)
