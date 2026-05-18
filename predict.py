from ultralytics import YOLO

model = YOLO("runs/detect/aidme_model5/weights/best.pt")

results = model("test.jpeg", conf=0.25)

for r in results:
    for box in r.boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0]) * 100
        
        label = model.names[cls]
        print(f"{label} : {conf:.2f}%")