import sys
import json
import torch
import numpy as np
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

# Load the Hugging Face Wav2Vec2 model
processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")
model.eval()

buffer = bytearray()

try:
    while True:
        chunk = sys.stdin.buffer.read(4096)
        if not chunk:
            break
        buffer.extend(chunk)

        if len(buffer) > 32000:  # Enough audio (~1 sec at 16kHz)
            audio = np.frombuffer(buffer, dtype=np.int16).astype(np.float32) / 32768.0
            input_values = processor(audio, return_tensors="pt", sampling_rate=16000).input_values

            with torch.no_grad():
                logits = model(input_values).logits
                ids = torch.argmax(logits, dim=-1)
                text = processor.decode(ids[0]).lower()

            # Basic disease detection logic
            condition = ""
            recommendations = []

            if "fever" in text:
                condition = "Viral Fever"
                recommendations.append("Paracetamol")
            if "cough" in text or "cold" in text:
                condition = "Cold & Cough"
                recommendations.append("Cough Syrup")
            if "pain" in text:
                condition = "Body Pain"
                recommendations.append("Ibuprofen")

            print(json.dumps({
                "text": text,
                "condition": condition,
                "recommendations": recommendations
            }), flush=True)

            buffer.clear()

except Exception as e:
    print(json.dumps({"error": str(e)}), flush=True)
