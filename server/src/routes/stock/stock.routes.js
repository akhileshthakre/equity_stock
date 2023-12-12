const express = require('express');
const router = express.Router();
const StockController = require('../../controller/stock.controller');

router.get('/', StockController.getAllStock);
// router.get('/:userId', UserController.getUserById);
// router.post('/', UserController.createUser);
// router.put('/:userId', UserController.updateUser);
// router.delete('/:userId', UserController.deleteUser);

module.exports = router;
