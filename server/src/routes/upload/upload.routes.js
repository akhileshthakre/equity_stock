const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const UploadController = require('../../controller/upload.controller');
const multer = require('multer');

const upload = multer();

router.post('/stockFile', authenticateToken, upload.single('file'), (req, res) => {
    UploadController.upload(req, req.file, res);
  });

router.post('/testFile', authenticateToken, upload.single('file'), (req, res) => {
    UploadController.upload(req, req.file, res);
});
  

module.exports = router;