import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import os

# Try to load the model (Prevents app crash if model isn't trained yet)
MODEL_PATH = 'cataract_vgg16_model.h5'
try:
    model = tf.keras.models.load_model(MODEL_PATH)
except:
    model = None

def predict_cataract(img_path):
    if model is None:
        return "Error: Model not found. Run train.py first."
    
    # Load and preprocess the image exactly as we did during training
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array /= 255.0  # Normalize
    
    # Get prediction
    prediction = model.predict(img_array)[0][0]
    
    # In flow_from_directory, classes are alphanumeric: 0 = cataract, 1 = normal
    if prediction < 0.5:
        confidence = (1 - prediction) * 100
        return f"Cataract Detected ({confidence:.2f}% Confidence)"
    else:
        confidence = prediction * 100
        return f"Normal Eye ({confidence:.2f}% Confidence)"