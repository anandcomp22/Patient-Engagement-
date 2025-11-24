const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const JWT_SECRET = process.env.JWT_SECRET;

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


router.post('/patient/login', async (req, res) => {
  const { email, password } = req.body;

  const patient = await Patient.findOne({ email });
  if (!patient) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, patient.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: patient._id, role: 'patient' }, JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({ message: 'Login successful', token, user: patient });
});


module.exports = router;
