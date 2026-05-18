from roboflow import Roboflow
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("ROBOFLOW_API_KEY")

rf = Roboflow(api_key=api_key)

project = rf.workspace("newworkspace-t5oqu").project("kataract-object-detection")
version = project.version(3)

dataset = version.download("yolov8", location="./data")

print("Dataset path:", dataset.location)
print("data.yaml path:", os.path.join(dataset.location, "data.yaml"))