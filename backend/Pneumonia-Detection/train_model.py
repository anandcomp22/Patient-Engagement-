from ultralytics import YOLO

def train():
    model = YOLO("yolov8s-cls.pt")

    model.train(
        data="./data",
        epochs=10,
        imgsz=224,
        name="pneumonia_model",
        device=0,
        workers=8
    )

if __name__ == "__main__":
    train()