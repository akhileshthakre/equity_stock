const db = require('../model');
const { Op } = require('sequelize');
const moment = require('moment');
const xlsx = require('xlsx'); // For processing Excel files
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const StockSymbols = db.stockSymbols;
const Stock = db.stocks;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const Queue = require('bull');
const redisClient = require('../../redisClient'); // Adjust the path as needed

const excelProcessingQueue = new Queue('excelProcessing', {
  redis: {
    host: process.env.REDIS_HOST || '0.0.0.0',
    port: process.env.REDIS_PORT || 6379
  }
});

const batchArray = (arr, batchSize) => {
  const batches = [];
  for (let i = 0; i < arr.length; i += batchSize) {
    batches.push(arr.slice(i, i + batchSize));
  }
  return batches;
};

// Helper to process stock data from Python output
const processStockData = (results, symbol, userId) => {
  const closeKey = `('Close', '${symbol}')`;
  const highKey = `('High', '${symbol}')`;
  const lowKey = `('Low', '${symbol}')`;
  const openKey = `('Open', '${symbol}')`;

  if (!results[openKey] || !results[closeKey] || !results[highKey] || !results[lowKey]) {
    console.error(`Missing data for symbol ${symbol}`);
    return [];
  }

  return Object.keys(results[openKey]).map((timestamp) => {
    const date = moment(Number(timestamp)).format('YYYY-MM-DD HH:mm:ss');
    return {
      name: symbol,
      period: date,
      price: Number(results[closeKey][timestamp]),
      high: Number(results[highKey][timestamp]),
      low: Number(results[lowKey][timestamp]),
      open: Number(results[openKey][timestamp]),
      userId: userId,
    };
  });
};

// Helper to process stock data for search
const processStockDataForSearch = (results, symbol, userId) => {
  const closeKey = `('Close', '${symbol}')`;
  const highKey = `('High', '${symbol}')`;
  const lowKey = `('Low', '${symbol}')`;
  const openKey = `('Open', '${symbol}')`;

  console.log(results);


  if (!results[openKey] || !results[closeKey] || !results[highKey] || !results[lowKey]) {
    console.error(`Missing data for symbol ${symbol}`);
    return [];
  }

  return Object.keys(results[openKey]).map((timestamp) => {
    const date = moment(Number(timestamp)).format('YYYY-MM-DD HH:mm:ss');
    return {
      name: symbol,
      period: date,
      price: results[closeKey][timestamp],
      high: results[highKey][timestamp],
      low: results[lowKey][timestamp],
      open: results[openKey][timestamp],
      userId: userId,
    };
  });
};

