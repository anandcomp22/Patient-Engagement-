from ultralytics import YOLO

def train():
    model = YOLO("yolov8s.pt")

    model.train(
        data="./data/data.yaml",
        epochs=10,
        imgsz=640,
        name="aidme_model",
        device=0,
        workers=8
    )

if __name__ == "__main__":
    train()