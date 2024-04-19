const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const SearchController = require('../../controller/searchStock.controller');

router.post('/', authenticateToken, SearchController.getSearchStock);
router.get('/downloadStocks', authenticateToken, SearchController.downloadAllStocks);

module.exports = router;
