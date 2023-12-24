const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const CalculationService= require('../../controller/calculation/calculation');

router.get('/', authenticateToken, CalculationService.fetchData);

module.exports = router;
