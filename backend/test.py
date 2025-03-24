import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import re

# Load the fine-tuned model and tokenizer


MODEL_PATH = r"C:\Users\HP\Patient-Engagement-\backend\merged_lora_model"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForCausalLM.from_pretrained(MODEL_PATH, torch_dtype=torch.float16, device_map="auto")


def generate_response(prompt, max_length=100):
   
    normalized_prompt = prompt.strip().title()
    
    inputs = tokenizer(f"Condition: {normalized_prompt}\nResponse:", return_tensors="pt").to(model.device)
    with torch.no_grad():
        output = model.generate(**inputs, max_length=max_length, pad_token_id=tokenizer.eos_token_id)
    return tokenizer.decode(output[0], skip_special_tokens=True).replace("\n", " ")


test_prompts = [
    "cold"  , "cancer"
]

for prompt in test_prompts:
    response = generate_response(prompt)
    
    
    med_id_match = re.search(r'\bID[:\s]*([0-9]+)\b', response, re.IGNORECASE)
    med_name_match = re.search(r'\bDrug Name[:\s]*([\w\s]+)\b', response, re.IGNORECASE)
    rating_match = re.search(r'\bRating[:\s]*([0-9]+)\b', response, re.IGNORECASE)
    
    med_id = med_id_match.group(1) if med_id_match else "Unknown ID"
    med_name = med_name_match.group(1).strip() if med_name_match else "Unknown Name"
    rating = rating_match.group(1) if rating_match else "Unknown Rating"
    
    filtered_response = f"{med_id}, {med_name}, {rating}".replace("Rating,", ",")
    print(f"\nPrompt: {prompt}\nResponse: {filtered_response}")
