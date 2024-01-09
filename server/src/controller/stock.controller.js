const db = require('../model');
const Stock = db.stocks

const StockController = {
  getAllStock: async (req, res) => {
    const userId = req.user.userId; 
    try {
      const stocks = await Stock.findAll({
        where: { userId },
      });
      res.send({
        data: [...stocks]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteAllStocks: async (req, res) => {
    const userId = req.user.userId; 
    try {
        await Stock.destroy({
          where: { userId },
        });
        res.status(204).send({
            data: []
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
  }

};

module.exports = StockController;
