const db = require('../model');
const { Op } = require('sequelize');
const moment = require('moment');
const StockSymbols = db.stockSymbols;
const Stock = db.stocks;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const batchArray = (arr, batchSize) => {
  const batches = [];
  for (let i = 0; i < arr.length; i += batchSize) {
    batches.push(arr.slice(i, i + batchSize));
  }
  return batches;
};

// Helper to process the fetched stock data
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
      price: results[closeKey][timestamp],
      high: results[highKey][timestamp],
      low: results[lowKey][timestamp],
      open: results[openKey][timestamp],
      userId: userId,
    };
  });
};

const SearchController = {
  getSearchStock: async (req, res) => {
    const userId = req.user.userId;
    const { symbols, startDate, endDate } = req.body;

    console.log(symbols, startDate, endDate);

    try {
      let allResults = [];
      
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
          return processStockData(results, symbol, userId);
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

      const stocks = await StockSymbols.findAll({
        where: {
          userId,
          stocks: {
            [Op.ne]: '',
            [Op.not]: null,
          },
        },
      });

      let allResults = [];
      const today = moment().format("YYYY-MM-DD");
      let yesterday = moment().subtract(1, "days");

      if (yesterday.isoWeekday() === 6 || yesterday.isoWeekday() === 7) {
        yesterday = moment().subtract(1, "weeks").weekday(5); // Last Friday
      }

      const formattedYesterday = yesterday.format("YYYY-MM-DD");

      // Batch stock symbols and process each batch in parallel
      const symbolBatches = batchArray(stocks.map((row) => row.stocks), 5);
      
      for (const batch of symbolBatches) {
        const fetchPromises = batch.map(async (symbol) => {
          const pythonScript = `python3 getStockData.py ${symbol} ${formattedYesterday} ${today}`;
          const { stdout } = await execAsync(pythonScript);
          const results = JSON.parse(stdout);
          return processStockData(results, symbol, userId);
        });

        // Wait for the batch to complete
        const batchResults = await Promise.all(fetchPromises);
        allResults = allResults.concat(...batchResults);
      }

      res.json(allResults);
    } catch (error) {
      console.error('Error retrieving stock data:', error);
      res.status(500).send({
        message: 'Error retrieving stock data. Please check stock symbols.',
        success: 'false',
      });
    }
  },
};

module.exports = SearchController;
