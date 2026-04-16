from roboflow import Roboflow
import os

rf = Roboflow(api_key=os.getenv("ROBOFLOW_API_KEY"))

workspaces = ["newworkspacet5oqu"]

for ws in workspaces:
    print("\nWorkspace:", ws)
    print(rf.workspace(ws).projects())