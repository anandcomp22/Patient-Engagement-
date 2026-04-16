from roboflow import Roboflow
import os
from dotenv import load_dotenv

load_dotenv()

rf = Roboflow(api_key=os.getenv("ROBOFLOW_API_KEY"))

project = rf.workspace("newworkspacet5oqu").project("pneumonia-detection-a14mg-wveyi")
version = project.version(1)

dataset = version.download("folder", location="./data")

print("Dataset downloaded at:", dataset.location)
print("data.yaml path:", os.path.join(dataset.location, "data.yaml"))

