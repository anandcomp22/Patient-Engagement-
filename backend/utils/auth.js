const jwt = require('jsonwebtoken');

const generateToken = (user, role) => {
  return jwt.sign(
    { id: user._id, role }, 
    process.env.JWT_SECRET,  
    { expiresIn: '1h' }  
  );
};

module.exports = { generateToken };
