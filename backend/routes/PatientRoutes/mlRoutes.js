const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure scripts directory exists
const scriptsDir = path.join(__dirname, '../../scripts');
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'ml_upload_' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png) are permitted!'));
    }
  }
});

// @route   POST /api/ml/predict
// @desc    Upload image and run ML inference
// @access  Public (Can be protected with auth middleware later if needed)
router.post('/predict', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const modelType = req.body.model;
  if (!modelType || (modelType !== 'cataract' && modelType !== 'pneumonia')) {
    // Clean up uploaded file if invalid model
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Invalid or missing model type. Must be "cataract" or "pneumonia".' });
  }

  const imagePath = req.file.path;
  const scriptPath = path.join(__dirname, '../../scripts/predict.py');

  // Spawn Python process
  // Adjust 'python' to 'python3' or 'py' depending on environment
  const pythonProcess = spawn('python', [scriptPath, '--image', imagePath, '--model', modelType]);

  let scriptOutput = '';
  let scriptError = '';

  pythonProcess.stdout.on('data', (data) => {
    scriptOutput += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    scriptError += data.toString();
    console.error(`Python Error: ${data.toString()}`);
  });

  pythonProcess.on('close', (code) => {
    // Clean up uploaded image after processing
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    if (code !== 0) {
      console.error(`Python script exited with code ${code}. Error: ${scriptError}`);
      return res.status(500).json({ 
        error: 'Failed to process the image for prediction.',
        details: scriptError || 'Unknown error occurred in python child process'
      });
    }

    try {
      // Find JSON block in python output in case of debugging prints
      const outputLines = scriptOutput.trim().split('\n');
      const jsonLine = outputLines.find(line => line.startsWith('{') && line.endsWith('}')) || scriptOutput;
      
      const result = JSON.parse(jsonLine);
      return res.status(200).json(result);
    } catch (parseError) {
      console.error('Failed to parse Python JSON output:', parseError);
      console.error('Raw script Output:', scriptOutput);
      return res.status(500).json({ error: 'Invalid response from model.' });
    }
  });
});

module.exports = router;
