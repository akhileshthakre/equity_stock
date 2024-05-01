const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/calculate', async (req, res) => {
  try {
    const payload = req.body;
    const goServiceUrl = 'http://localhost:8080/calculate';
    const response = await axios.post(goServiceUrl, payload);

    res.json(response.data);
  } catch (error) {
    console.error('Error calling Go service:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
