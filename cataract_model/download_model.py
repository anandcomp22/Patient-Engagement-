from huggingface_hub import hf_hub_download

model_path = hf_hub_download(
    repo_id="Sayyoni/cataract_vgg16_model",
    filename="cataract_vgg16_model.h5"
)

print("Model downloaded at:", model_path)
