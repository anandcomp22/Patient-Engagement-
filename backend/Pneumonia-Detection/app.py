import os
import numpy as np
from PIL import Image
from ultralytics import YOLO
import gradio as gr

# -----------------------------
# 1. LOAD TRAINED MODEL
# -----------------------------
model_path = r"C:\Users\morea\Downloads\Patient-Engagement-\ML_model_runner\Pneumonia_runs\classify\pneumonia_model\weights\best.pt"

if not os.path.exists(model_path):
    raise FileNotFoundError("Model not found! Train the model first.")

model = YOLO(model_path)

# -----------------------------
# 2. PREDICTION FUNCTION
# -----------------------------
def predict_images(filepaths):
    output_images = []
    results_text = []

    for filepath in filepaths:
        # Load image
        image = Image.open(filepath)

        # Run classification
        results = model(filepath)

        probs = results[0].probs
        class_id = int(probs.top1)
        confidence = float(probs.top1conf)
        label = model.names[class_id]

        # Final result text
        result_text = f"{label} ({confidence * 100:.2f}%)"

        output_images.append(image)
        results_text.append(f"{os.path.basename(filepath)} → {result_text}")

    return output_images, "\n".join(results_text)

# -----------------------------
# 3. GRADIO UI
# -----------------------------
with gr.Blocks() as demo:
    gr.Markdown("## 🫁 Pneumonia Detection from Chest X-Ray")

    gr.Markdown("Upload chest X-ray images and the model will predict Pneumonia or Normal.")

    input_files = gr.File(file_count="multiple", type="filepath")

    btn = gr.Button("Detect")

    output_gallery = gr.Gallery(label="Results", columns=2, height="400px")

    output_text = gr.Textbox(label="Predictions", lines=5)

    btn.click(
        fn=predict_images,
        inputs=input_files,
        outputs=[output_gallery, output_text]
    )

# -----------------------------
# 4. RUN APP
# -----------------------------
if __name__ == "__main__":
    demo.launch()