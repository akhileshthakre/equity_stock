const db = require('../../model');
const Stock = db.stocks
const TestValue = db.testValues
const calculateValues = require('./_helpers/calculateValues')

const CalculationService = {
  fetchData: async (req, res) => {
    try {
        const stocks = await Stock.findAll();
        const testValues = await TestValue.findAll();

        const resp = testValues.map((testValue) => {
        const result =  calculateValues(stocks, testValue.dataValues)
        const numberOfUpMoves = result.filter(stock => stock.Ret > 0.0).length;
        const numberOfDownMoves = result.filter(stock => stock.Ret < 0.0).length;
        const totalDays = numberOfUpMoves + numberOfDownMoves
        const totalRetSum = result.reduce((acc, stock) => acc + (stock.Ret || 0), 0) * 100;
        const avgGain = numberOfUpMoves + numberOfDownMoves > 0 ? ((totalRetSum ) / 100/ (numberOfUpMoves + numberOfDownMoves)) * 100 : -1;
        const winPercent = numberOfUpMoves > 0 ? (numberOfUpMoves/totalDays) * 100 : 0
        
        return {
            fallInStock: testValue.fallInStock,
            limitLevel: testValue.limitLevel,
            hldDay: testValue.hldDay,
            numberOfUpMoves,
            numberOfDownMoves,
            totalDays,
            totalRetSum,
            avgGain,
            winPercent
        }
        })
        
        res.send({
          data: resp
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
  }
};

module.exports = CalculationService;