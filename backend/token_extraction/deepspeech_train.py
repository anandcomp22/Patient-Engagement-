import torch
import librosa
import datasets
from datasets import Dataset
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC, TrainingArguments, Trainer
from jiwer import wer
import pandas as pd
import os

# ✅ Load CSV dataset
csv_path = r"C:\Users\HP\Patient-Engagement-\backend\token_extraction\overview-of-recordings.csv"  # Update this with the correct path

df = pd.read_csv(csv_path)
df = df.dropna(subset=["file_name", "phrase"])  # Ensure no missing values

audio_folder = "/mnt/data/audio/"  # Update this to where the audio files are stored

def get_audio_path(filename):
    return os.path.join(audio_folder, filename)

df["audio_path"] = df["file_name"].apply(get_audio_path)

# ✅ Convert CSV to Hugging Face Dataset
dataset = Dataset.from_pandas(df)

# ✅ Load Pretrained Wav2Vec2 Model
model_name = "facebook/wav2vec2-large-960h"
processor = Wav2Vec2Processor.from_pretrained(model_name)
model = Wav2Vec2ForCTC.from_pretrained(model_name)

# ✅ Preprocessing Function
def preprocess(batch):
    speech_array, sampling_rate = librosa.load(batch["audio_path"], sr=16000)
    batch["input_values"] = processor(speech_array, sampling_rate=16000, return_tensors="pt").input_values[0]
    batch["labels"] = processor.tokenizer(batch["phrase"]).input_ids
    return batch

# ✅ Apply Preprocessing
dataset = dataset.map(preprocess, remove_columns=["audio_path"])

# ✅ Training Arguments
training_args = TrainingArguments(
    output_dir="./wav2vec2_medical",
    per_device_train_batch_size=8,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    logging_dir="./logs",
    learning_rate=1e-4,
    num_train_epochs=5,
    weight_decay=0.01,
    fp16=True,
)

# ✅ Compute Word Error Rate (WER) for Evaluation
def compute_metrics(pred):
    pred_ids = pred.predictions.argmax(-1)
    pred_texts = processor.batch_decode(pred_ids)
    true_texts = processor.batch_decode(pred.label_ids)
    return {"wer": wer(true_texts, pred_texts)}

# ✅ Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    tokenizer=processor.feature_extractor,
    compute_metrics=compute_metrics,
)

# ✅ Train Model
trainer.train()

# ✅ Save the Trained Model
model.save_pretrained("./deepspeech_medical")
processor.save_pretrained("./deepspeech_medical")
