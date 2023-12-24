const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const DateRangeController = require('../../controller/dateRange.controller');

router.get('/', authenticateToken, DateRangeController.fetchDateRange);

module.exports = router;
