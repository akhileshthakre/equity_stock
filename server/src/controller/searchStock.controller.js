const db = require('../model');
const Stock = db.stocks
const yahooFinance = require('yahoo-finance2').default;

const SearchController = {
  getSearchStock: async (req, res) => {
    const userId = req.user.userId; 
    const { symbol, startDate, endDate } = req.body;

    try {
        const queryOptions = { period1: startDate, period2: endDate };
        const results = await yahooFinance.historical(symbol, queryOptions)
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
        })

        await Stock.bulkCreate(filteredResult);
        res.json(filteredResult)
    } catch (error) {
        res.status(500).send('Error retrieving stock data');
    }
  }
}

module.exports = SearchController