// Process Excel job handler
excelProcessingQueue.process(async (job) => {
  const { data, userId, uploadId, apiSource } = job.data;
  let allResults = [];
  let errors = [];
  const BATCH_SIZE = 2000;

  // Remove existing stock data for this user
  await Stock.destroy({ where: { userId } });

  for (const [index, row] of data.entries()) {
    // Log and check cancellation before processing the row
    const currentUploadId = await redisClient.get(`uploadId_${userId}`);
    console.log(`Processing row ${index + 1}: Job uploadId=${uploadId}, current uploadId in Redis=${currentUploadId}`);
    if (Number(currentUploadId) !== uploadId) {
      console.log(`Job cancelled for user ${userId} due to new upload.`);
      return { message: 'Job cancelled because of a new upload' };
    }

    if (!row.Symbols || !row.StartDate || !row.EndDate) {
      continue;
    }

    const symbol = row.Symbols;
    const startDate = moment(row.StartDate, [
      'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD',
      'MM-DD-YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD',
      'DD.MM.YYYY', 'MM.DD.YYYY', 'YYYY.MM.DD'
    ]).format('YYYY-MM-DD');
    const endDate = moment(row.EndDate, [
      'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD',
      'MM-DD-YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD',
      'DD.MM.YYYY', 'MM.DD.YYYY', 'YYYY.MM.DD'
    ]).format('YYYY-MM-DD');

    try {
      const pythonScript = apiSource == "yahoo"
        ? `python3 getStockData.py ${symbol} ${startDate} ${endDate}`
        : apiSource == "eod"
          ? `python3 getEodStockData.py ${symbol} ${startDate} ${endDate}`
          : apiSource == "twelvedata"
            ? `python3 getTwelveStockData.py ${symbol} ${startDate} ${endDate}`
            : `python3 getJQuantsStockData.py ${symbol} ${startDate} ${endDate}`;
      const { stdout } = await execAsync(pythonScript);

      // Check cancellation again after async operation
      const currentUploadIdAfterExec = await redisClient.get(`uploadId_${userId}`);
      if (Number(currentUploadIdAfterExec) !== uploadId) {
        console.log(`Job cancelled for user ${userId} after executing Python script.`);
        return { message: 'Job cancelled because of a new upload' };
      }

      const jsonStart = stdout.indexOf('{');
      if (jsonStart === -1) {
        throw new Error("Valid JSON output not found for symbol " + symbol);
      }
      const jsonString = stdout.slice(jsonStart);
      const results = JSON.parse(jsonString);

      const rowResults = processStockData(results, symbol, userId);
      allResults = allResults.concat(rowResults);

      if (allResults.length >= BATCH_SIZE) {
        const batchToSave = allResults.slice(0, BATCH_SIZE);
        await Stock.bulkCreate(batchToSave, {
          updateOnDuplicate: ['name', 'period', 'price', 'high', 'low', 'open', 'userId'],
        });
        allResults = allResults.slice(BATCH_SIZE);
      }

      // Update job progress (simple calculation)
      job.progress(Math.floor(((index + 1) / data.length) * 100));

    } catch (err) {
      console.error(`Error processing symbol ${symbol}:`, err);
      errors.push({ symbol, error: err.message });
    }
  }

  // Save any remaining results
  if (allResults.length > 0) {
    const remainingBatches = batchArray(allResults, BATCH_SIZE);
    for (const batch of remainingBatches) {
      await Stock.bulkCreate(batch, {
        updateOnDuplicate: ['name', 'period', 'price', 'high', 'low', 'open', 'userId'],
      });
    }
  }

  return {
    message: 'Excel file processed successfully',
    processedRecords: allResults.length,
    errors: errors.length > 0 ? errors : undefined,
  };
});

