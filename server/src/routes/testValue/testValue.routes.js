const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const TestValuesController = require('../../controller/testValue.controller');

router.get('/', authenticateToken, TestValuesController.getAllTestValues);
router.delete('/deleteAllTestValues', authenticateToken, TestValuesController.deleteAllTestValues)

module.exports = router;
