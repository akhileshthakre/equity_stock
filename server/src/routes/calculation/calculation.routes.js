const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const CalculationService= require('../../controller/calculation/calculation.controller');

router.get('/', authenticateToken, CalculationService.fetchData);

module.exports = router;
