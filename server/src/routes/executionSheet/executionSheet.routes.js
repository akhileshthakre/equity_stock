const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const ExecutionSheetController = require('../../controller/executionSheet.controller');

router.get('/', authenticateToken, ExecutionSheetController.getAllData);
router.delete('/deleteExecutionData', authenticateToken, ExecutionSheetController.deleteAllData)

module.exports = router;
