const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const StockController = require('../../controller/stock.controller');

router.get('/', authenticateToken, StockController.getAllStock);
router.delete('/deleteStocks', authenticateToken, StockController.deleteAllStocks)

module.exports = router;
