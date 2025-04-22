const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
    res.send("Appointments API is working");
});

module.exports = router;
