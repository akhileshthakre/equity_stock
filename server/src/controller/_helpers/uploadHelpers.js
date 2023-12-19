const db = require('../../model');
const Stock = db.stocks;
const TestValue = db.testValues

const convertSheetColumnsToDatabase = (sheetColumns) => {
    console.log('SHeet', sheetColumns)
    const columnMapping = {
      'fall in stock': 'fallInStock',
      'limit level': 'limitLevel',
      'hld days': 'hldDay',
    };
    return sheetColumns.map((sheetColumn) => columnMapping[sheetColumn.toLowerCase()]);
  };

// Function to process data from the Excel file and update the RDS database
const processAndSyncData = async (worksheet, fileType) => {
let databaseColumns
try{
    const columns = getColumnsFromHeaderRow(worksheet.getRow(1).values);

    if(fileType === 'testFile') {
     databaseColumns = convertSheetColumnsToDatabase(columns);
    }

    const rows = [];
    for (let i = 2; i <= worksheet.rowCount; i++) {
        const rowData = worksheet.getRow(i).values;

        // Skip the first row and empty rows
        if (rowData.every(cell => cell === undefined || cell === null)) {
          continue;
        }
        const rowObject = mapRowToObject(fileType === 'testFile' ? databaseColumns: columns, rowData);
        // Skip rows with unexpected values
        if (rowObject === null) {
          continue;
        }
        rows.push(rowObject);
      }

   switch(fileType) {
    case 'stockFile':
        await Stock.bulkCreate(rows, { updateOnDuplicate: Object.keys(rows[0]) });
        break
    case 'testFile':
        await TestValue.bulkCreate(rows, {
          fields: databaseColumns,
          updateOnDuplicate: databaseColumns,
        });
        break
   }
   console.log('Bulk insert completed.');
} catch (error) {
    console.error('Error during bulk insert:', error);
  }
};
  
  // Function to get columns from the header row and ensure consistent order
  const getColumnsFromHeaderRow = (headerRow) => {
    return headerRow.filter(column => column !== undefined).map((column) => column.toString().toLowerCase());
  };
  
  const mapRowToObject = (columns, rowData) => {
    const data = rowData.filter(row => row !== undefined).map((row) => row)
    const rowObject = {};
    columns.forEach((column, index) => {
      rowObject[column] = data[index];
    });

    return rowObject;
  };

  module.exports = processAndSyncData