# AidME – Machine Learning & AI Setup Guide

This document outlines the setup, configuration, and execution mechanism for all the Artificial Intelligence and Machine Learning modules integrated into the AidME platform.

The system relies on various ML pipelines including a Retrieval-Augmented Generation (RAG) engine, speech-to-text models (Whisper), large language models (LLaMA via Ollama), and computer vision models (YOLO).

---

## 🏗 ML Architecture Overview

The system consists of four primary AI/ML components located in the `backend/` directory:

1. **RAG Pipeline (`backend/RAG_Pipeline`)**: Flask-based API running ChromaDB, Sentence Transformers, and Ollama for extracting consultation summaries and generating AI prescriptions. Also houses a WebSocket Transcription Server using `WhisperX`.
2. **LLaMA Server (`backend/llama_server`)**: A standalone integration script for analyzing audio and detecting conditions using `faster_whisper` and Ollama.
3. **Disease Detection Models (`backend/Kataract-Object-Detection` & `backend/Pneumonia-Detection`)**: Pre-trained YOLOv8 weights for cataract and pneumonia detection.
4. **Model Fine-tuning (`backend/Traning_Model`)**: Scripts for fine-tuning open-source LLMs (e.g., TinyLlama) using LoRA (Low-Rank Adaptation) and PyTorch.

---

## ⚙️ Prerequisites & Installation

### 1. Python Environment Setup
We recommend using **Python 3.10+**. Set up a virtual environment before installing dependencies:

```bash
cd backend
python -m venv venv
# Activate on Windows:
venv\Scripts\activate
# Activate on macOS/Linux:
source venv/bin/activate
```

### 2. Install Python Dependencies
The primary dependencies for the web ML services are specified in `backend/requirements.txt`.

```bash
pip install -r requirements.txt
```

> **Note on PyTorch (for WhisperX/YOLO):**
> If you have a dedicated NVIDIA GPU, make sure to install PyTorch with CUDA support to accelerate transcription and inference.
> ```bash
> pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
> ```

### 3. Install and Configure Ollama (Local LLM)
The RAG pipeline utilizes local large language models to ensure privacy.
1. Download and install **[Ollama](https://ollama.com/)**.
2. Pull the required models (e.g., `llama3.2`):
   ```bash
   ollama run llama3.2
   ```
3. Ensure the Ollama service is running on `http://localhost:11434`.

---

## 🚀 Running the Services

### 1. The RAG Pipeline (Summarization & Prescriptions)
This service handles consultation summaries, medical condition detection, and on-the-fly prescription generation via RAG.

**Setup `.env` in `backend/RAG_Pipeline/.env`:**
```ini
HUGGINGFACE_API_KEY=your_huggingface_key
CHROMA_DB_DIR=C:/path/to/chroma_db
MONGO_URI=mongodb://localhost:27017/
OLLAMA_HOST=http://localhost:11434
```

**Run the API Server:**
```bash
cd backend/RAG_Pipeline
python rag_api.py
```
*➡️ Runs on `http://0.0.0.0:5000`*

### 2. Transcription Server (Speech-to-Text)
To enable live transcription during consultations, run the WebSocket transcription server which leverages the WhisperX library.

**Run the WebSocket Server:**
```bash
cd backend/RAG_Pipeline
python transcription_server.py
```
*➡️ Runs WebSocket server on Port `8000`*

### 3. Standalone Transcription & LLaMA Engine
For running the standalone medical condition detection integration that utilizes `faster_whisper` and compares with local JSON datasets (`medications.json`):

```bash
cd backend/llama_server
pip install -r requirements.txt
python llama_server.py
```

### 4. Computer Vision (YOLOv8 Models)
The YOLO models (`yolov8s.pt`, `yolo26n.pt`) located in `backend/Kataract-Object-Detection` and `Pneumonia-Detection` are used for disease classification. 
Ensure you have the `ultralytics` package installed:
```bash
pip install ultralytics
```
*(These weights can be loaded dynamically in an inference script using `from ultralytics import YOLO` and `model = YOLO("yolov8s.pt")`)*

---

## 🏋️‍♂️ Fine-tuning Models
If you want to train and fine-tune models (e.g., TinyLlama) on your own medical datasets:

```bash
cd backend/Traning_Model
pip install transformers trl peft datasets
python train.py
```
This script will produce a LoRA adapter merged model in the `./third_lora_finetuned_model` directory based on your `finetune_dataset.json`.

---

## 🩺 Troubleshooting
- **Ollama API errors:** Ensure the Ollama daemon is running in the background and you have pulled the designated model (`ollama run llama3.2`).
- **CUDA/PyTorch limits:** If you face Out-Of-Memory (OOM) errors, limit batch size or run PyTorch on the CPU (though much slower).
- **Whisper Download Issues:** Whisper models will be downloaded automatically on the first run. Ensure you have a stable internet connection.
