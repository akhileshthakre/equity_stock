const db = require('../../model');
const Stock = db.stocks;
const TestValue = db.testValues
const ExecutionFile = db.executionSheet
const StockSymbols = db.stockSymbols

const convertSheetColumnsToDatabase = (sheetColumns, userId) => {
  const columnMapping = {
    'fall in stock': 'fallInStock',
    'limit level': 'limitLevel',
    'hld days': 'hldDay',
  };

  const normalizedColumns = sheetColumns.map((sheetColumn) => sheetColumn.toLowerCase());

  if (normalizedColumns.includes('hld day')) {
    const index = normalizedColumns.indexOf('hld day');
    normalizedColumns[index] = 'hld days';
  }

  const columnsWithUserId = normalizedColumns.map((sheetColumn) => columnMapping[sheetColumn]);

  if (userId && !columnsWithUserId.includes('userId')) {
    columnsWithUserId.push('userId');
  }

  return columnsWithUserId;
};

const convertExecutionSheetColumns = (sheetColumns, userId) => {
  const columnMapping = {
    'sheetnames': 'sheetNames',
    'stock symbol': 'stockSymbol',
    'weightage': 'weightage',
    'fall in stock': 'fallInStock',
    'limit level': 'limitLevel',
    'hld days': 'hldDay',
  };

  const normalizedColumns = sheetColumns.map((sheetColumn) => sheetColumn.toLowerCase());

  if (normalizedColumns.includes('hld day')) {
    const index = normalizedColumns.indexOf('hld day');
    normalizedColumns[index] = 'hld days';
  }
  const columnsWithUserId = normalizedColumns.map((sheetColumn) => columnMapping[sheetColumn]);
  if (userId && !columnsWithUserId.includes('userId')) {
    columnsWithUserId.push('userId');
  }

  return columnsWithUserId;
};



// Function to process data from the Excel file and update the RDS database
const processAndSyncData = async (userId, worksheet, fileType, fileName) => {
let databaseColumns
let originalFileName
if(fileType === "stockFile") {
  originalFileName = fileName.split('.')
}
try{
  let columns
    if(fileType !== 'executionFile') {
      columns = getColumnsFromHeaderRow(worksheet.getRow(1).values);
    }else {
      columns = getColumnsFromHeaderRow(worksheet.getRow(2).values);
    }


    if(fileType === 'testFile') {
     databaseColumns = convertSheetColumnsToDatabase(columns, userId);
    }
    if(fileType === 'executionFile') {
      databaseColumns = convertExecutionSheetColumns(columns, userId);
     }

    if(fileType === 'stockFile') {
      if(columns.includes('close')) {
        const index = columns.indexOf('close') 
        columns[index] = 'price'
      }

      if(columns.includes('date')) {
        const index = columns.indexOf('date')
          columns[index] = 'period'
      }

      if(!columns.includes('name')) {
        columns[columns.length] = 'name'
      }
    }

    const rows = [];

    for (let i = (fileType !== 'executionFile' ? 2 : 3); i <= worksheet.rowCount; i++) {
      const rowData = worksheet.getRow(i).values;
      let executionData

      //to remove formula cells from execution sheet
      if(fileType === 'executionFile') {
        executionData = rowData.filter((data) => typeof data !== 'object');
      }
      
        // Skip the first row and empty rows
        if (rowData.every(cell => cell === undefined || cell === null)) {
          continue;
        }
        const rowObject = mapRowToObject((fileType === 'testFile' || fileType === 'executionFile') ? databaseColumns : columns, fileType === 'executionFile' ? executionData : rowData, originalFileName ? originalFileName[0] : '', userId);
        // Skip rows with unexpected values
        if (rowObject === null) {
          continue;
        }
        rows.push(rowObject);
      }

   switch(fileType) {
    case 'stockFile':
        await Stock.bulkCreate(rows, {updateOnDuplicate: Object.keys(rows[0]) });
        break
    case 'testFile':
      await TestValue.bulkCreate(rows, {
        fields: databaseColumns,
        updateOnDuplicate: databaseColumns,
      });
      break;
    case 'executionFile':
      await ExecutionFile.bulkCreate(rows, {        
        fields: databaseColumns,
        updateOnDuplicate: databaseColumns, 
      });
      break;
    case 'allStockSymbols':
      await StockSymbols.destroy({
        where: { userId },
      });
      await StockSymbols.bulkCreate(rows, {updateOnDuplicate: Object.keys(rows[0]) });
      break;
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
  
  const mapRowToObject = (columns, rowData, sheetName, userId) => {
    const data = rowData.filter(row => row !== undefined).map((row) => row);
    const rowObject = {};
  
    if (columns.includes('name')) {
      const nameIndex = columns.indexOf('name');
      rowObject[columns[nameIndex]] = sheetName;
    }
  
    columns.forEach((column, index) => {
      if (column !== 'name') {
        rowObject[column] = data[index];
      }
    });

    rowObject.userId = userId

    return rowObject;
  };

  module.exports = processAndSyncData