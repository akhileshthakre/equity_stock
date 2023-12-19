const express = require('express');
const router = express.Router();
const UploadController = require('../../controller/upload.controller');
const multer = require('multer');

const upload = multer();

router.post('/stockFile', upload.single('file'), (req, res) => {
    UploadController.upload(req, req.file, res);
  });

router.post('/testFile', upload.single('file'), (req, res) => {
    UploadController.upload(req, req.file, res);
});
  

module.exports = router;