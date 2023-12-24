const express = require('express');
const router = express.Router();
const {UserController} = require('../../controller/user.controller');

router.get('/login', UserController.loginUser);
router.post('/register', UserController.createUser);

module.exports = router;
