const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const SearchController = require('../../controller/searchStock.controller');
const multer = require('multer');

const upload = multer();

router.post('/', authenticateToken, SearchController.getSearchStock);
router.get('/downloadStocks', authenticateToken, SearchController.downloadAllStocks);
router.post('/bulk', authenticateToken, upload.single('file'), SearchController.processExcelFile);
router.get('/listen', authenticateToken, SearchController.listenStatus);




module.exports = router;
