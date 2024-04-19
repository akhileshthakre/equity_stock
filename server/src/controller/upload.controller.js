const ExcelJS = require('exceljs');
const processAndSyncData = require('./_helpers/uploadHelpers');

const uploadFileAndSyncDatabase = async (req, file, res) => {
    const userId = req.user.userId
    const path = req.path.split('/');
    let fileCount
    const filesName = []
    try {
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const workbook = new ExcelJS.Workbook();
        const stockFile = path.find(item => item === 'stockFile');
        const testFile = path.find(item => item === 'testFile');
        const executionFile = path.find(item => item === 'executionFile');
        const allStockSymbols = path.find(item => item === 'allStockSymbols');


        if(stockFile) {
            try {
                fileCount = file.length
                for (const value of file) {
                    filesName.push(value.originalname)
                    await workbook.xlsx.load(value.buffer);
                    const worksheet = workbook.worksheets[0];
                    await processAndSyncData(userId, worksheet, 'stockFile', value.originalname);
                }
                res.send({
                    data: {fileCount, filesName},
                })
            } catch (loadError) {
                console.error('Error loading Excel file:', loadError);
                return res.status(500).json({ message: 'Internal Server Error' });
            }

        }else if(testFile) {
            await workbook.xlsx.load(file.buffer);
            const worksheet = workbook.worksheets[0];
            await processAndSyncData(userId, worksheet, 'testFile', 'testDataFile');
            res.status(200).json({ message: 'File uploaded and database updated successfully' });
        }else if(executionFile) {
            await workbook.xlsx.load(file.buffer);
            const worksheet = workbook.worksheets[0];
            await processAndSyncData(userId, worksheet, 'executionFile', 'executionSheet');
            res.status(200).json({ message: 'File uploaded and database updated successfully' });
        }else if(allStockSymbols) {
            await workbook.xlsx.load(file.buffer);
            const worksheet = workbook.worksheets[0];
            await processAndSyncData(userId, worksheet, 'allStockSymbols', 'allStockSymbolsFile');
            res.status(200).json({ message: 'File uploaded and database updated successfully' });
        }

    } catch (uploadError) {
        console.error('Error uploading file and syncing database:', uploadError);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const UploadController = {
  upload: uploadFileAndSyncDatabase,
};

module.exports = UploadController;
