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

};

module.exports = UserController;
