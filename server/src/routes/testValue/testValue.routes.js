const express = require('express');
const router = express.Router();
const TestValuesController = require('../../controller/testValue.controller');

router.get('/', TestValuesController.getAllTestValues);
router.delete('/deleteAllTestValues', TestValuesController.deleteAllTestValues)

module.exports = router;
