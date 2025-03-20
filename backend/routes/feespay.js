const express = require('express');
const router = express.Router();

// Sample API route
router.get('/', (req, res) => {
    res.send("Appointments API is working");
});

module.exports = router;
