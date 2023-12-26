const ExcelJS = require('exceljs');
const processAndSyncData = require('./_helpers/uploadHelpers');

const uploadFileAndSyncDatabase = async (req, file, res) => {
    const path = req.path.split('/');
    try {
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const workbook = new ExcelJS.Workbook();
        try {
            await workbook.xlsx.load(file.buffer);
        } catch (loadError) {
            console.error('Error loading Excel file:', loadError);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        const worksheet = workbook.worksheets[0];
        const foundValue = path.find(item => item === 'stockFile');
        if (foundValue) {
            await processAndSyncData(worksheet, 'stockFile', file.originalname);
        } else {
            await processAndSyncData(worksheet, 'testFile');
        }

        res.status(200).json({ message: 'File uploaded and database updated successfully' });
    } catch (uploadError) {
        console.error('Error uploading file and syncing database:', uploadError);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const UploadController = {
  upload: uploadFileAndSyncDatabase,
};

module.exports = UploadController;
