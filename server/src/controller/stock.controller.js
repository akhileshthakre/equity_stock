const db = require('../model');
const Stock = db.stocks

const UserController = {
  getAllStock: async (req, res) => {
    try {
      const stocks = await Stock.findAll();
      res.send({
        data: [...stocks]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteAllStocks: async (req, res) => {
    try {
        await Stock.destroy({
          where: {},
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

module.exports = UserController;
