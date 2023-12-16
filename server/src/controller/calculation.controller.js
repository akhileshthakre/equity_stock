const {Op} = require('sequelize')
const db = require('../model');
const Stock = db.stocks

const fetchRange = async (startDate, endDate)  => {
    try {
        const result = await Stock.findAll({
          where: {
            period: {
              [Op.between]: [startDate, endDate],
            },
          },
        });
        return result;
      } catch (error) {
        throw error;
      }
  }

const CalculationController = {
  fetchDateRange: async (req, res) => {
    const { startDate, endDate } = req.body;
    try {
        const result = await fetchRange(startDate, endDate);
        res.send({
            data: [...result]
          });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
  },

};

module.exports = CalculationController;
