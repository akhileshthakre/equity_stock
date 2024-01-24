const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const ExecutionService = require('../../controller/execution.controller');

router.post('/execute', authenticateToken, ExecutionService.uploadFiles);
router.post('/calculate', authenticateToken, ExecutionService.calculate);


module.exports = router;
