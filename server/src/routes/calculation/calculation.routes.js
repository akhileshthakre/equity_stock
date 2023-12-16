const express = require('express');
const router = express.Router();
const CalculationController = require('../../controller/calculation.controller');

router.get('/', CalculationController.fetchDateRange);

module.exports = router;