const SearchController = {
  getSearchStock: async (req, res) => {
    const userId = req.user.userId;
    const { symbols, startDate, endDate, apiSource } = req.body;


    try {
      let allResults = [];
      
      // Delete existing stocks for this userId
      await Stock.destroy({ where: { userId } });

      // Batch symbols if needed
      const symbolBatches = batchArray(symbols, 10);

      for (const batch of symbolBatches) {
        const fetchPromises = batch.map(async (symbol) => {
          const pythonScript = apiSource == "yahoo"
            ? `python3 getStockData.py ${symbol} ${startDate} ${endDate}`
            : apiSource == "eod"
              ? `python3 getEodStockData.py ${symbol} ${startDate} ${endDate}`
              : apiSource == "twelvedata"
                ? `python3 getTwelveStockData.py ${symbol} ${startDate} ${endDate}`
                : `python3 getJQuantsStockData.py ${symbol} ${startDate} ${endDate}`;
          const { stdout } = await execAsync(pythonScript);
          const results = JSON.parse(stdout);
          return processStockDataForSearch(results, symbol, userId);
        });
        const batchResults = await Promise.all(fetchPromises);
        allResults = allResults.concat(...batchResults);
      }

      if (allResults.length > 0) {
        await Stock.bulkCreate(allResults, {
          updateOnDuplicate: ['name', 'period', 'price', 'high', 'low', 'open', 'userId'],
        });
      }

      res.json(allResults);
    } catch (error) {
      console.error('Error retrieving stock data:', error);
      res.status(200).send({ error: 'Error retrieving stock data' });
    }
  },

  downloadAllStocks: async (req, res) => {
    try {
      const userId = req.user.userId;

      // Retrieve all stocks for this user
      const stocks = await Stock.findAll({
        where: { userId },
        order: [['name', 'ASC'], ['period', 'ASC']]
      });

      if (!stocks.length) {
        return res.status(200).send({ status: false, message: 'No stocks found for download' });
      }

      // Create temporary directory if needed
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      // Group stocks by symbol
      const stocksBySymbol = stocks.reduce((acc, stock) => {
        if (!acc[stock.name]) {
          acc[stock.name] = [];
        }
        acc[stock.name].push({
          Date: moment(stock.period).format('YYYY-MM-DD HH:mm:ss'),
          Open: Number(parseFloat(stock.open).toFixed(2)),
          High: Number(parseFloat(stock.high).toFixed(2)),
          Low: Number(parseFloat(stock.low).toFixed(2)),
          Close: Number(parseFloat(stock.price).toFixed(2))
        });
        return acc;
      }, {});

      // Create a zip archive of the Excel files
      const archive = archiver('zip', { zlib: { level: 9 } });
      const zipFilePath = path.join(tempDir, `stocks_${userId}_${Date.now()}.zip`);
      const output = fs.createWriteStream(zipFilePath);

      archive.pipe(output);

      for (const [symbol, data] of Object.entries(stocksBySymbol)) {
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(workbook, worksheet, symbol);
        const excelFilePath = path.join(tempDir, `${symbol}.xlsx`);
        xlsx.writeFile(workbook, excelFilePath);
        archive.file(excelFilePath, { name: `${symbol}.xlsx` });
      }

      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.finalize();
      });

      res.download(zipFilePath, `stocks_${moment().format('YYYY-MM-DD')}.zip`, (err) => {
        fs.unlinkSync(zipFilePath);
        Object.keys(stocksBySymbol).forEach(symbol => {
          const excelPath = path.join(tempDir, `${symbol}.xlsx`);
          if (fs.existsSync(excelPath)) {
            fs.unlinkSync(excelPath);
          }
        });
      });
    } catch (error) {
      console.error('Error downloading stocks:', error);
      res.status(200).send({
        message: 'Error downloading stocks',
        status: false
      });
    }
  },

  processExcelFile: async (req, res) => {
    try {
      const userId = req.user.userId;
      const file = req.file;
      const { apiSource } = req.query;


      if (!file) {
        return res.status(400).send({ error: 'No file uploaded' });
      }

      // Read the Excel file from the buffer
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (!data.length) {
        return res.status(400).send({ error: 'Excel file is empty' });
      }

      // Generate a new unique upload ID and store it in Redis
      const newUploadId = Date.now();
      await redisClient.set(`uploadId_${userId}`, newUploadId);
      console.log(`New upload received for user ${userId} with uploadId=${newUploadId}`);

      // Clean up all jobs for this user (active, waiting, completed)
      const activeJobs = await excelProcessingQueue.getActive();
      const waitingJobs = await excelProcessingQueue.getWaiting();
      const completedJobs = await excelProcessingQueue.getCompleted();
      const allJobs = [...activeJobs, ...waitingJobs, ...completedJobs];

      for (const job of allJobs) {
        if (job.data && job.data.userId === userId) {
          await job.remove();
        }
      }

      // Add the new job to the queue, including the upload ID
      const job = await excelProcessingQueue.add({
        data,
        userId,
        uploadId: newUploadId,
        apiSource
      });

      res.json({
        message: 'Excel file processing started',
        jobId: job.id
      });
    } catch (error) {
      console.error('Error processing Excel file:', error);
      res.status(200).send({
        error: 'Error processing Excel file',
        details: error.message,
      });
    }
  },

  listenStatus: async (req, res) => {
    try {
      const { jobId } = req.query;
      let job;
      
      if (jobId) {
        job = await excelProcessingQueue.getJob(jobId);
        if (!job) {
          return res.status(404).json({ error: 'Job not found' });
        }
      } else {
        const activeJobs = await excelProcessingQueue.getActive();
        const waitingJobs = await excelProcessingQueue.getWaiting();
        const allJobs = [...activeJobs, ...waitingJobs];
        
        if (allJobs.length === 0) {
          return res.status(200).json({ state: 'completed' });
        }
        
        job = allJobs.reduce((latest, current) => {
          return !latest || current.timestamp > latest.timestamp ? current : latest;
        });
      }

      const state = await job.getState();
      const progress = job.progress();
      const result = job.returnvalue;

      res.json({ 
        jobId: job.id,
        state, 
        progress, 
        result 
      });
      
    } catch (error) {
      console.error('Error retrieving job status:', error);
      res.status(200).json({ error: error.message });
    }
  }
};

module.exports = SearchController;
