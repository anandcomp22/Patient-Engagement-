const jwt = require('jsonwebtoken');


const generateToken = (user, role) => {
  const payload = {
    role,
    email: user.email
  };

  if (role === 'doctor') {
    payload.doctorId = user.doctorId;
  }

  if (role === 'patient') {
    payload.patientId = user.patientId;
  }

  if (role === 'admin') {
    payload.adminId = user.adminId;
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
};

module.exports = { generateToken };
