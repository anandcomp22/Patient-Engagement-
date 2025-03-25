import os
import pandas as pd

# 🔹 Folder containing medical audio recordings
audio_folder = r"C:\Users\HP\Desktop\LLM_models\archive\medical speech transcription and intent\Medical Speech, Transcription, and Intent\recordings\train"

# 🔹 CSV file to store file paths & transcripts
csv_filename = "medical_audio_dataset.csv"

# 🔹 Initialize Data List
data = []

# 🔹 Iterate through audio files
for file in os.listdir(audio_folder):
    if file.endswith(".wav"):  # Only process WAV files
        file_path = os.path.join(audio_folder, file)
        transcript = ""  # You will manually enter this
        data.append([file_path, transcript])

# 🔹 Create DataFrame & Save CSV
df = pd.DataFrame(data, columns=["wav_filename", "transcript"])
df.to_csv(csv_filename, index=False)

print(f"✅ CSV file created: {csv_filename}")
