import sys
import deepspeech
import numpy as np
import json

# Load medicine recommendations
with open("medicines.json") as f:
    med_data = json.load(f)

# Load DeepSpeech model
model = deepspeech.Model('deepspeech-0.9.3-models.pbmm')
model.enableExternalScorer('deepspeech-0.9.3-models.scorer')
stream = model.createStream()

def detect_condition(text):
    conditions = {
        "fever": "Fever",
        "cold": "Cold",
        "headache": "Headache",
        "diabetes": "Diabetes",
        "migraine": "Migraine"
    }
    for keyword, condition in conditions.items():
        if keyword in text.lower():
            return condition
    return "Unknown"

while True:
    audio = sys.stdin.buffer.read(4096)
    if not audio:
        continue
    data16 = np.frombuffer(audio, dtype=np.int16)
    stream.feedAudioContent(data16)

    partial_text = stream.intermediateDecode()
    if partial_text.strip():
        condition = detect_condition(partial_text)
        meds = med_data.get(condition, ["Consult a specialist."])
        output = {
            "text": partial_text,
            "condition": condition,
            "recommendations": meds
        }
        print(json.dumps(output), flush=True)
