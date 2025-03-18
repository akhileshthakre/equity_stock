const db = require('../model');
const { Op } = require('sequelize');
const moment = require('moment');
const xlsx = require('xlsx'); // Required for processing Excel files
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const StockSymbols = db.stockSymbols;
const Stock = db.stocks;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const Queue = require('bull');

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


// Helper to process the fetched stock data from Python
const processStockData = (results, symbol, userId) => {
  // Construct keys based on the expected output from Python
  const closeKey = `('Close', '${symbol}')`;
  const highKey = `('High', '${symbol}')`;
  const lowKey = `('Low', '${symbol}')`;
  const openKey = `('Open', '${symbol}')`;

  // Check that all required keys exist
  if (!results[openKey] || !results[closeKey] || !results[highKey] || !results[lowKey]) {
    console.error(`Missing data for symbol ${symbol}`);
    return [];
  }

  return Object.keys(results[openKey]).map((timestamp) => {
    // Convert timestamp string to number for proper formatting
    const date = moment(Number(timestamp)).format('YYYY-MM-DD HH:mm:ss');
    return {
      name: symbol,
      period: date,
      price: Number(parseFloat(results[closeKey][timestamp]).toFixed(2)),
      high: Number(parseFloat(results[highKey][timestamp]).toFixed(2)),
      low: Number(parseFloat(results[lowKey][timestamp]).toFixed(2)), 
      open: Number(parseFloat(results[openKey][timestamp]).toFixed(2)),
      userId: userId,
    };
  });
};

// Helper to process the fetched stock data from Python
const processStockDataForSearch = (results, symbol, userId) => {
  // Construct keys based on the expected output from Python
  const closeKey = `('Close', '${symbol}')`;
  const highKey = `('High', '${symbol}')`;
  const lowKey = `('Low', '${symbol}')`;
  const openKey = `('Open', '${symbol}')`;

  // Check that all required keys exist
  if (!results[openKey] || !results[closeKey] || !results[highKey] || !results[lowKey]) {
    console.error(`Missing data for symbol ${symbol}`);
    return [];
  }

  return Object.keys(results[openKey]).map((timestamp) => {
    // Convert timestamp string to number for proper formatting
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
  const { data, userId } = job.data;
  let allResults = [];
  let errors = [];
  const BATCH_SIZE = 2000;

  await Stock.destroy({
    where: { userId }
  });

  for (const row of data) {
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
      const pythonScript = `python3 getStockData.py ${symbol} ${startDate} ${endDate}`;
      const { stdout } = await execAsync(pythonScript);

      const jsonStart = stdout.indexOf('{');
      if (jsonStart === -1) {
        throw new Error("Valid JSON output not found for symbol " + symbol);
      }
      const jsonString = stdout.slice(jsonStart);
      const results = JSON.parse(jsonString);

      const rowResults = processStockData(results, symbol, userId);
      allResults = allResults.concat(rowResults);

      // If we've accumulated enough results, save them to the database
      if (allResults.length >= BATCH_SIZE) {
        const batchToSave = allResults.slice(0, BATCH_SIZE);
        await Stock.bulkCreate(batchToSave, {
          updateOnDuplicate: ['name', 'period', 'price', 'high', 'low', 'open', 'userId'],
        });
        allResults = allResults.slice(BATCH_SIZE);
      }

      // Update job progress
      job.progress(Math.floor((allResults.length / data.length) * 100));

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
    const { symbols, startDate, endDate } = req.body;

    try {
      let allResults = [];
      
      // Delete existing stocks for this userId
      await Stock.destroy({
        where: { userId }
      });

      // Batch stock symbols in groups (adjust batch size as needed)
      const symbolBatches = batchArray(symbols, 10);

      // Process each batch in sequence
      for (const batch of symbolBatches) {
        const fetchPromises = batch.map(async (symbol) => {
          const pythonScript = `python3 getStockData.py ${symbol} ${startDate} ${endDate}`;

          // Fetch stock data using the Python script
          const { stdout } = await execAsync(pythonScript);
          const results = JSON.parse(stdout);
          // Process the data using the helper function
          return processStockDataForSearch(results, symbol, userId);
        });

        // Wait for all fetches in the current batch to complete
        const batchResults = await Promise.all(fetchPromises);

        // Flatten the batch results and add to allResults
        allResults = allResults.concat(...batchResults);
      }

      // Bulk insert/update if data was retrieved
      if (allResults.length > 0) {
        await Stock.bulkCreate(allResults, {
          updateOnDuplicate: ['name', 'period', 'price', 'high', 'low', 'open', 'userId'],
        });
      }

      res.json(allResults);
    } catch (error) {
      console.error('Error retrieving stock data:', error);
      res.status(500).send({ error: 'Error retrieving stock data' });
    }
  },

  downloadAllStocks: async (req, res) => {
    try {
      const userId = req.user.userId;

      // Get all stocks for the user from the Stock table
      const stocks = await Stock.findAll({
        where: { userId },
        order: [['name', 'ASC'], ['period', 'ASC']]
      });

      if (!stocks.length) {
        return res.status(200).send({ status : false, message: 'No stocks found for download' });
      }

      // Create temp directory if it doesn't exist
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

      // Create a zip archive
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });
      
      const zipFilePath = path.join(tempDir, `stocks_${userId}_${Date.now()}.zip`);
      const output = fs.createWriteStream(zipFilePath);

      archive.pipe(output);

      // Create Excel files for each stock symbol and add to zip
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

      // Send the zip file
      res.download(zipFilePath, `stocks_${moment().format('YYYY-MM-DD')}.zip`, (err) => {
        // Cleanup temp files after download
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
      res.status(500).send({
        message: 'Error downloading stocks',
        status: false
      });
    }
  },

  processExcelFile: async (req, res) => {
    try {
      const userId = req.user.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).send({ error: 'No file uploaded' });
      }

      // Read the Excel file from buffer
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (!data.length) {
        return res.status(400).send({ error: 'Excel file is empty' });
      }

      // Remove all pending and active jobs for this user
      const activeJobs = await excelProcessingQueue.getActive();
      const waitingJobs = await excelProcessingQueue.getWaiting();
      const allJobs = [...activeJobs, ...waitingJobs];

      for (const job of allJobs) {
        const jobData = await job.data;
        if (jobData && jobData.userId === userId) {
          await job.remove();
        }
      }

      // Add new job to queue
      const job = await excelProcessingQueue.add({
        data,
        userId
      });

      res.json({
        message: 'Excel file processing started',
        jobId: job.id
      });

    } catch (error) {
      console.error('Error processing Excel file:', error);
      res.status(500).send({
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
        // If no jobId, get the latest active job
        const activeJobs = await excelProcessingQueue.getActive();
        const waitingJobs = await excelProcessingQueue.getWaiting();
        const allJobs = [...activeJobs, ...waitingJobs];
        
        if (allJobs.length === 0) {
          return res.status(200).json({ state: 'completed' });
        }
        
        // Get the most recent job
        job = allJobs.reduce((latest, current) => {
          return !latest || current.timestamp > latest.timestamp ? current : latest;
        });
      }

      // Get the current state and progress
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
      res.status(500).json({ error: error.message });
    }
  }


  
};

module.exports = SearchController;