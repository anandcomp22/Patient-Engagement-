import os
from huggingface_hub import snapshot_download

model_id = "csukuangfj/sherpa-onnx-streaming-zipformer-en-2023-06-26"
local_dir = "models/sherpa-onnx-streaming-zipformer-en-2023-06-26"

print(f"Downloading {model_id} to {local_dir}...")
os.makedirs(local_dir, exist_ok=True)

snapshot_download(
    repo_id=model_id,
    local_dir=local_dir,
    local_dir_use_symlinks=False
)
print("Download complete!")
