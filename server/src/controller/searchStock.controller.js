const db = require('../model');
const Stock = db.stocks
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
        res.status(404).send({error: 'Error retrieving stock data'});
    }
  }
}

module.exports = SearchController;
