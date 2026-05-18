import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO
import gradio as gr
import os

model_path = "C:\\Users\\morea\\Downloads\\Patient-Engagement-\\ML_model_runner\\cataract_runs\\detect\\aidme_model5\\weights\\best.pt"

if not os.path.exists(model_path):
    raise FileNotFoundError("Train model first!")

model = YOLO(model_path)

def predict_images(filepaths):
    output_images = []
    results_text = []

    for filepath in filepaths:
        image = Image.open(filepath)
        img_np = np.array(image)
        img_np_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

        results = model(img_np_bgr)

        result_text = "No Detection"

        for r in results[0].boxes:
            conf = float(r.conf.cpu().numpy())
            label = int(r.cls.cpu().numpy())
            name = model.names[label]

            # 🔥 CUSTOM LOGIC
            if conf < 0.5:
                result_text = f"Cataract ({(1-conf)*100:.2f}%)"
            else:
                result_text = f"{name} ({conf*100:.2f}%)"

        output_images.append(image)
        results_text.append(f"{os.path.basename(filepath)} → {result_text}")

    return output_images, "\n".join(results_text)

with gr.Blocks() as demo:
    gr.Markdown("## 👁 AidME Cataract Detection")

    input_files = gr.File(file_count="multiple", type="filepath")

    btn = gr.Button("Detect")

    output_gallery = gr.Gallery(columns=1, height="700px")

    output_text = gr.Textbox(lines=5)

    btn.click(predict_images, inputs=input_files, outputs=[output_gallery, output_text])

demo.launch()