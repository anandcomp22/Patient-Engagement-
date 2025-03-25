import pyaudio
import wave
import threading
import tkinter as tk
import torch
import librosa
import os
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
from textblob import TextBlob

# ✅ Load Hugging Face Wav2Vec2 model
model_name = "facebook/wav2vec2-large-960h"
processor = Wav2Vec2Processor.from_pretrained(model_name)
model = Wav2Vec2ForCTC.from_pretrained(model_name)

# ✅ Hardcoded Medical Terms (for Extraction)
medical_terms = {
    "fever", "cough", "nausea", "headache", "asthma", "diabetes",
    "hypertension", "infection", "pneumonia", "allergy"
}

# 🔴 Global flag to stop recording
stop_recording = False  

def record_audio(output_filename="live_audio.wav"):
    """Records audio until 'End Call' is clicked."""
    global stop_recording
    
    audio = pyaudio.PyAudio()
    stream = audio.open(format=pyaudio.paInt16, channels=1, rate=16000,
                        input=True, frames_per_buffer=1024)

    print("🎙️ Recording started... Click 'End Call' to stop.")

    frames = []
    while not stop_recording:
        data = stream.read(1024)
        frames.append(data)

    print("🛑 End Call button clicked. Stopping recording...")

    # Stop and save the audio
    stream.stop_stream()
    stream.close()
    audio.terminate()

    with wave.open(output_filename, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(audio.get_sample_size(pyaudio.paInt16))
        wf.setframerate(16000)
        wf.writeframes(b''.join(frames))

    print(f"✅ Audio saved as {output_filename}")

    # Transcribe and extract medical terms
    transcription = transcribe_audio(output_filename)
    print("📜 Transcription:", transcription)

    corrected_transcription = correct_spelling(transcription)
    print("🔠 Corrected:", corrected_transcription)

    extracted_terms = extract_medical_terms(corrected_transcription)
    print("🩺 Extracted Medical Terms:", extracted_terms)

def transcribe_audio(audio_file):
    """Transcribes recorded audio using Hugging Face Wav2Vec2."""
    try:
        print(f"📂 Loading audio file: {audio_file}")

        if not os.path.exists(audio_file):
            print("❌ Error: Audio file not found.")
            return ""

        waveform, sample_rate = librosa.load(audio_file, sr=16000)

        print("🔊 Audio file loaded successfully.")

        # Convert waveform to tensor format
        input_values = processor(waveform, return_tensors="pt", sampling_rate=16000).input_values

        # Perform inference (speech-to-text)
        with torch.no_grad():
            logits = model(input_values).logits

        # Convert model output to text
        predicted_ids = torch.argmax(logits, dim=-1)
        transcription = processor.batch_decode(predicted_ids)[0]

        return transcription.lower()

    except Exception as e:
        print("❌ Error in transcription:", str(e))
        return ""

def correct_spelling(text):
    """Optimized spelling correction using TextBlob (batch processing)."""
    try:
        return str(TextBlob(text).correct())  # Faster correction
    except Exception as e:
        print("⚠️ Error in spelling correction:", str(e))
        return text  # Return original text if correction fails

def extract_medical_terms(transcription):
    """Extracts medical terms from the corrected transcription."""
    words = transcription.split()
    return [word for word in words if word in medical_terms]

def stop_call():
    """Stops the recording when 'End Call' button is clicked."""
    global stop_recording
    stop_recording = True
    print("🛑 End Call button clicked. Stopping recording...")

# Create UI window
def create_ui():
    root = tk.Tk()
    root.title("Live Call Recording")

    end_button = tk.Button(root, text="End Call", command=stop_call, 
                           font=("Arial", 14), bg="red", fg="white", width=10)
    end_button.pack(pady=20)

    root.mainloop()

# Start UI in a separate thread
ui_thread = threading.Thread(target=create_ui, daemon=True)
ui_thread.start()

# Start recording in the main thread
record_audio()
