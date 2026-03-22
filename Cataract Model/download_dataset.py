import os
import zipfile
import shutil

# 1. Point Kaggle API to the current folder to find kaggle.json
os.environ['KAGGLE_CONFIG_DIR'] = os.path.dirname(os.path.abspath(__file__))

# We are using the most robust dataset available for Cataract vs Normal
DATASET_NAME = "gunavenkatdoddi/eye-diseases-classification"
TEMP_DIR = "temp_dataset"
TRAIN_DIR = "dataset/train"

def download_and_prepare_data():
    import kaggle
    
    print(f"Downloading {DATASET_NAME} from Kaggle...")
    kaggle.api.dataset_download_files(DATASET_NAME, path=TEMP_DIR, unzip=True)
    print("Download and extraction complete.")

    # Create your required folder structure
    cataract_dest = os.path.join(TRAIN_DIR, 'cataract')
    normal_dest = os.path.join(TRAIN_DIR, 'normal')
    
    os.makedirs(cataract_dest, exist_ok=True)
    os.makedirs(normal_dest, exist_ok=True)

    print("Filtering and organizing Cataract and Normal images...")
    
    # Walk through the unzipped temp folder to find the images
    images_moved = 0
    for root, dirs, files in os.walk(TEMP_DIR):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                source_path = os.path.join(root, file)
                
                # If the folder name indicates cataract, move to dataset/train/cataract
                if 'cataract' in root.lower():
                    shutil.move(source_path, os.path.join(cataract_dest, file))
                    images_moved += 1
                # If the folder name indicates normal, move to dataset/train/normal
                elif 'normal' in root.lower():
                    shutil.move(source_path, os.path.join(normal_dest, file))
                    images_moved += 1

    print(f"Successfully moved {images_moved} relevant images to {TRAIN_DIR}!")

    # Clean up the temporary Kaggle download folder (removes Glaucoma/Retinopathy data)
    print("Cleaning up temporary files...")
    shutil.rmtree(TEMP_DIR)
    print("Dataset is ready for train.py!")

if __name__ == "__main__":
    download_and_prepare_data()