const express = require('express');
const router = express.Router();
const UploadController = require('../../controller/upload.controller');
const multer = require('multer');

const upload = multer();

router.post('/', upload.single('file'), (req, res) => {
    UploadController.upload(req, req.file, res);
  });
  

module.exports = router;