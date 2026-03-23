import os
from flask import Flask, render_template, request
from werkzeug.utils import secure_filename
from predict import predict_cataract

app = Flask(__name__)

# Config
UPLOAD_FOLDER = os.path.join('static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure uploads folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def handle_prediction():
    if 'file' not in request.files:
        return render_template('index.html', error='No file uploaded.')
    
    file = request.files['file']
    if file.filename == '':
        return render_template('index.html', error='No file selected.')
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Analyze the image
        result = predict_cataract(filepath)
        
        # Pass path mapping to static folder for UI display
        display_path = f"static/uploads/{filename}"
        
        return render_template('index.html', result=result, image_path=display_path)
    
    return render_template('index.html', error='Invalid file format. Please upload JPG or PNG.')

if __name__ == '__main__':
    app.run(debug=True, port=5000)