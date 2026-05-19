"""
AidME Disease Detection API
Flask server that serves Cataract (YOLOv8 Object Detection) and Pneumonia (YOLOv8 Classification) models.
"""

import os
import io
import json
import base64
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np

app = Flask(__name__)
CORS(app)

# ── Model Paths ──────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CATARACT_MODEL_PATH = os.path.join(BASE_DIR, "cataract_runs", "detect", "aidme_model5", "weights", "best.pt")
PNEUMONIA_MODEL_PATH = os.path.join(BASE_DIR, "Pneumonia_runs", "classify", "pneumonia_model", "weights", "best.pt")

# ── Lazy-loaded models (load once on first request) ──────────────────────────
_cataract_model = None
_pneumonia_model = None


def get_cataract_model():
    global _cataract_model
    if _cataract_model is None:
        from ultralytics import YOLO
        print(f"[ML] Loading Cataract model from: {CATARACT_MODEL_PATH}")
        _cataract_model = YOLO(CATARACT_MODEL_PATH)
        print("[ML] Cataract model loaded successfully!")
    return _cataract_model


def get_pneumonia_model():
    global _pneumonia_model
    if _pneumonia_model is None:
        from ultralytics import YOLO
        print(f"[ML] Loading Pneumonia model from: {PNEUMONIA_MODEL_PATH}")
        _pneumonia_model = YOLO(PNEUMONIA_MODEL_PATH)
        print("[ML] Pneumonia model loaded successfully!")
    return _pneumonia_model


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "models": {
            "cataract": os.path.exists(CATARACT_MODEL_PATH),
            "pneumonia": os.path.exists(PNEUMONIA_MODEL_PATH)
        }
    })


@app.route("/predict/cataract", methods=["POST"])
def predict_cataract():
    """
    Cataract Detection (Object Detection).
    Accepts an image file upload and returns bounding box detections.
    """
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files["image"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Save to temp file for YOLO processing
        img = Image.open(file.stream).convert("RGB")
        
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            img.save(tmp, format="JPEG")
            tmp_path = tmp.name

        try:
            model = get_cataract_model()
            results = model(tmp_path, conf=0.25)
            
            detections = []
            annotated_img = None

            for r in results:
                # Get annotated image
                annotated = r.plot()  # Returns numpy array with bounding boxes drawn
                annotated_pil = Image.fromarray(annotated[..., ::-1])  # BGR to RGB
                
                buf = io.BytesIO()
                annotated_pil.save(buf, format="JPEG", quality=90)
                annotated_img = base64.b64encode(buf.getvalue()).decode("utf-8")

                for box in r.boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0]) * 100
                    label = model.names[cls]
                    bbox = box.xyxy[0].tolist()
                    detections.append({
                        "label": label,
                        "confidence": round(conf, 2),
                        "bbox": [round(b, 1) for b in bbox]
                    })

            return jsonify({
                "success": True,
                "model": "cataract",
                "detections": detections,
                "annotated_image": annotated_img,
                "summary": _generate_cataract_summary(detections)
            })
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        print(f"[ERROR] Cataract prediction failed: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/predict/pneumonia", methods=["POST"])
def predict_pneumonia():
    """
    Pneumonia Detection (Classification).
    Accepts an X-ray image and returns classification probabilities.
    """
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files["image"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Save to temp file for YOLO processing
        img = Image.open(file.stream).convert("RGB")
        
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            img.save(tmp, format="JPEG")
            tmp_path = tmp.name

        try:
            model = get_pneumonia_model()
            results = model(tmp_path)

            classifications = []
            for r in results:
                probs = r.probs
                if probs is not None:
                    top5_indices = probs.top5
                    top5_confs = probs.top5conf.tolist()

                    for idx, conf in zip(top5_indices, top5_confs):
                        classifications.append({
                            "label": model.names[idx],
                            "confidence": round(conf * 100, 2)
                        })

            # Determine primary prediction
            primary = classifications[0] if classifications else {"label": "Unknown", "confidence": 0}

            return jsonify({
                "success": True,
                "model": "pneumonia",
                "primary_prediction": primary,
                "all_predictions": classifications,
                "summary": _generate_pneumonia_summary(primary)
            })
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        print(f"[ERROR] Pneumonia prediction failed: {e}")
        return jsonify({"error": str(e)}), 500


def _generate_cataract_summary(detections):
    """Generate a human-readable summary for cataract results."""
    if not detections:
        return {
            "status": "clear",
            "title": "No Cataract Detected",
            "message": "The AI model did not detect signs of cataract in the uploaded image. However, please consult with an ophthalmologist for a definitive diagnosis.",
            "severity": "low"
        }
    
    max_conf = max(d["confidence"] for d in detections)
    labels = list(set(d["label"] for d in detections))
    
    if max_conf >= 80:
        severity = "high"
        title = "Cataract Indicators Detected"
        message = f"The AI model detected {len(detections)} region(s) with high confidence ({max_conf:.1f}%). Detected conditions: {', '.join(labels)}. We strongly recommend consulting an ophthalmologist immediately."
    elif max_conf >= 50:
        severity = "medium"
        title = "Possible Cataract Indicators"
        message = f"The AI model found {len(detections)} potential region(s) of concern ({max_conf:.1f}% confidence). Detected: {', '.join(labels)}. A professional eye examination is recommended."
    else:
        severity = "low"
        title = "Mild Indicators Found"
        message = f"The AI model found some mild indicators ({max_conf:.1f}% confidence). Detected: {', '.join(labels)}. Consider scheduling a routine eye check-up."
    
    return {"status": "detected", "title": title, "message": message, "severity": severity}


def _generate_pneumonia_summary(primary):
    """Generate a human-readable summary for pneumonia results."""
    label = primary["label"].lower()
    conf = primary["confidence"]
    
    if "normal" in label:
        return {
            "status": "clear",
            "title": "Normal Chest X-Ray",
            "message": f"The AI model classified this X-ray as normal with {conf:.1f}% confidence. No signs of pneumonia were detected. Always confirm with a medical professional.",
            "severity": "low"
        }
    else:
        if conf >= 80:
            severity = "high"
            message = f"The AI model detected signs of {primary['label']} with high confidence ({conf:.1f}%). Please seek immediate medical consultation with a pulmonologist."
        elif conf >= 50:
            severity = "medium"
            message = f"The AI model suggests possible {primary['label']} ({conf:.1f}% confidence). A follow-up X-ray and medical consultation is recommended."
        else:
            severity = "low"
            message = f"The AI model found mild indicators of {primary['label']} ({conf:.1f}% confidence). Consider consulting a doctor for further evaluation."
        
        return {
            "status": "detected",
            "title": f"{primary['label']} Detected",
            "message": message,
            "severity": severity
        }


if __name__ == "__main__":
    print("=" * 60)
    print("  AidME Disease Detection API")
    print("=" * 60)
    print(f"  Cataract Model : {'✓ Found' if os.path.exists(CATARACT_MODEL_PATH) else '✗ Missing'}")
    print(f"  Pneumonia Model: {'✓ Found' if os.path.exists(PNEUMONIA_MODEL_PATH) else '✗ Missing'}")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5050, debug=False)
