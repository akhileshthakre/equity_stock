const fs = require('fs');
const db = require('../model');
const Stock = db.stocks
const ExecutionSheet = db.executionSheet;
const path = require('path');
const exceljs = require('exceljs');
const processAndSyncData = require('./_helpers/uploadHelpers');
const calculateValues = require('./calculation/_helpers/calculateValues');


async function processExcelFile(userId, filePath, fileName) {
  try {
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];

    await processAndSyncData(userId, worksheet, 'stockFile', fileName);

    console.log(`Upload process completed for file: ${fileName}`);
  } catch (error) {
    console.error(`Error processing Excel file ${fileName}:`, error.message);
  }
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

const filesToUpload = async (req, res) => {
  try {
    const userId = req.user.userId;
    const basePath = req.body.path

    const result = await ExecutionSheet.findAll({
      where: { userId },
      attributes: ['sheetNames'],
    });

    if (result && result.length > 0) {
      const sheetNamesFromDatabase = result.map(row => row.sheetNames);
      const uploadedFiles = [];

      for (const sheetName of sheetNamesFromDatabase) {
        const fileName = `${sheetName}.xlsx`;
        const filePath = path.join(basePath, fileName);

        if (fileExists(filePath)) {
          await processExcelFile(userId, filePath, fileName);
          uploadedFiles.push(fileName);
        } else {
          console.error(`${fileName} does not exist in ${basePath}`);
        }
      }

      const response = {
        data: {
          fileCount: uploadedFiles.length,
          fileNames: uploadedFiles,
        },
      };

      res.status(200).json(response);
    } else {
      const response = {
        error: `No data found for userId ${userId}`,
      };
      res.status(404).json(response);
    }
  } catch (error) {
    console.error('Error fetching data from the database:', error);
    const response = {
      error: 'Internal Server Error',
    };
    res.status(500).json(response);
  }
};

const calculate = async (req, res) => {
  let calculatedResult = []
  try {
    const userId = req.user.userId
    const fileNames = req.body.fileNames

    for(const stockId of fileNames) {
      const stocks = await Stock.findAll({
        where: {
          name: stockId,
          userId: userId
        },
      });
  
      const executionSheetData = await ExecutionSheet.findOne({
        where: {
            userId,
            sheetNames: stockId
        },
        limit: 1
      });

      const result = await calculateValues(stocks, executionSheetData.dataValues);


      const finalData = {
        "SheetNames" : executionSheetData.dataValues.sheetNames,
        "Stock Symbol": executionSheetData.dataValues.stockSymbol,
        "Weightage": executionSheetData.dataValues.weightage * 100,
        "Fall in Stock": executionSheetData.dataValues.fallInStock * 100,
        "Limit Level": executionSheetData.dataValues.limitLevel * 100,
        "Hld Day": executionSheetData.dataValues.hldDay,
        "BP": result[result.length - 1].BP,
        "Pos Initiated": result[result.length - 1].DPosInitial,
        "Sloss": result[result.length - 1].Sloss,
        "TGT": result[result.length - 1].TGT,
        "SL Hit?": result[result.length - 1].SLHit,
        "Tgt Hit?": result[result.length - 1].TGTHit,
        "Hld Day": result[result.length - 1].HLDDay,
        "Trade Close": result[result.length - 1].TradeClose,
        "SP": result[result.length - 1].SP,
        "Carry": result[result.length - 1].Carry,
        "Ret": result[result.length - 1].Ret,
        "ND": result[result.length - 1].ND,
        "LP": result[result.length - 1].LP,
      }

      calculatedResult = [...calculatedResult, finalData]
    } 
    const response = {
      data: calculatedResult
    }

    res.status(200).json(response);

  }catch (error) {
    console.error('Error executing data:', error);
    const response = {
      error: 'Internal Server Error',
    };
    res.status(500).json(response);
  }
}

const ExecutionController = {
  uploadFiles: filesToUpload,
  calculate: calculate
};

module.exports = ExecutionController;
