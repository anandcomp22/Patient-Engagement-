import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import requests
import json
import sys
import torch
import re
import difflib
from faster_whisper import WhisperModel

# Set up device
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[System] Using device: {device}")

# Load Whisper model
whisper_model = WhisperModel("base", device=device, compute_type="int8")

# Load medications dataset
try:
    with open('medications.json', 'r') as f:
        med_dataset = json.load(f)
except FileNotFoundError:
    print("Error: medications.json file not found.")
    sys.exit(1)

# Normalize dataset
if isinstance(med_dataset, list):
    med_dataset = {
        item['condition']: {
            'medications': item.get('medications', []),
            'additional_advice': item.get('additional_advice', [])
        }
        for item in med_dataset if 'condition' in item
    }

condition_list = list(med_dataset.keys())

# Transcribe audio
def transcribe_audio(path):
    segments, _ = whisper_model.transcribe(path)
    text = " ".join(segment.text for segment in segments)
    return text

# Query Ollama LLaMA 3.2
def query_ollama_prompt(prompt, model="llama3.2"):
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": model, "prompt": prompt, "stream": False}
        )
        response.raise_for_status()
        return response.json()["response"]
    except requests.exceptions.RequestException as e:
        print(f"[Error] Ollama API request failed: {e}")
        return ""

# Detect condition name
def detect_condition(user_text):
    prompt = f"""
You are a medical assistant. Extract only the name of the medical condition from the patient's description below.

Patient description: "{user_text}"
"""
    return query_ollama_prompt(prompt).strip().strip('"')

# Lookup in local dataset
def lookup_medications(condition_name, threshold=0.6):
    matches = difflib.get_close_matches(condition_name, condition_list, n=1, cutoff=threshold)
    if matches:
        entry = med_dataset[matches[0]]
        return entry['medications'], entry.get('additional_advice', [])
    return None, None

# Use LLaMA to prescribe if dataset fails
def prescribe_with_llama(user_text):
    prompt = f"""
You are a helpful medical assistant. Based on the symptoms below, generate a clean JSON object with only:

- A common condition name.
- Simple over-the-counter medications (like ibuprofen, paracetamol, cetirizine, etc).
- Two short, general advice tips.

Format:

{{
  "condition": "Condition name",
  "medications": [
    {{
      "name": "Medicine Name",
      "purpose": "Purpose"
    }}
  ],
  "additional_advice": [
    "Advice 1",
    "Advice 2"
  ]
}}

Only respond with the JSON. Do not include explanation, comments, or code blocks.

Patient symptoms: "{user_text}"
"""
    return query_ollama_prompt(prompt)

# Clean and parse raw LLaMA JSON
def clean_and_parse_json(raw_response):
    try:
        return json.loads(raw_response)
    except json.JSONDecodeError:
        match = re.search(r'\{[\s\S]*?\}', raw_response)
        if match:
            json_str = match.group(0)
            json_str = re.sub(r',\s*([}\]])', r'\1', json_str)
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass
    return None

# Main runner
if __name__ == "__main__":
    audio_path = "./audio_files/audio.mpeg"

    print("[1] Transcribing audio...")
    user_desc = transcribe_audio(audio_path)
    print(f"[Transcription] {user_desc}\n")

    print("[2] Detecting condition via LLaMA 3.2...")
    condition = detect_condition(user_desc)
    print(f"[Detected Condition] {condition}\n")

    print("[3] Looking up dataset for similar conditions...")
    meds, advice = lookup_medications(condition)
    if meds:
        print("[✓] Found match in dataset.")
        result = {
            "condition": condition,
            "medications": meds,
            "additional_advice": advice
        }
        print(json.dumps(result, indent=2))
    else:
        print("[✗] Not found in dataset. Asking LLaMA 3.2 to prescribe...")
        raw = prescribe_with_llama(user_desc)
        parsed = clean_and_parse_json(raw)
        if parsed:
            print(json.dumps(parsed, indent=2))
        else:
            print("[Error] LLaMA response JSON is invalid:")
            print(raw)
