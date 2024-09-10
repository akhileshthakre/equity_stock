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

const SearchController = {
  getSearchStock: async (req, res) => {
    const userId = req.user.userId;
    const { symbols, startDate, endDate } = req.body;

    try {
      let allResults = [];
      
      // Batch stock symbols in groups of 5 to avoid overloading the system
      const symbolBatches = batchArray(symbols, 10);

      // Fetch data for each batch in parallel
      for (const batch of symbolBatches) {
        const fetchPromises = batch.map(async (symbol) => {
          const pythonScript = `python3 getStockData.py ${symbol} ${startDate} ${endDate}`;

          // Fetch stock data using the Python script
          const { stdout } = await execAsync(pythonScript);
          const results = JSON.parse(stdout);

          // Adjust data mapping to match the database schema
          return Object.keys(results.Open).map((timestamp) => {
            const date = moment(parseInt(timestamp)).format('YYYY-MM-DD HH:mm:ss');

            return {
              name: symbol,
              period: date,
              price: results['Close'][timestamp], 
              high: results['High'][timestamp],   
              low: results['Low'][timestamp],     
              open: results['Open'][timestamp],   
              userId: userId,                     
            };
          });
        });

        // Wait for all fetches in the current batch to complete
        const batchResults = await Promise.all(fetchPromises);

        // Flatten the batch results and add to allResults
        allResults = allResults.concat(...batchResults);
      }

      // Perform the bulk insert/update after fetching all batches
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

      // Batch stock symbols and fetch data for each batch in parallel
      const symbolBatches = batchArray(stocks.map((row) => row.stocks), 5);
      
      for (const batch of symbolBatches) {
        const fetchPromises = batch.map(async (symbol) => {
          const pythonScript = `python3 getStockData.py ${symbol} ${formattedYesterday} ${today}`;
          const { stdout } = await execAsync(pythonScript);
          const results = JSON.parse(stdout);

          return Object.keys(results.Open).map((timestamp) => ({
            name: symbol,
            period: moment(parseInt(timestamp)).format('YYYY-MM-DD HH:mm:ss'),
            price: results['Close'][timestamp],
            high: results['High'][timestamp],
            low: results['Low'][timestamp],
            open: results['Open'][timestamp],
            userId: userId,
          }));
        });

        // Wait for the batch to complete
        const batchResults = await Promise.all(fetchPromises);

        // Flatten and add to the final results
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
