# Cataract Detection Web Application

A machine learning-powered web application for detecting cataracts in eye images using a VGG16 convolutional neural network model. Built with Flask, TensorFlow/Keras, and OpenCV.

## Features

- **Image Upload**: Upload eye images (JPG/PNG) through a user-friendly web interface
- **Real-time Prediction**: Get instant cataract detection results
- **Pre-trained Model**: Uses a fine-tuned VGG16 model for accurate classification
- **Web Interface**: Clean, responsive UI for easy interaction
- **Model Training**: Includes scripts for training the model on custom datasets

## Project Structure

```
├── app.py                 # Main Flask application
├── train.py              # Model training script
├── predict.py            # Prediction utility functions
├── download_dataset.py   # Dataset download script (Kaggle)
├── requirements.txt      # Python dependencies
├── static/
│   ├── styles.css        # CSS styling
│   └── uploads/          # Uploaded image storage
├── templates/
│   └── index.html        # Main web page template
├── dataset/              # Training dataset (if downloaded)
│   └── train/
│       ├── cataract/
│       └── normal/
└── model/                # Model storage directory
    └── cataract_vgg16_model.h5
```

## Requirements

- Python 3.7+
- TensorFlow 2.x
- Keras
- Flask
- OpenCV
- Pillow
- NumPy

## Installation

1. **Clone or Download** the project to your local machine.

2. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Download Dataset** (Optional - for training):
   - Ensure you have a Kaggle API key (`kaggle.json`)
   - Run the dataset download script:
     ```bash
     python download_dataset.py
     ```

4. **Model Setup**:
   - The pre-trained model `cataract_vgg16_model.h5` is included
   - If you need to retrain, use `train.py`

## Usage

### Running the Web Application

1. **Start the Flask Server**:
   ```bash
   python app.py
   ```

2. **Access the Application**:
   - Open your web browser and go to `http://127.0.0.1:5000`
   - Upload an eye image (JPG/PNG format)
   - View the prediction results

### Training the Model

To train the model on a custom dataset:

```bash
python train.py
```

Make sure your dataset is organized in the `dataset/train/` directory with `cataract/` and `normal/` subfolders.

### Making Predictions Programmatically

Use the `predict.py` script for command-line predictions:

```python
from predict import predict_cataract

result = predict_cataract('path/to/image.jpg')
print(result)  # Returns prediction result
```

## Model Details

- **Architecture**: VGG16 with fine-tuning
- **Input**: RGB images (224x224 pixels)
- **Output**: Binary classification (Cataract/Normal)
- **Framework**: TensorFlow/Keras

## API Endpoints

- `GET /`: Main page with upload form
- `POST /predict`: Image prediction endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open-source. Feel free to use and modify as needed.

## Troubleshooting

- **Import Errors**: Ensure all dependencies are installed
- **Model Loading Issues**: Check that `cataract_vgg16_model.h5` exists and is not corrupted
- **Port Conflicts**: Change the port in `app.py` if 5000 is in use
- **Memory Issues**: Reduce batch size in training if you encounter GPU/CPU memory errors

## Contact

For questions or issues, please check the code comments or create an issue in the repository.
