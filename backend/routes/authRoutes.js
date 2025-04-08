const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');


router.post('/patient/signup', async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      age,
      country,
      state,
      district
    } = req.body;
  
    try {
      const existing = await Patient.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already registered' });
  
      const newPatient = new Patient({
        patientname: `${firstName} ${lastName}`,
        email,
        password,
        phone,
        age,
        country,
        state,
        district,
        patientId: Math.floor(Math.random() * 100000) // or use auto-increment logic
      });
  
      await newPatient.save();
      res.status(201).json({ message: 'Patient registered successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error registering patient', error });
    }
  });
  


  router.post('/doctor/signup', async (req, res) => {
    const {
      firstName,
      lastName,
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
      password
    } = req.body;
  
    try {
      const existing = await Doctor.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already registered' });
  
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
        password
      });
  
      await newDoctor.save();
      res.status(201).json({ message: 'Doctor registered successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error registering doctor', error });
    }
  });
  

router.post('/patient/login', async (req, res) => {
  const { email, password } = req.body;
  const patient = await Patient.findOne({ email, password });
  if (!patient) return res.status(401).json({ message: 'Invalid credentials' });

  res.status(200).json({ message: 'Login successful', user: patient });
});


router.post('/doctor/login', async (req, res) => {
  const { email, password } = req.body;
  const doctor = await Doctor.findOne({ email, password });
  if (!doctor) return res.status(401).json({ message: 'Invalid credentials' });

  res.status(200).json({ message: 'Login successful', user: doctor });
});

module.exports = router;
