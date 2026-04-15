from ultralytics import YOLO

model = YOLO("yolov8s.pt")

model.train(
    data="./data/data.yaml",
    epochs=10,
    imgsz=640,
    name="aidme_model",
    device=0
)