const express = require('express');
const router = express.Router();
const StockController = require('../../controller/stock.controller');

router.get('/', StockController.getAllStock);
router.delete('/deleteStocks', StockController.deleteAllStocks)

module.exports = router;
