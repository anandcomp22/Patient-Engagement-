import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import re
import sys
import json
MODEL_PATH = r"C:\Users\morea\Desktop\merged_lora_model"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForCausalLM.from_pretrained(MODEL_PATH, torch_dtype=torch.float16, device_map="auto").eval()


torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.benchmark = True  
model = torch.compile(model, mode="max-autotune") 

def generate_response(prompt, max_new_tokens=30):
    normalized_prompt = prompt.strip().title()
    inputs = tokenizer(f"Condition: {normalized_prompt}\nResponse:", return_tensors="pt", padding=True).to(model.device)
    
    with torch.inference_mode():  
        output = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens, 
            do_sample=False, 
            num_beams=1,  
            use_cache=True, 
            top_k=50  
        )
    return tokenizer.decode(output[0], skip_special_tokens=True).replace("\n", " ")

# Read condition passed as command-line argument
if len(sys.argv) < 2:
    print(json.dumps({ "error": "No condition provided" }))
    sys.exit()

condition = sys.argv[1].strip()
response = generate_response(condition)

med_id_match = re.search(r'\bID[:\s]*([0-9]+)\b', response, re.IGNORECASE)
med_name_match = re.search(r'\bDrug Name[:\s]*([\w\s]+)\b', response, re.IGNORECASE)
rating_match = re.search(r'\bRating[:\s]*([0-9]+)\b', response, re.IGNORECASE)

med_id = med_id_match.group(1) if med_id_match else "Unknown ID"
med_name = med_name_match.group(1).strip() if med_name_match else "Unknown Name"
rating = rating_match.group(1) if rating_match else "Unknown Rating"

output = {
    "id": med_id,
    "name": med_name,
    "condition": condition,
    "rating": rating
}

print(json.dumps(output))
sys.stdout.flush()
