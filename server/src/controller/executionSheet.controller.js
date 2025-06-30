const db = require('../model');
const ExecutionSheet = db.executionSheet

const StockController = {
getAllData: async (req, res) => {
    const userId = req.user.userId; 
    try {
      const stocks = await ExecutionSheet.findAll({
        where: { userId },
      });
      res.send({
        data: [...stocks]
      });
    } catch (error) {
      res.status(200).json({ error: error.message });
    }
  },

  deleteAllData: async (req, res) => {
    const userId = req.user.userId; 
    try {
        await ExecutionSheet.destroy({
          where: { userId },
        });
        res.status(204).send({
            data: []
        });
      } catch (error) {
        console.error(error);
        res.status(200).json({ error: 'Internal Server Error' });
      }
  }

};

module.exports = StockController;
