const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const JWT_SECRET = process.env.JWT_SECRET;

// ===== PATIENT SIGNUP =====
router.post('/patient/signup', async (req, res) => {
  const { firstName, lastName, email, password, phone, age, country, state, district } = req.body;

  try {
    const existing = await Patient.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPatient = new Patient({
      patientname: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      phone,
      age,
      country,
      state,
      district,
      patientId: Math.floor(Math.random() * 100000)
    });

    await newPatient.save();
    res.status(201).json({ message: 'Patient registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering patient', error });
  }
});

// ===== DOCTOR SIGNUP =====
router.post('/doctor/signup', async (req, res) => {
  const {
    firstName, lastName, email, phone, licenseNumber, specialty,
    qualifications, experience, hospital, country, state, district, password
  } = req.body;

  try {
    const existing = await Doctor.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDoctor = new Doctor({
      doctorId: Math.floor(Math.random() * 100000),
      doctorname: `${firstName} ${lastName}`,
      email,
      phone,
      licenseNumber,
      specialty,
      qualifications,
      experience,
      hospital,
      country,
      state,
      district,
      password: hashedPassword
    });

    await newDoctor.save();
    res.status(201).json({ message: 'Doctor registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering doctor', error });
  }
});

// ===== PATIENT LOGIN =====
router.post('/patient/login', async (req, res) => {
  const { email, password } = req.body;

  const patient = await Patient.findOne({ email });
  if (!patient) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, patient.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: patient._id, role: 'patient' }, JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({ message: 'Login successful', token, user: patient });
});

// ===== DOCTOR LOGIN =====
router.post('/doctor/login', async (req, res) => {
  const { email, password } = req.body;

  const doctor = await Doctor.findOne({ email });
  if (!doctor) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, doctor.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: doctor._id, role: 'doctor' }, JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({ message: 'Login successful', token, user: doctor });
});

module.exports = router;
