const db = require('../model');
const Stock = db.stocks;
const ExcelJS = require('exceljs');

const uploadFileAndSyncDatabase = async (req, file, res) => {
  try {
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const worksheet = workbook.worksheets[0];

    await processAndSyncData(worksheet);

    res.status(200).json({ message: 'File uploaded and database updated successfully' });
  } catch (error) {
    console.error('Error uploading file and syncing database:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Function to process data from the Excel file and update the RDS database
const processAndSyncData = async (worksheet) => {
  const columns = getColumnsFromHeaderRow(worksheet.getRow(1).values);

  const rows = [];
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const rowData = worksheet.getRow(i).values;
    const rowObject = mapRowToObject(columns, rowData);
    rows.push(rowObject);
  }

  await Stock.bulkCreate(rows, { updateOnDuplicate: Object.keys(rows[0]) });

  console.log('Bulk insert completed.');
};

// Function to get columns from the header row and ensure consistent order
const getColumnsFromHeaderRow = (headerRow) => {
  return headerRow.map((column) => column.toString().toLowerCase());
};

const mapRowToObject = (columns, rowData) => {
  const rowObject = {};

  columns.forEach((column, index) => {
    rowObject[column] = rowData[index];
  });

  return rowObject;
};

const UploadController = {
  upload: uploadFileAndSyncDatabase,
};

module.exports = UploadController;
