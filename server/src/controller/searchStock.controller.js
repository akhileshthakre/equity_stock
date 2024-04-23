const db = require('../model');
const { Op } = require('sequelize');
const moment = require('moment');
const StockSymbols = db.stockSymbols;
const Stock = db.stocks;
const yahooFinance = require('yahoo-finance2').default;

const SearchController = {
  getSearchStock: async (req, res) => {
    const userId = req.user.userId; 
    const { symbols, startDate, endDate } = req.body;

    try {
        let allResults = [];

        for (const symbol of symbols) {
            const queryOptions = { period1: startDate, period2: endDate };
            const results = await yahooFinance.historical(symbol, queryOptions);
            const filteredResult = results.map((stock) => {
                stock['name'] = symbol
                stock['period'] = stock.date
                stock['price'] = stock.close
                stock['userId'] = userId
                delete stock.date
                delete stock.close
                delete stock.adjClose
                delete stock.volume
                return stock
            });

            allResults = allResults.concat(filteredResult);
        }

        if(allResults.length > 0){
            await Stock.bulkCreate(allResults, { updateOnDuplicate: ['name', 'period', 'price', 'userId'] });
        }
        
        res.json(allResults);
    } catch (error) {
        console.error('Error retrieving stock data:', error); // Improved error logging
        res.status(200).send({error: 'Error retrieving stock data'});
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
                    [Op.not]: null
                }
            },
        });
        

        let allResults = [];
        const today = moment().format("YYYY-MM-DD");
        let yesterday = moment().subtract(1, "days");

         // If yesterday is Saturday or Sunday, adjust to the previous Friday
         if (yesterday.isoWeekday() === 6 || yesterday.isoWeekday() === 7) { 
            yesterday = moment().subtract(1, "weeks").weekday(5); // Last Friday
        }

        const formattedYesterday = yesterday.format("YYYY-MM-DD");

        for (const row of stocks) {
            const queryOptions = { period1: formattedYesterday, period2: today };
            const results = await yahooFinance.historical(row.stocks, queryOptions);
            const filteredResult = results.map((stock) => {
                stock['name'] = row.stocks;
                stock['period'] = stock.date;
                stock['userId'] = userId;
                delete stock.date;
                delete stock.adjClose;
                delete stock.volume;
                return stock;
            });

            allResults = allResults.concat(filteredResult);
        }

        res.json(allResults);
    } catch (error) {
        console.error('Error retrieving stock data:', error);
        res.status(200).send({ 
            message: 'Error retrieving stock data. Please check stock symbols.' ,
            success: 'false'
    });
    }
}

}

module.exports = SearchController;
